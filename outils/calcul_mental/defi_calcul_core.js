// Défi calcul — les modules (lot 1a, 03/10/2026 ; M2 et D2 au lot 1b ;
// le test de module au lot 2a).
//
// Un module = une fiche de données : son nom, ses niveaux, ses générateurs,
// ses erreurs connues, les trois temps de « J'apprends ». Tout texte vu par
// l'élève à propos d'un module est ICI, jamais dans la page.
//
// Les identifiants (lettre + numéro du module, numéro du niveau, numéro
// d'une cause d'erreur) sont DÉFINITIFS : des progressions d'élèves y sont
// attachées. On peut ajouter un niveau à la fin d'un module, jamais
// renuméroter ni intercaler. Un module retiré garde son code.
//
// Les générateurs sont déterministes : une graine donne toujours la même
// série (mulberry32, comme SPLAT!), ce qui permet les tests.
(function initDefiCalculCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_CALCUL_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const PALIERS = Object.freeze([
    Object.freeze({n: 1, nom: "Le socle"}),
    Object.freeze({n: 2, nom: "Les entiers"}),
    Object.freeze({n: 3, nom: "Les décimaux"}),
    Object.freeze({n: 4, nom: "Les fractions du CM"})
  ]);

  const TOTAUX = Object.freeze({F: 12, P: 10, entraine: 10});

  // ------------------------------------------------------------------ hasard

  function mulberry32(graine) {
    let a = graine >>> 0;
    return function suivant() {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Une graine à partir d'un texte (le jour, le code de l'élève…) : deux
  // appareils du même élève posent la même série.
  function graineDe(texte) {
    let h = 2166136261;
    const chaine = String(texte);
    for (let i = 0; i < chaine.length; i += 1) {
      h ^= chaine.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function entierEntre(rng, minimum, maximum) {
    return minimum + Math.floor(rng() * (maximum - minimum + 1));
  }

  function choisir(rng, liste) {
    return liste[Math.floor(rng() * liste.length)];
  }

  function melanger(rng, liste) {
    const copie = liste.slice();
    for (let i = copie.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  }

  // ----------------------------------------------------------------- nombres

  const ESPACE_FINE = " ";

  // « 2 700 », « 3,6 » : l'espace fine insécable des milliers, la virgule.
  // Jusqu'aux millionièmes (3,6 ÷ 1 000 = 0,0036 est une erreur à montrer
  // telle quelle) ; les zéros inutiles tombent (« 2,50 » s'écrit « 2,5 »).
  function formaterNombre(nombre) {
    const n = Number(nombre);
    if (!Number.isFinite(n)) return "";
    const signe = n < 0 ? "−" : "";
    const [entiere, decimales = ""] = Math.abs(n).toFixed(6).split(".");
    const groupes = entiere.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_FINE);
    const reste = decimales.replace(/0+$/, "");
    return signe + groupes + (reste ? "," + reste : "");
  }

  // Ce que l'élève a tapé, en nombre : virgule ou point, espaces ignorées,
  // « 360 » et « 360,0 » sont le même nombre, « ,5 » est 0,5. null si ce
  // n'est pas un nombre (deux virgules, une virgule seule).
  function lireReponse(texte) {
    const propre = String(texte == null ? "" : texte).replace(/[\s  ]/g, "").replace(",", ".");
    if (!/^\d+(\.\d*)?$|^\.\d+$/.test(propre)) return null;
    const nombre = Number(propre);
    return Number.isFinite(nombre) ? nombre : null;
  }

  // Un résultat décimal exact : 1,082 × 100 donne 108,2 et pas
  // 108,20000000000002 (le calcul en virgule flottante est arrondi au
  // millionième, bien au-delà des millièmes du programme).
  function exact(nombre) {
    return Number(Number(nombre).toFixed(6));
  }

  // Le nombre de chiffres après la virgule (2,5 → 1 ; 4,107 → 3 ; 360 → 0).
  function decimalesDe(nombre) {
    const texte = formaterNombre(nombre);
    const virgule = texte.indexOf(",");
    return virgule < 0 ? 0 : texte.length - virgule - 1;
  }

  function memeNombre(premier, second) {
    return typeof premier === "number" && typeof second === "number" && Math.abs(premier - second) < 1e-9;
  }

  // Un nombre dans une clé de calcul : « 36d1 » pour 3,6 (36 et 1 décimale).
  function cleNombre(nombre) {
    const texte = formaterNombre(nombre).replace(new RegExp(ESPACE_FINE, "g"), "");
    if (!texte.includes(",")) return texte;
    const [entiere, decimales] = texte.split(",");
    return `${Number(entiere + decimales)}d${decimales.length}`;
  }

  // ------------------------------------------------------------------ calculs

  const TROU = Object.freeze({trou: true});
  const CASE = "□";

  // Un calcul : le texte avec sa case, la réponse, une clé stable sans texte
  // libre, la forme, et les nombres dont les erreurs connues ont besoin.
  // Clé : module, niveau, puis les nombres dans l'ordre du texte ; la case
  // s'écrit « x », sauf quand elle est le résultat, en dernier. Le signe
  // « ÷ » s'écrit « q » (quotient) : sans lui, 30 × 10 et 30 ÷ 10 auraient
  // la même clé.
  function fabriquer(module, niveau, forme, morceaux, reponse, donnees) {
    const texte = morceaux.map(m => (m === TROU ? CASE : typeof m === "number" ? formaterNombre(m) : m)).join(" ");
    const operandes = morceaux.filter(m => m === TROU || typeof m === "number" || m === "÷");
    const derniere = operandes.map(m => m !== "÷").lastIndexOf(true);
    const cles = operandes.map((m, index) => (m === "÷" ? "q" : m === TROU ? (index === derniere ? null : "x") : cleNombre(m)))
      .filter(m => m !== null);
    return Object.freeze({
      texte, reponse, forme, module, niveau,
      cle: `${module}-${niveau}-${cles.join("-")}`,
      donnees: Object.freeze(Object.assign({}, donnees))
    });
  }

  // Tire `nombre` valeurs distinctes ; `tirer` rend une valeur, `interdits`
  // celles qui sont déjà prises (les imposés d'une validation).
  function tirerDistincts(rng, nombre, tirer, interdits = []) {
    const pris = new Set(interdits);
    const liste = [];
    let essais = 0;
    while (liste.length < nombre && essais < 5000) {
      essais += 1;
      const valeur = tirer(rng);
      if (pris.has(valeur)) continue;
      pris.add(valeur);
      liste.push(valeur);
    }
    return liste;
  }

  // Répartit un total entre des catégories dans les proportions données
  // (pour 12 ou 10 calculs) : les plus grosses parts d'abord, le reste aux
  // premières.
  function repartir(total, parts) {
    const somme = parts.reduce((s, p) => s + p, 0);
    const base = parts.map(p => Math.floor(p * total / somme));
    let manque = total - base.reduce((s, p) => s + p, 0);
    const ordre = parts.map((p, i) => [p * total / somme - base[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    for (let k = 0; manque > 0; k += 1, manque -= 1) base[ordre[k % ordre.length][1]] += 1;
    return base;
  }

  // ------------------------------------------------- A2 : compléments à 10, 100, 1 000

  function a2Complement(niveau, a, cible, extra) {
    return fabriquer("A2", niveau, "complement", [a, "+", TROU, "=", cible], cible - a, Object.assign({a, cible}, extra));
  }
  function a2Gauche(niveau, a, cible) {
    return fabriquer("A2", niveau, "complement-gauche", [TROU, "+", a, "=", cible], cible - a, {a, cible});
  }
  function a2Difference(niveau, a, cible) {
    return fabriquer("A2", niveau, "difference", [cible, "−", a, "=", TROU], cible - a, {a, cible});
  }

  const sansUniteNulle = (rng, minimum, maximum) => {
    let n = entierEntre(rng, minimum, maximum);
    while (n % 10 === 0) n = entierEntre(rng, minimum, maximum);
    return n;
  };
  const dizaineSuivante = n => (Math.floor(n / 10) + 1) * 10;
  const centaineSuivante = n => (Math.floor(n / 100) + 1) * 100;

  const A2_NOMBRES_2 = Object.freeze([10, 20, 30, 40, 50, 60, 70, 80, 90, 5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);
  const A2_NOMBRES_3 = Object.freeze(Array.from({length: 99}, (_, i) => i + 1).filter(n => n % 5 !== 0));

  // Niveau 1 : à 10, et à la dizaine suivante (cible variable : 433 + ? = 440).
  function a2Niveau1(rng, total, imposes) {
    const [dix, deux, trois] = total === 12 ? [4, 4, 4] : repartir(total, [3, 4, 3]);
    const impose = imposes.length;
    const versDix = tirerDistincts(rng, dix, r => entierEntre(r, 1, 9)).map(a => a2Complement(1, a, 10));
    const aDeux = tirerDistincts(rng, deux, r => sansUniteNulle(r, 11, 99))
      .map(n => a2Complement(1, n, dizaineSuivante(n), {suivante: true}));
    const aTrois = tirerDistincts(rng, Math.max(0, trois - impose), r => sansUniteNulle(r, 101, 999), imposes.map(c => c.donnees.a))
      .map(n => a2Complement(1, n, dizaineSuivante(n), {suivante: true}));
    return [...versDix, ...aDeux, ...aTrois, ...imposes];
  }

  // Niveau 2 : à 100, les dizaines entières et les nombres en 5.
  function a2Niveau2(rng, total, imposes) {
    const [complements, differences] = total === 12 ? [8, 4] : repartir(total, [8, 4]);
    const dejaLa = imposes.map(c => c.donnees.a);
    const nC = complements - imposes.filter(c => c.forme === "complement").length;
    const nD = differences - imposes.filter(c => c.forme === "difference").length;
    const nombres = melanger(rng, A2_NOMBRES_2.filter(a => !dejaLa.includes(a))).slice(0, nC + nD);
    return [
      ...nombres.slice(0, nC).map(a => a2Complement(2, a, 100)),
      ...nombres.slice(nC).map(a => a2Difference(2, a, 100)),
      ...imposes
    ];
  }

  // Niveau 3 : à 100, tous les nombres (ni dizaine entière ni multiple de 5).
  function a2Niveau3(rng, total, imposes) {
    const [complements, gauches, differences] = repartir(total, [5, 2, 3]);
    const dejaLa = imposes.map(c => c.donnees.a);
    const nC = Math.max(0, complements - imposes.length);
    const nombres = melanger(rng, A2_NOMBRES_3.filter(a => !dejaLa.includes(a))).slice(0, nC + gauches + differences);
    return [
      ...nombres.slice(0, nC).map(a => a2Complement(3, a, 100)),
      ...nombres.slice(nC, nC + gauches).map(a => a2Gauche(3, a, 100)),
      ...nombres.slice(nC + gauches).map(a => a2Difference(3, a, 100)),
      ...imposes
    ];
  }

  // Niveau 4 : à 1\u202f000 sur des dizaines entières, et à la centaine suivante.
  function a2Niveau4(rng, total, imposes) {
    const [versMille, suivantes] = repartir(total, [7, 3]);
    const [centaines, cinquantaines, dizaines] = repartir(versMille, [2, 2, 3]);
    const imposeMille = imposes.filter(c => !c.donnees.suivante);
    const imposeSuivante = imposes.filter(c => c.donnees.suivante);
    const dejaLa = imposes.map(c => c.donnees.a);
    const nombres = [
      ...tirerDistincts(rng, centaines, r => entierEntre(r, 1, 9) * 100, dejaLa),
      ...tirerDistincts(rng, Math.max(0, cinquantaines - imposeMille.length), r => entierEntre(r, 0, 9) * 100 + 50, dejaLa),
      ...tirerDistincts(rng, dizaines, r => {
        let a = entierEntre(r, 1, 99) * 10;
        while (a % 50 === 0) a = entierEntre(r, 1, 99) * 10;
        return a;
      }, dejaLa)
    ];
    // Les formes des calculs vers 1\u202f000 : 4 compléments, 1 complément à
    // gauche, 2 différences (l'imposé « 650 + ? = 1\u202f000 » est un complément).
    const [nC, nG] = repartir(versMille, [4, 1, 2]);
    const formes = melanger(rng, nombres.map((_, i) => {
      const rang = i + imposeMille.length;
      return rang < nC ? "complement" : rang < nC + nG ? "gauche" : "difference";
    }));
    const tires = nombres.map((a, i) => (formes[i] === "complement" ? a2Complement(4, a, 1000)
      : formes[i] === "gauche" ? a2Gauche(4, a, 1000) : a2Difference(4, a, 1000)));
    const aSuivre = tirerDistincts(rng, Math.max(0, suivantes - imposeSuivante.length), r => {
      let n = entierEntre(r, 11, 99) * 10;
      while (n % 100 === 0) n = entierEntre(r, 11, 99) * 10;
      return n;
    }, [...dejaLa, ...nombres]).map(n => a2Complement(4, n, centaineSuivante(n), {suivante: true}));
    return [...tires, ...aSuivre, ...imposes];
  }

  // Les deux sauts d'un complément : jusqu'au palier (dizaine ou centaine
  // suivante), puis jusqu'à la cible. Un seul saut quand il n'y a pas de
  // palier à passer (cible à 10, dizaine suivante, nombre déjà « rond »).
  function a2Sauts(calcul) {
    const {a, cible, suivante} = calcul.donnees;
    const pas = cible / 10;
    if (suivante || cible === 10 || a % pas === 0) return {palier: null, sauts: [cible - a]};
    const palier = (Math.floor(a / pas) + 1) * pas;
    if (palier === cible) return {palier: null, sauts: [cible - a]};
    return {palier, sauts: [palier - a, cible - palier]};
  }

  function a2Image(calcul, gras = 0) {
    const {a} = calcul.donnees;
    const {sauts} = a2Sauts(calcul);
    return {outil: "droite-sauts", depart: a, sauts: sauts.map(val => ({val})), gras: sauts.length > 1 ? gras : 0};
  }

  const A2_ERREURS = Object.freeze([
    Object.freeze({
      c: 3, nom: "l’arrivée donnée",
      test: (calcul, reponse) => memeNombre(reponse, calcul.donnees.cible),
      retour: calcul => `Tu as écrit l’arrivée. Combien faut-il ajouter à ${formaterNombre(calcul.donnees.a)} pour arriver à ${formaterNombre(calcul.donnees.cible)}\u00a0?`,
      gras: 0
    }),
    Object.freeze({
      c: 1, nom: "chaque chiffre complété à 10",
      test: (calcul, reponse) => {
        const {a, cible} = calcul.donnees;
        const {palier} = a2Sauts(calcul);
        return palier !== null && memeNombre(reponse, cible + cible / 10 - a);
      },
      retour: (calcul, reponse) => {
        const {a, cible} = calcul.donnees;
        return `${formaterNombre(a)} + ${formaterNombre(reponse)} = ${formaterNombre(a + reponse)}, c’est trop. Va d’abord à ${formaterNombre(a2Sauts(calcul).palier)}, puis à ${formaterNombre(cible)}.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 4, nom: "arrêt au premier saut",
      test: (calcul, reponse) => {
        const {palier} = a2Sauts(calcul);
        return palier !== null && memeNombre(reponse, palier - calcul.donnees.a);
      },
      retour: (calcul, reponse) => {
        const {a, cible} = calcul.donnees;
        const palier = formaterNombre(a2Sauts(calcul).palier);
        return `${formaterNombre(a)} + ${formaterNombre(reponse)} = ${palier}, tu n’es pas encore à ${formaterNombre(cible)}. Continue\u00a0: de ${palier} à ${formaterNombre(cible)}.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 2, nom: "une dizaine (centaine) perdue",
      test: (calcul, reponse) => {
        const {cible, suivante} = calcul.donnees;
        if (suivante || cible === 10) return false;
        return memeNombre(reponse, calcul.reponse - cible / 10) && reponse > 0;
      },
      retour: (calcul, reponse) => {
        const {a, cible} = calcul.donnees;
        const {palier} = a2Sauts(calcul);
        const depart = palier === null ? a : palier;
        return `${formaterNombre(a)} + ${formaterNombre(reponse)} = ${formaterNombre(a + reponse)}. Il manque ${formaterNombre(cible / 10)}\u00a0: de ${formaterNombre(depart)} à ${formaterNombre(cible)}, c’est + ${formaterNombre(cible - depart)}.`;
      },
      gras: 2
    })
  ]);

  // -------------------------------------------- A5 : ajouter 9, 19, 29… et 8, 18, 28…

  function a5Somme(niveau, n, a) {
    return fabriquer("A5", niveau, "somme", [n, "+", a, "=", TROU], n + a, {n, a});
  }

  const a5Passage = n => Math.floor(n / 10) % 10 === 9 && n % 10 >= 1;

  function a5Niveau(niveau, ajouts) {
    return function composer(rng, total, imposes) {
      const dejaLa = imposes.map(c => c.donnees.n);
      const manque = Math.max(0, total - imposes.length);
      let nombres = tirerDistincts(rng, manque, r => sansUniteNulle(r, 11, 899), dejaLa);
      if (niveau === 1) {
        // Au moins 2 passages de centaine sur 10 (94 + 9), imposés compris.
        const voulus = 2 - [...dejaLa, ...nombres].filter(a5Passage).length;
        const passages = tirerDistincts(rng, Math.max(0, voulus),
          r => entierEntre(r, 0, 8) * 100 + 90 + entierEntre(r, 1, 9), [...dejaLa, ...nombres]);
        // Ils prennent la place de nombres qui ne sont pas déjà des passages.
        passages.forEach(p => {
          const place = nombres.findIndex(n => !a5Passage(n));
          if (place >= 0) nombres[place] = p;
        });
        nombres = melanger(rng, nombres);
      }
      return [...nombres.map(n => a5Somme(niveau, n, choisir(rng, ajouts))), ...imposes];
    };
  }

  const a5Arrondi = a => Math.ceil(a / 10) * 10;

  function a5Image(calcul, gras = 0) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    return {outil: "droite-sauts", depart: n, sauts: [{val: r}, {val: a - r}], direct: a, acquis: [2], gras};
  }

  const A5_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "retour oublié",
      test: (calcul, reponse) => memeNombre(reponse, calcul.donnees.n + a5Arrondi(calcul.donnees.a)),
      retour: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} + ${r}. Il reste à enlever ${r - a}.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 2, nom: "retour dans le mauvais sens",
      test: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return memeNombre(reponse, n + r + (r - a));
      },
      retour: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} + ${r} + ${r - a}. Après + ${r}, il faut enlever ${r - a}, pas l’ajouter.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 3, nom: "dizaines oubliées",
      test: (calcul, reponse) => calcul.donnees.a >= 18 && memeNombre(reponse, calcul.donnees.n + calcul.donnees.a % 10),
      retour: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} + ${a % 10}. + ${a}, c’est + ${r} puis − ${r - a}.`;
      },
      gras: 1
    }),
    Object.freeze({
      c: 4, nom: "retour de 1 au lieu de 2",
      test: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return r - a === 2 && memeNombre(reponse, n + r - 1);
      },
      retour: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} + ${r} − 1. Pour + ${a}, c’est + ${r} puis − 2.`;
      },
      gras: 2
    })
  ]);

  // Les trois temps de « J'apprends » d'un niveau d'A5 : le rekenrek (une
  // rangée entière d'un coup, puis on retire), la droite (le détour dessus,
  // le saut direct dessous), l'écriture en ligne.
  function a5Apprends(n, a, bilan) {
    const r = a5Arrondi(a);
    const d = r - a;
    const rangees = r / 10;
    const consigne = rangees === 1
      ? `Pousse 10 perles d’un coup, puis retires-en ${d}.`
      : `Pousse ${r} perles, 10 d’un coup, puis retires-en ${d}${d > 1 ? " d’un coup" : ""}.`;
    return Object.freeze({
      exemple: Object.freeze({texte: `${n} + ${a}`, reponse: n + a}),
      manipule: Object.freeze({
        outil: "perles", depart: n,
        gestes: Object.freeze([...Array.from({length: rangees}, () => 10), -d]),
        consigne,
        traces: Object.freeze([
          Object.freeze({apres: rangees, attente: `${n} + ${r} = …`, texte: `${n} + ${r} = ${n + r}`}),
          Object.freeze({apres: rangees + 1, attente: `${n + r} − ${d} = …`, texte: `${n + r} − ${d} = ${n + a}`})
        ])
      }),
      represente: Object.freeze({
        outil: "droite-sauts",
        consigne: `+ ${a}, c’est + ${r} puis − ${d}.`,
        texte: `${n} + ${a} = ${CASE}`, reponse: n + a,
        image: Object.freeze({outil: "droite-sauts", depart: n, sauts: [{val: r}, {val: -d}], direct: a, inconnue: 2, acquis: [1]})
      }),
      ecris: Object.freeze({
        lignes: Object.freeze([`${n} + ${a}`, `= ${n} + ${r} − ${d}`, `= ${n + r} − ${d}`, `= ${CASE}`]),
        reponse: n + a, suite: true
      }),
      bilan,
      image: Object.freeze({outil: "droite-sauts", depart: n, sauts: [{val: r}, {val: -d}], direct: a, acquis: [2]})
    });
  }

  // Les trois temps d'un niveau d'A2. Sur le rekenrek, la consigne ne dit
  // jamais le nombre de perles : c'est lui qu'on cherche.
  function a2Apprends({a, cible, manipule, consigne, lignes, bilan, masque}) {
    const calcul = a2Complement(0, a, cible, cible !== 10 && cible !== 100 && cible !== 1000 ? {suivante: true} : {});
    const {palier, sauts} = a2Sauts(calcul);
    const image = {outil: "droite-sauts", depart: a, sauts: sauts.map(val => ({val}))};
    return Object.freeze({
      exemple: Object.freeze({texte: `${formaterNombre(a)} + ? = ${formaterNombre(cible)}`, reponse: cible - a}),
      manipule: manipule ? Object.freeze({
        outil: "perles", depart: a,
        gestes: Object.freeze(palier === null
          ? (cible - a < 10 ? [cible - a] : Array.from({length: (cible - a) / 10}, () => 10))
          : [palier - a, ...Array.from({length: (cible - palier) / 10}, () => 10)]),
        consigne: manipule,
        traces: Object.freeze(palier === null
          ? [Object.freeze({apres: cible - a < 10 ? 1 : (cible - a) / 10, attente: `${a} + … = ${cible}`, texte: `${a} + ${cible - a} = ${cible}`})]
          : [
            Object.freeze({apres: 1, attente: `${a} + … = ${palier}`, texte: `${a} + ${palier - a} = ${palier}`}),
            Object.freeze({apres: 1 + (cible - palier) / 10, attente: `${palier} + … = ${cible}`, texte: `${palier} + ${cible - palier} = ${cible}`})
          ])
      }) : null,
      represente: Object.freeze({
        outil: "droite-sauts", consigne,
        texte: `${formaterNombre(a)} + ${CASE} = ${formaterNombre(cible)}`, reponse: cible - a,
        // Un seul saut : son étiquette serait la réponse, elle reste « + ? ».
        image: Object.freeze(Object.assign({}, image, masque ? {sauts: sauts.map(val => ({val, masque: true}))} : {}))
      }),
      ecris: Object.freeze({lignes: Object.freeze(lignes), reponse: cible - a, suite: false}),
      bilan,
      image: Object.freeze(image)
    });
  }

  // --------------------------------------------- M2, D2 : × 10, × 100, × 1 000

  const PUISSANCES = Object.freeze([10, 100, 1000]);
  const colonnesDe = p => Math.round(Math.log10(p));
  const pluriel = (nombre, mot) => `${nombre} ${mot}${nombre > 1 ? "s" : ""}`;
  // « 2,50 » tel que l'élève l'a tapé (le point devient une virgule) ; à
  // défaut, le nombre écrit proprement.
  const commeEcrit = (reponse, ecrit) => (ecrit ? String(ecrit).replace(/\./g, ",") : formaterNombre(reponse));

  // Les formes communes aux deux modules. Les nombres utiles aux erreurs
  // connues : n (le nombre multiplié), p (10, 100 ou 1 000), m = n × p.
  function produit(module, niveau, n, p, gauche = false) {
    const m = exact(n * p);
    return gauche
      ? fabriquer(module, niveau, "produit-gauche", [p, "×", n, "=", TROU], m, {n, p, m})
      : fabriquer(module, niveau, "produit", [n, "×", p, "=", TROU], m, {n, p, m});
  }
  // n × □ = m : la réponse est la puissance.
  const trouFacteur = (module, niveau, n, p) => fabriquer(module, niveau, "trou-facteur", [n, "×", TROU, "=", exact(n * p)], p, {n, p, m: exact(n * p)});
  // m = n × □ : la réponse est la puissance, l'égalité écrite à l'envers.
  const trouEgal = (module, niveau, n, p) => fabriquer(module, niveau, "trou-egal", [exact(n * p), "=", n, "×", TROU], p, {n, p, m: exact(n * p)});
  // □ × p = m : la réponse est le nombre.
  const trouNombre = (module, niveau, n, p) => fabriquer(module, niveau, "trou-nombre", [TROU, "×", p, "=", exact(n * p)], n, {n, p, m: exact(n * p)});
  // p × □ = m : la réponse est le nombre.
  const trouNombreGauche = (module, niveau, n, p) => fabriquer(module, niveau, "trou-nombre-gauche", [p, "×", TROU, "=", exact(n * p)], n, {n, p, m: exact(n * p)});
  // m ÷ p = □ : la réponse est n.
  const division = (module, niveau, n, p) => fabriquer(module, niveau, "division", [exact(n * p), "÷", p, "=", TROU], n, {n, p, m: exact(n * p)});

  const estProduit = calcul => calcul.forme === "produit" || calcul.forme === "produit-gauche";
  const estTrouNombre = calcul => calcul.forme === "trou-nombre" || calcul.forme === "trou-nombre-gauche";

  // Tire `nombre` calculs aux clés toutes différentes (et différentes de
  // celles des imposés). `tirer(rng)` rend un calcul.
  function tirerCalculs(rng, nombre, tirer, deja = []) {
    const cles = new Set(deja.map(c => c.cle));
    const liste = [];
    let essais = 0;
    while (liste.length < nombre && essais < 5000) {
      essais += 1;
      const calcul = tirer(rng);
      if (cles.has(calcul.cle)) continue;
      cles.add(calcul.cle);
      liste.push(calcul);
    }
    return liste;
  }

  // Les entiers de M2 : de 2 à 999, chiffre des unités non nul, à 1, 2 ou 3
  // chiffres.
  const M2_CHIFFRES = Object.freeze([[2, 9], [11, 99], [101, 999]]);
  const entierM2 = (rng, chiffres = entierEntre(rng, 1, 3)) => sansUniteNulle(rng, ...M2_CHIFFRES[chiffres - 1]);

  // Niveau 1 : les produits. 3 nombres à un chiffre, 4 à deux, 3 à trois ;
  // 7 « n × p », 3 « p × n ».
  function m2Niveau1(rng, total, imposes) {
    const classes = repartir(total, [3, 4, 3]);
    const [, gauches] = repartir(total, [7, 3]);
    const longueur = c => String(c.donnees.n).length;
    const nombres = [];
    classes.forEach((voulu, i) => {
      const manque = Math.max(0, voulu - imposes.filter(c => longueur(c) === i + 1).length);
      nombres.push(...tirerDistincts(rng, manque, r => entierM2(r, i + 1), [...imposes.map(c => c.donnees.n), ...nombres]));
    });
    const nG = Math.max(0, gauches - imposes.filter(c => c.forme === "produit-gauche").length);
    const aGauche = melanger(rng, nombres.map((_, i) => i < nG));
    return [...nombres.map((n, i) => produit("M2", 1, n, choisir(rng, PUISSANCES), aGauche[i])), ...imposes];
  }

  // Niveau 2 : 3 produits de nombres en 0 (30 × 100), 4 trous (2 sur la
  // puissance, 2 sur le nombre), 3 divisions exactes.
  function m2Niveau2(rng, total, imposes) {
    const [produits, trous, divisions] = repartir(total, [3, 4, 3]);
    const [facteurs, nombres] = repartir(trous, [1, 1]);
    const manque = forme => imposes.filter(c => c.forme === forme).length;
    const deja = imposes.slice();
    const tirer = (nombre, fabrique) => {
      const liste = tirerCalculs(rng, Math.max(0, nombre), fabrique, deja);
      deja.push(...liste);
      return liste;
    };
    return [
      ...tirer(produits - manque("produit"), r => produit("M2", 2, entierEntre(r, 1, 99) * 10, choisir(r, PUISSANCES))),
      ...tirer(facteurs - manque("trou-facteur"), r => trouFacteur("M2", 2, entierM2(r), choisir(r, PUISSANCES))),
      ...tirer(nombres - manque("trou-nombre"), r => trouNombre("M2", 2, entierM2(r), choisir(r, PUISSANCES))),
      ...tirer(divisions - manque("division"), r => division("M2", 2, entierM2(r), choisir(r, PUISSANCES))),
      ...imposes
    ];
  }

  // Le tableau à flèches d'un calcul, la réponse montrée (après une erreur,
  // à la phrase-bilan) : en haut le nombre de départ, en bas l'arrivée.
  function tableauDe(calcul) {
    const {n, p, m} = calcul.donnees;
    if (calcul.forme === "division") return {outil: "tableau-fleches", depart: m, arrivee: n, p, operation: "÷", virgule: calcul.module === "D2"};
    return {outil: "tableau-fleches", depart: n, arrivee: m, p, operation: "×", virgule: calcul.module === "D2"};
  }

  // Les erreurs connues de M2. « Un rang de trop », « un rang de moins » :
  // sur les produits ; « le résultat recopié » : sur n × □ = m ; « mauvais
  // sens » : sur les divisions et sur □ × p = m. Ailleurs, le retour de
  // Défi tables.
  const M2_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "un rang de trop",
      test: (calcul, reponse) => estProduit(calcul) && memeNombre(reponse, exact(calcul.reponse * 10)),
      retour: (calcul, reponse) => {
        const {n, p} = calcul.donnees;
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} × ${formaterNombre(p * 10)}. Pour × ${formaterNombre(p)}, chaque chiffre vaut ${formaterNombre(p)} fois plus : ${formaterNombre(n)} → ${formaterNombre(calcul.reponse)}.`;
      }
    }),
    Object.freeze({
      c: 2, nom: "un rang de moins",
      test: (calcul, reponse) => estProduit(calcul) && memeNombre(reponse, exact(calcul.reponse / 10)),
      retour: (calcul, reponse) => {
        const {n, p} = calcul.donnees;
        // × 10 : le nombre est revenu tel quel (38 × 10 → 38). « 38, c'est
        // 38 × 1 » se lisait mal : la phrase de D2 pour la même erreur.
        if (p === 10) return `${formaterNombre(reponse)} = ${formaterNombre(n)} : tu n’as pas multiplié. Chaque chiffre doit valoir ${formaterNombre(p)} fois plus : ${formaterNombre(n)} → ${formaterNombre(calcul.reponse)}.`;
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} × ${formaterNombre(p / 10)}. Pour × ${formaterNombre(p)}, chaque chiffre vaut ${formaterNombre(p)} fois plus : ${formaterNombre(n)} → ${formaterNombre(calcul.reponse)}.`;
      }
    }),
    Object.freeze({
      c: 3, nom: "le résultat recopié",
      test: (calcul, reponse) => calcul.forme === "trou-facteur" && memeNombre(reponse, calcul.donnees.m),
      retour: calcul => {
        const {n, m} = calcul.donnees;
        return `${formaterNombre(m)}, c’est l’arrivée. Par combien faut-il multiplier ${formaterNombre(n)} pour obtenir ${formaterNombre(m)} ?`;
      }
    }),
    Object.freeze({
      c: 4, nom: "mauvais sens",
      test: (calcul, reponse) => (calcul.forme === "division" || calcul.forme === "trou-nombre") && memeNombre(reponse, exact(calcul.donnees.m * calcul.donnees.p)),
      retour: (calcul, reponse) => {
        const {p, m} = calcul.donnees;
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(m)} × ${formaterNombre(p)}. Ici on cherche un nombre ${formaterNombre(p)} fois plus petit que ${formaterNombre(m)}.`;
      }
    })
  ]);

  // Les décimaux de D2 : `decimales` chiffres après la virgule, le dernier
  // non nul ; la partie entière entre `minimum` et `maximum`.
  function decimal(rng, decimales, minimum, maximum) {
    const base = 10 ** decimales;
    let fraction = entierEntre(rng, 1, base - 1);
    while (fraction % 10 === 0) fraction = entierEntre(rng, 1, base - 1);
    return exact(entierEntre(rng, minimum, maximum) + fraction / base);
  }
  // Une partie entière à 1, 2 ou 3 chiffres (autant de chances chacune),
  // jamais au-delà de `plafond` ; 0 quand le nombre doit être sous 1.
  function partieEntiere(rng, plafond, sousUn = false) {
    if (sousUn) return 0;
    const classes = [[1, 9], [10, 99], [100, 999]].filter(([minimum]) => minimum <= plafond);
    const [minimum, maximum] = choisir(rng, classes);
    return entierEntre(rng, minimum, Math.min(maximum, plafond));
  }
  const decimalD2 = (rng, decimales, plafond, sousUn = false) => {
    const entiere = partieEntiere(rng, plafond, sousUn);
    return decimal(rng, decimales, entiere, entiere);
  };

  // Une liste de « places » (décimales, puissance, sous 1, à gauche) à
  // remplir : celles que les imposés occupent déjà sont retirées une à une.
  function retirerImposes(places, imposes, correspond) {
    const restantes = places.slice();
    imposes.forEach(impose => {
      const index = restantes.findIndex(place => correspond(place, impose));
      if (index >= 0) restantes.splice(index, 1);
    });
    return restantes;
  }

  // Niveau 1 : × 10. 4 nombres à 1 décimale, 3 à 2, 3 à 3 ; 2 sous 1 (0,6) ;
  // « 10 × n » sur 2 calculs.
  function d2Niveau1(rng, total, imposes) {
    const parts = repartir(total, [4, 3, 3]);
    let places = parts.flatMap((nombre, i) => Array.from({length: nombre}, () => ({d: i + 1})));
    places = retirerImposes(places, imposes, (place, c) => place.d === decimalesDe(c.donnees.n));
    const sousUn = Math.max(0, 2 - imposes.filter(c => c.donnees.n < 1).length);
    const gauches = Math.max(0, 2 - imposes.filter(c => c.forme === "produit-gauche").length);
    const ordre = melanger(rng, places.map((_, i) => i));
    ordre.slice(0, sousUn).forEach(i => { places[i].sousUn = true; });
    melanger(rng, places.map((_, i) => i)).slice(0, gauches).forEach(i => { places[i].gauche = true; });
    const deja = imposes.slice();
    const tires = places.map(place => {
      const [calcul] = tirerCalculs(rng, 1, r => produit("D2", 1, decimalD2(r, place.d, 999, place.sousUn), 10, place.gauche), deja);
      deja.push(calcul);
      return calcul;
    });
    return [...tires, ...imposes];
  }

  // Niveau 2 : × 100 sur 2 ou 3 décimales (n < 100), × 1 000 sur 3 décimales
  // (n < 10) — la puissance ne dépasse jamais le nombre de décimales.
  function d2Niveau2(rng, total, imposes) {
    const [cent, mille] = repartir(total, [6, 4]);
    const [deux, trois] = repartir(cent, [1, 1]);
    let places = [
      ...Array.from({length: deux}, () => ({p: 100, d: 2})),
      ...Array.from({length: trois}, () => ({p: 100, d: 3})),
      ...Array.from({length: mille}, () => ({p: 1000, d: 3}))
    ];
    places = retirerImposes(places, imposes, (place, c) => place.p === c.donnees.p && place.d === decimalesDe(c.donnees.n));
    const deja = imposes.slice();
    const tires = places.map(place => {
      const [calcul] = tirerCalculs(rng, 1, r => produit("D2", 2, decimalD2(r, place.d, place.p === 100 ? 99 : 9), place.p), deja);
      deja.push(calcul);
      return calcul;
    });
    return [...tires, ...imposes];
  }

  // Niveau 3 : des zéros à écrire — × 100 sur 1 décimale (n < 100), × 1 000
  // sur 1 ou 2 décimales (n < 10) ; 2 calculs avec n < 1 (0,2 × 100).
  function d2Niveau3(rng, total, imposes) {
    const [cent, mille] = repartir(total, [1, 1]);
    const [une, deux] = repartir(mille, [3, 2]);
    let places = [
      ...Array.from({length: cent}, () => ({p: 100, d: 1})),
      ...Array.from({length: une}, () => ({p: 1000, d: 1})),
      ...Array.from({length: deux}, () => ({p: 1000, d: 2}))
    ];
    places = retirerImposes(places, imposes, (place, c) => place.p === c.donnees.p && place.d === decimalesDe(c.donnees.n));
    const sousUn = Math.max(0, 2 - imposes.filter(c => c.donnees.n < 1).length);
    melanger(rng, places.map((_, i) => i)).slice(0, sousUn).forEach(i => { places[i].sousUn = true; });
    const deja = imposes.slice();
    const tires = places.map(place => {
      const [calcul] = tirerCalculs(rng, 1, r => produit("D2", 3, decimalD2(r, place.d, place.p === 100 ? 99 : 9, place.sousUn), place.p), deja);
      deja.push(calcul);
      return calcul;
    });
    return [...tires, ...imposes];
  }

  // Un nombre et une puissance pour un trou : 1 à 3 décimales, le produit
  // sous 10 000, et la puissance ne dépasse pas toujours les décimales.
  function nombreEtPuissance(rng) {
    const p = choisir(rng, PUISSANCES);
    const d = entierEntre(rng, 1, 3);
    return [decimalD2(rng, d, Math.min(999, Math.floor(9999 / p))), p];
  }

  // Niveau 4 : les trous. 4 sur la puissance (n × □ = m, m = n × □), 6 sur
  // le nombre (□ × p = m, p × □ = m).
  function d2Niveau4(rng, total, imposes) {
    const [puissance, nombre] = repartir(total, [4, 6]);
    const [facteurs, egaux] = repartir(puissance, [1, 1]);
    const [droits, gauches] = repartir(nombre, [1, 1]);
    const manque = forme => imposes.filter(c => c.forme === forme).length;
    const deja = imposes.slice();
    const tirer = (nombreVoulu, fabrique) => {
      const liste = tirerCalculs(rng, Math.max(0, nombreVoulu), r => fabrique(...nombreEtPuissance(r)), deja);
      deja.push(...liste);
      return liste;
    };
    return [
      ...tirer(facteurs - manque("trou-facteur"), (n, p) => trouFacteur("D2", 4, n, p)),
      ...tirer(egaux - manque("trou-egal"), (n, p) => trouEgal("D2", 4, n, p)),
      ...tirer(droits - manque("trou-nombre"), (n, p) => trouNombre("D2", 4, n, p)),
      ...tirer(gauches - manque("trou-nombre-gauche"), (n, p) => trouNombreGauche("D2", 4, n, p)),
      ...imposes
    ];
  }

  // Les erreurs connues de D2, essayées dans l'ordre 1, 3, 2, 4, 5. Sur les
  // produits toutes les cinq ; sur □ × p = m (et p × □ = m), seulement
  // « mauvais sens » ; sur les trous de la puissance, aucune.
  const D2_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "un zéro ajouté, le nombre n’a pas changé",
      test: (calcul, reponse) => estProduit(calcul) && memeNombre(reponse, calcul.donnees.n),
      retour: (calcul, reponse, ecrit) => {
        const {n, p} = calcul.donnees;
        return `${commeEcrit(reponse, ecrit)} = ${formaterNombre(n)} : tu n’as pas multiplié. Chaque chiffre doit valoir ${formaterNombre(p)} fois plus : ${formaterNombre(n)} → ${formaterNombre(calcul.reponse)}.`;
      }
    }),
    Object.freeze({
      c: 3, nom: "seule la partie entière multipliée",
      test: (calcul, reponse) => {
        if (!estProduit(calcul)) return false;
        const {n, p} = calcul.donnees;
        return Math.trunc(n) > 0 && memeNombre(reponse, exact(Math.trunc(n) * p + (n - Math.trunc(n))));
      },
      retour: (calcul, reponse) => {
        const {n, p} = calcul.donnees;
        return `Dans ${formaterNombre(reponse)}, le ${formaterNombre(exact(n - Math.trunc(n)))} n’a pas bougé. Lui aussi vaut ${formaterNombre(p)} fois plus.`;
      }
    }),
    Object.freeze({
      c: 2, nom: "un rang de moins",
      test: (calcul, reponse) => estProduit(calcul) && memeNombre(reponse, exact(calcul.reponse / 10)),
      retour: (calcul, reponse) => {
        const {n, p} = calcul.donnees;
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} × ${formaterNombre(p / 10)}. Pour × ${formaterNombre(p)}, chaque chiffre glisse de ${pluriel(colonnesDe(p), "colonne")} : ${formaterNombre(n)} → ${formaterNombre(calcul.reponse)}.`;
      }
    }),
    Object.freeze({
      c: 4, nom: "mauvais sens",
      test: (calcul, reponse) => {
        const {n, p, m} = calcul.donnees;
        if (estProduit(calcul)) return memeNombre(reponse, exact(n / p));
        return estTrouNombre(calcul) && memeNombre(reponse, exact(m * p));
      },
      // Sur un trou, l'élève a multiplié au lieu de chercher le nombre : la
      // phrase de M2 pour la même erreur.
      retour: (calcul, reponse) => {
        const p = formaterNombre(calcul.donnees.p);
        if (estTrouNombre(calcul)) return `${formaterNombre(reponse)}, c’est ${formaterNombre(calcul.donnees.m)} × ${p}. Ici on cherche un nombre ${p} fois plus petit que ${formaterNombre(calcul.donnees.m)}.`;
        return `${formaterNombre(reponse)}, c’est ${p} fois plus petit. Ici il faut ${p} fois plus grand.`;
      }
    }),
    Object.freeze({
      c: 5, nom: "un rang de trop",
      test: (calcul, reponse) => estProduit(calcul) && memeNombre(reponse, exact(calcul.reponse * 10)),
      retour: (calcul, reponse) => {
        const {n, p} = calcul.donnees;
        const k = colonnesDe(p);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} × ${formaterNombre(p * 10)}. Pour × ${formaterNombre(p)}, c’est ${pluriel(k, "colonne")}, pas ${k + 1}.`;
      }
    })
  ]);

  // Les trois temps d'un niveau de M2 ou D2 : le glisse-nombres (les
  // chiffres glissent, la virgule ne bouge pas), le tableau à flèches, la
  // décomposition écrite.
  //   calcul    : l'exemple, fabriqué comme un calcul de la série
  //   colonnes  : les rangs du glisse-nombres (5 = centaines de mille,
  //               0 = unités, −3 = millièmes)
  //   consigne  : celle du glisse-nombres et du tableau
  //   refus     : la phrase d'un glissement faux (null : la consigne tremble)
  //   inconnue  : ce que le tableau cache, « arrivee » ou « puissance »
  function glisseApprends({calcul, exemple, colonnes, consigne, consigneTableau = consigne, refus, trace, lignes, suite, bilan, inconnue = "arrivee"}) {
    const image = tableauDe(calcul);
    const {n, p, m} = calcul.donnees;
    const decalage = calcul.forme === "division" ? -colonnesDe(p) : colonnesDe(p);
    return Object.freeze({
      exemple: Object.freeze({texte: exemple, reponse: calcul.reponse}),
      manipule: Object.freeze({
        outil: "glisse", depart: calcul.forme === "division" ? m : n, colonnes: Object.freeze(colonnes.slice()),
        decalage, consigne, refus,
        traces: Object.freeze([Object.freeze({apres: 1, attente: trace[0], texte: trace[1]})])
      }),
      represente: Object.freeze({
        outil: "tableau-fleches", consigne: consigneTableau,
        texte: calcul.texte, reponse: calcul.reponse,
        // L'arrivée cherchée : ses zéros à écrire sont des « ? ». La
        // puissance cherchée : l'étiquette dit « × ? ».
        image: Object.freeze(Object.assign({}, image, inconnue === "puissance" ? {masque: true} : {inconnue: true}))
      }),
      ecris: Object.freeze({lignes: Object.freeze(lignes), reponse: calcul.reponse, suite}),
      bilan,
      image: Object.freeze(image)
    });
  }

  const COLONNES_M2 = Object.freeze([5, 4, 3, 2, 1, 0]);
  const COLONNES_D2 = Object.freeze([3, 2, 1, 0, -1, -2, -3]);
  const MILLE = `1${ESPACE_FINE}000`;

  // ------------------------------------------------------------- les 71 modules

  const niveauxVides = nombre => Array.from({length: nombre}, (_, i) => ({n: i + 1}));

  const A2 = {
    id: "A2", nom: "Compléments à 10, 100, 1\u202f000", exemple: "37 + ? = 100",
    famille: "A", palier: 1, rang: 2, avant: ["A1"], construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A2_ERREURS, image: a2Image,
    niveaux: [
      {
        n: 1, titre: "à 10, dizaine suivante", nom: "Compléments à 10", type: "F", avant: [],
        composer: a2Niveau1,
        imposes: [a2Complement(1, 433, 440, {suivante: true})],
        apprends: a2Apprends({
          a: 67, cible: 70, masque: true,
          manipule: "Finis la rangée d’un coup.",
          consigne: "De 67 à 70, il manque les unités.",
          lignes: [`67 + ${CASE} = 70`],
          bilan: "Pour aller à la dizaine suivante, je complète les unités."
        })
      },
      {
        n: 2, titre: "à 100\u00a0: dizaines et nombres en 5", nom: "Compléments à 100\u00a0: dizaines", type: "F", avant: ["A2-1"],
        composer: a2Niveau2,
        imposes: [a2Complement(2, 75, 100), a2Difference(2, 35, 100)],
        apprends: a2Apprends({
          a: 40, cible: 100, masque: true,
          manipule: "Pousse les rangées qui manquent, 10 perles d’un coup.",
          consigne: "De 40 à 100, je compte les dizaines.",
          lignes: [`40 + ${CASE} = 100`],
          bilan: "40 et 60, 30 et 70… les dizaines qui font 100, je les sais."
        })
      },
      {
        n: 3, titre: "à 100\u00a0: tous les nombres", nom: "Compléments à 100", type: "P", avant: ["A2-2"],
        composer: a2Niveau3,
        imposes: [a2Complement(3, 61, 100), a2Complement(3, 29, 100), a2Complement(3, 13, 100)],
        apprends: a2Apprends({
          a: 37, cible: 100,
          manipule: "Finis la rangée d’un coup, puis pousse les rangées qui manquent.",
          consigne: "Je vais à la dizaine, puis à 100.",
          lignes: ["37 + 3 = 40", "40 + 60 = 100", `3 + 60 = ${CASE}`],
          bilan: "Pour aller à 100, je vais d’abord à la dizaine, puis à 100."
        })
      },
      {
        n: 4, titre: "à 1\u202f000", nom: "Compléments à 1\u202f000", type: "P", avant: ["A2-3"],
        composer: a2Niveau4,
        imposes: [a2Complement(4, 650, 1000), a2Complement(4, 230, 300, {suivante: true})],
        apprends: a2Apprends({
          a: 650, cible: 1000,
          manipule: null,
          consigne: "Je vais à la centaine, puis à 1\u202f000.",
          lignes: ["650 + 50 = 700", `700 + 300 = 1${ESPACE_FINE}000`, `50 + 300 = ${CASE}`],
          bilan: "Pour aller à 1\u202f000, je vais d’abord à la centaine, puis à 1\u202f000."
        })
      }
    ]
  };

  const A5 = {
    id: "A5", nom: "Ajouter 9, 19, 29…", exemple: "47 + 19",
    famille: "A", palier: 1, rang: 8, avant: ["A3"], construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A5_ERREURS, image: a5Image,
    niveaux: [
      {
        n: 1, titre: "+ 9", type: "P", avant: [],
        composer: a5Niveau(1, [9]),
        imposes: [a5Somme(1, 31, 9), a5Somme(1, 94, 9)],
        apprends: a5Apprends(47, 9, "+ 9, c’est + 10 puis − 1.")
      },
      {
        n: 2, titre: "+ 19, 29, 39", type: "P", avant: ["A5-1"],
        composer: a5Niveau(2, [19, 29, 39]),
        imposes: [a5Somme(2, 31, 19), a5Somme(2, 285, 19)],
        apprends: a5Apprends(47, 19, "Pour ajouter 19, j’ajoute 20, puis je retranche 1.")
      },
      {
        n: 3, titre: "+ 8, 18, 28, 38", type: "P", avant: ["A5-2"],
        composer: a5Niveau(3, [8, 18, 28, 38]),
        imposes: [a5Somme(3, 53, 38), a5Somme(3, 147, 18)],
        apprends: a5Apprends(53, 38, "Pour ajouter 38, j’ajoute 40, puis je retranche 2.")
      },
      {
        n: 4, titre: "+ 48, 49… 98, 99", type: "P", avant: ["A5-3"],
        composer: a5Niveau(4, [48, 49, 58, 59, 68, 69, 78, 79, 88, 89, 98, 99]),
        imposes: [a5Somme(4, 152, 98), a5Somme(4, 126, 99)],
        apprends: a5Apprends(23, 59, "Pour ajouter 99, j’ajoute 100, puis je retranche 1.")
      }
    ]
  };

  const M2 = {
    id: "M2", nom: "× 10, × 100, × 1\u202f000", exemple: "27 × 100",
    famille: "M", palier: 1, rang: 5, avant: [], construit: true,
    aide_entraine: "tableau-fleches",
    erreurs: M2_ERREURS, image: tableauDe,
    niveaux: [
      {
        n: 1, titre: "produits", nom: "× 10, × 100, × 1\u202f000", type: "P", avant: [],
        composer: m2Niveau1,
        imposes: [produit("M2", 1, 38, 10), produit("M2", 1, 9, 100, true)],
        apprends: glisseApprends({
          calcul: produit("M2", 1, 27, 100), exemple: "27 × 100", colonnes: COLONNES_M2,
          consigne: "Chaque chiffre vaut 100 fois plus.",
          refus: "Chaque chiffre doit valoir 100 fois plus\u00a0: 2 colonnes.",
          trace: ["27 × 100 = …", `27 × 100 = 2${ESPACE_FINE}700`],
          lignes: ["27 × 100", "= 2 milliers et 7 centaines", `= 2${ESPACE_FINE}000 + 700`, `= ${CASE}`], suite: true,
          bilan: "Quand je multiplie par 100, chaque chiffre prend une valeur 100 fois plus grande."
        })
      },
      {
        n: 2, titre: "nombres en 0, trous, divisions", nom: "× 10, × 100\u00a0: trous, divisions", type: "P", avant: ["M2-1"],
        composer: m2Niveau2,
        imposes: [produit("M2", 2, 30, 100), trouFacteur("M2", 2, 35, 100), division("M2", 2, 48, 10)],
        apprends: glisseApprends({
          calcul: division("M2", 2, 48, 10), exemple: "480 ÷ 10", colonnes: COLONNES_M2,
          consigne: "Chaque chiffre vaut 10 fois moins.",
          refus: "Chaque chiffre doit valoir 10 fois moins\u00a0: 1 colonne.",
          trace: ["480 ÷ 10 = …", "480 ÷ 10 = 48"],
          lignes: ["480 ÷ 10", "= 4 dizaines et 8 unités", `= ${CASE}`], suite: true,
          bilan: "Quand je divise par 10, chaque chiffre prend une valeur 10 fois plus petite."
        })
      }
    ]
  };
  // Les modules à décimales ont la touche « , » au-dessus du pavé.
  const D2 = {
    id: "D2", nom: "× 10, × 100, × 1\u202f000 avec virgule", exemple: "7,54 × 100",
    famille: "D", palier: 3, rang: 2, avant: ["M2", "D1"], construit: true, virgule: true,
    aide_entraine: "tableau-fleches",
    erreurs: D2_ERREURS, image: tableauDe,
    niveaux: [
      {
        n: 1, titre: "× 10", nom: "Décimal × 10", type: "P", avant: [],
        composer: d2Niveau1,
        imposes: [produit("D2", 1, 0.6, 10), produit("D2", 1, 2.5, 10)],
        apprends: glisseApprends({
          calcul: produit("D2", 1, 2.5, 10), exemple: "2,5 × 10", colonnes: COLONNES_D2,
          consigne: "Chaque chiffre vaut 10 fois plus.",
          refus: "Chaque chiffre doit valoir 10 fois plus\u00a0: 1 colonne.",
          trace: ["2,5 × 10 = …", "2,5 × 10 = 25"],
          lignes: ["2,5 × 10", "2 → 20\u202f; 0,5 → 5", "= 20 + 5", `= ${CASE}`], suite: false,
          bilan: "Quand je multiplie par 10, chaque chiffre prend une valeur 10 fois plus grande. La virgule ne bouge pas, ce sont les chiffres qui glissent."
        })
      },
      {
        n: 2, titre: "× 100, × 1\u202f000 sans zéro à écrire", nom: "Décimal × 100, × 1\u202f000", type: "P", avant: ["D2-1"],
        composer: d2Niveau2,
        imposes: [produit("D2", 2, 7.54, 100), produit("D2", 2, 4.107, 1000)],
        apprends: glisseApprends({
          calcul: produit("D2", 2, 7.54, 100), exemple: "7,54 × 100", colonnes: COLONNES_D2,
          consigne: "Chaque chiffre vaut 100 fois plus.",
          refus: "Chaque chiffre doit valoir 100 fois plus\u00a0: 2 colonnes.",
          trace: ["7,54 × 100 = …", "7,54 × 100 = 754"],
          lignes: ["7,54 × 100", "7 → 700\u202f; 0,5 → 50\u202f; 0,04 → 4", "= 700 + 50 + 4", `= ${CASE}`], suite: false,
          bilan: "Quand je multiplie par 100, chaque chiffre prend une valeur 100 fois plus grande."
        })
      },
      {
        n: 3, titre: "des zéros à écrire", nom: "Décimal\u00a0: zéros à écrire", type: "P", avant: ["D2-2"],
        composer: d2Niveau3,
        imposes: [produit("D2", 3, 3.6, 100), produit("D2", 3, 72.4, 100), produit("D2", 3, 0.2, 100)],
        apprends: glisseApprends({
          calcul: produit("D2", 3, 3.6, 100), exemple: "3,6 × 100", colonnes: COLONNES_D2,
          consigne: "Chaque chiffre vaut 100 fois plus.",
          refus: "Chaque chiffre doit valoir 100 fois plus\u00a0: 2 colonnes.",
          trace: ["3,6 × 100 = …", "3,6 × 100 = 360"],
          lignes: ["3,6 × 100", "3 → 300\u202f; 0,6 → 60", "= 300 + 60", `= ${CASE}`], suite: false,
          bilan: "Quand une case reste vide, j’écris un zéro\u00a0: 3,6 × 100 = 360."
        })
      },
      {
        n: 4, titre: "trous", nom: "Décimal\u00a0: trous", type: "P", avant: ["D2-3"],
        composer: d2Niveau4,
        imposes: [trouFacteur("D2", 4, 3.6, 100), trouNombre("D2", 4, 0.45, 100), trouEgal("D2", 4, 1.2, 1000)],
        apprends: glisseApprends({
          calcul: trouEgal("D2", 4, 1.2, 1000), exemple: `1${ESPACE_FINE}200 = 1,2 × ?`, colonnes: COLONNES_D2,
          consigne: `Glisse jusqu’à lire 1${ESPACE_FINE}200.`, consigneTableau: "Je compte les colonnes.",
          refus: null, inconnue: "puissance",
          trace: [`1,2 × … = 1${ESPACE_FINE}200`, `1,2 × ${MILLE} = 1${ESPACE_FINE}200`],
          lignes: [`1,2 → 1${ESPACE_FINE}200`, "3 colonnes", `1${ESPACE_FINE}200 = 1,2 × ${CASE}`], suite: false,
          bilan: "Pour trouver par combien on a multiplié, je compte les colonnes."
        })
      }
    ]
  };

  const reserve = (id, nom, exemple, palier, rang, avant, niveaux) =>
    ({id, nom, exemple, famille: id[0], palier, rang, avant, construit: false, niveaux: niveauxVides(niveaux)});

  // L'ordre de la liste est l'ordre conseillé : palier 1, 2, 3, 4, puis les
  // 29 identifiants réservés (palier 0 : jamais affichés).
  const MODULES = Object.freeze([
    reserve("A1", "Sommes jusqu’à 20", "8 + 7", 1, 1, [], 3),
    A2,
    reserve("M1", "Doubles et moitiés", "double de 35", 1, 3, ["A1"], 3),
    reserve("A3", "Dizaines et centaines entières", "1 462 + 300", 1, 4, ["A1"], 2),
    M2,
    reserve("A4", "Additionner deux nombres", "47 + 38", 1, 6, ["A3"], 3),
    reserve("M4", "Les tables à l’envers", "56 ÷ 7", 1, 7, [], 3),
    A5,
    reserve("A6", "Retrancher 9, 19, 29…", "143 − 29", 1, 9, ["A5"], 4),
    reserve("M3", "Tables étendues", "9 × 400", 1, 10, ["M2"], 3),

    reserve("M6", "× 4, × 8, ÷ 4, ÷ 8", "23 × 4", 2, 1, ["M1"], 4),
    reserve("A7", "Soustraire en reculant", "523 − 7", 2, 2, ["A3"], 4),
    reserve("M7", "× 5, × 50, ÷ 5, × 25", "46 × 5", 2, 3, ["M1", "M2"], 5),
    reserve("A8", "Soustraire par l’écart", "73 − 68", 2, 4, ["A2", "A7"], 3),
    reserve("M5", "Repères 25, 50, 60, 100", "3 × 25", 2, 5, ["M4"], 2),
    reserve("C1", "Parenthèses", "3 × (10 − 6)", 2, 6, ["A4", "M4", "A7"], 3),
    reserve("C4", "Remonter un calcul", "(2 × ?) − 5 = 23", 2, 7, ["C1", "M4"], 2),
    reserve("M8", "Distributivité\u00a0: décomposer", "6 × 23", 2, 8, ["M3", "A4"], 3),
    reserve("A9", "Regrouper pour calculer", "27 + 48 + 73", 2, 9, ["A2", "A4"], 3),
    reserve("M10", "Regrouper les facteurs", "5 × 43 × 2", 2, 10, ["M5", "M7"], 3),
    reserve("C3", "Égalités à équilibrer", "144 + 7 = 142 + ?", 2, 11, ["A8", "M10"], 3),
    reserve("M11", "Quotient et reste", "17 = 3 × 5 + ?", 2, 12, ["M4"], 2),
    reserve("M12", "Diviser en décomposant", "96 ÷ 8", 2, 13, ["M3", "M4"], 3),
    reserve("M9", "Distributivité\u00a0: retrancher", "7 × 99", 2, 14, ["M8", "A6", "A7"], 3),

    reserve("D1", "Écritures d’un décimal", "3 + 2/10 = ?", 3, 1, [], 3),
    D2,
    reserve("D3", "÷ 10, ÷ 100, ÷ 1\u202f000", "45,2 ÷ 10", 3, 3, ["D2"], 3),
    reserve("F2", "Demis, quarts et unité", "1/2 + 1/4", 3, 4, [], 3),
    reserve("D4", "Ajouter ou soustraire des unités d’un rang", "4,45 + 0,3", 3, 5, ["D1", "A3"], 3),
    reserve("F3", "Fraction unitaire d’une quantité", "1/3 de 18 billes", 3, 6, ["M4", "M1"], 4),
    reserve("D5", "Compléments à l’unité", "0,7 + ? = 1", 3, 7, ["A2", "D1"], 3),
    reserve("D6", "Additionner deux décimaux", "2,7 + 1,4", 3, 8, ["D4", "A4"], 4),
    reserve("F1", "Fractions usuelles et décimaux", "3/4 = ?", 3, 9, ["D1"], 3),
    reserve("D7", "Soustraire deux décimaux", "3,4 − 0,8", 3, 10, ["D5", "D6", "A7"], 3),
    reserve("D8", "Doubles et moitiés de décimaux", "moitié de 9", 3, 11, ["M1", "M6", "D1"], 4),
    reserve("F4", "Fraction d’une quantité", "2/3 de 12 œufs", 3, 12, ["F3"], 3),
    reserve("D9", "Décimal × 5, × 50", "3,4 × 5", 3, 13, ["M7", "D2", "D8"], 2),

    reserve("F5", "Entier et fraction", "17/5 = 3 + ?/5", 4, 1, ["M11"], 3),
    reserve("F6", "Fractions égales", "2/3 = ?/15", 4, 2, ["M4"], 3),
    reserve("F8", "Additionner des fractions", "3/7 + 3/7", 4, 3, ["F2", "F5"], 3),
    reserve("F9", "Dénominateurs multiples", "3/2 + 7/4", 4, 4, ["F6", "F8"], 2),
    reserve("F11", "Entier × fraction", "3 × 5/4", 4, 5, ["F4", "F5"], 3),

    reserve("D10", "× 0,1 ; × 0,01 ; × 0,001", "780 × 0,1", 0, 0, ["D3"], 3),
    reserve("D11", "Produits liés aux tables", "0,6 × 7", 0, 0, ["M3", "D10"], 3),
    reserve("D12", "Décimal × décimal", "0,4 × 0,3", 0, 0, ["D11"], 2),
    reserve("D13", "× 0,5 ; × 0,25 ; × 1,5", "48 × 0,5", 0, 0, ["F1", "M1", "M6"], 3),
    reserve("D14", "Diviser un décimal par un entier", "4,8 ÷ 4", 0, 0, ["D8", "M12"], 3),
    reserve("D15", "Diviser par un décimal", "1,5 ÷ 0,3", 0, 0, ["D10", "D13"], 3),
    reserve("F7", "Simplifier", "15/35", 0, 0, ["F6"], 3),
    reserve("F10", "Dénominateurs quelconques", "2/5 + 1/4", 0, 0, ["F9"], 3),
    reserve("F12", "Multiplier deux fractions", "2/3 × 5/7", 0, 0, ["F7", "F11"], 2),
    reserve("F13", "Inverse et division", "5 ÷ 1/2", 0, 0, ["F12"], 3),
    reserve("P1", "Pourcentage, fraction, décimal", "25 % = 1/?", 0, 0, ["F1"], 3),
    reserve("P2", "50 %, 10 %, 1 %, 25 % d’un nombre", "10 % de 250", 0, 0, ["F3", "D3"], 3),
    reserve("P3", "Pourcentages composés", "20 % de 120", 0, 0, ["P2"], 4),
    reserve("P4", "× 1,1 ; × 0,9 ; × 1,2 ; × 0,8", "800 × 1,1", 0, 0, ["P3", "D11"], 3),
    reserve("R1", "Traverser zéro", "5 − 7", 0, 0, ["A8"], 2),
    reserve("R2", "Additionner deux relatifs", "−3 + 7", 0, 0, ["R1"], 3),
    reserve("R3", "Soustraire un relatif", "7 − (−5)", 0, 0, ["R2"], 3),
    reserve("R4", "Sommes de plusieurs relatifs", "−3 + 7 − 5", 0, 0, ["R3", "A9"], 3),
    reserve("R5", "Multiplier, diviser des relatifs", "−7 × 3", 0, 0, ["R2", "M4"], 4),
    reserve("R6", "Somme ou produit\u00a0?", "−3 × (−5)", 0, 0, ["R4", "R5", "C2"], 2),
    reserve("X1", "Carrés de 0 à 12", "7²", 0, 0, [], 3),
    reserve("X2", "Puissances simples", "2³", 0, 0, ["X1"], 3),
    reserve("X3", "Racines carrées", "√81", 0, 0, ["X1"], 2),
    reserve("X4", "Puissances de 10", "10⁴", 0, 0, ["D2", "X2"], 3),
    reserve("X5", "Exposants négatifs", "10⁻²", 0, 0, ["X4", "D10"], 4),
    reserve("X6", "Notation scientifique", "4,58 × 10^?", 0, 0, ["X5"], 3),
    reserve("X7", "Produits et quotients de puissances", "2³ × 2⁴", 0, 0, ["X4"], 3),
    reserve("C2", "Priorités", "6 + 4 × 2", 0, 0, ["C1"], 4),
    reserve("C5", "Factoriser pour calculer", "12 × 7 + 12 × 3", 0, 0, ["M8", "C2"], 3)
  ].map(fiche => Object.freeze(Object.assign({}, fiche, {
    avant: Object.freeze(fiche.avant.slice()),
    niveaux: Object.freeze(fiche.niveaux.map(niveau => Object.freeze(Object.assign({}, niveau,
      niveau.imposes ? {imposes: Object.freeze(niveau.imposes.slice())} : {},
      niveau.avant ? {avant: Object.freeze(niveau.avant.slice())} : {}))))
  }))));

  const PAR_ID = new Map(MODULES.map(fiche => [fiche.id, fiche]));

  function moduleDe(id) {
    return PAR_ID.get(String(id)) || null;
  }

  // « A5-2 » → la fiche du module et celle du niveau.
  function niveauDe(cle) {
    const [id, numero] = String(cle).split("-");
    const fiche = moduleDe(id);
    const niveau = fiche ? fiche.niveaux.find(n => n.n === Number(numero)) : null;
    return niveau ? {module: fiche, niveau} : null;
  }

  // Le nom court d'une compétence (un niveau), lisible seul : « Compléments
  // à 100 », « + 9 ». C'est lui que la séance et les bilans affichent. Sans
  // nom court, le titre du niveau.
  function nomCompetence(id, numero) {
    const trouve = niveauDe(`${id}-${numero}`);
    return trouve ? trouve.niveau.nom || trouve.niveau.titre || "" : "";
  }

  // Ce que le moteur de la progression a besoin de savoir de la carte, sans
  // les textes ni les générateurs : l'ordre (c'est celui de la séance), le
  // palier, ce qui est construit. Les « avant » ne sont plus des verrous :
  // l'ordre les respecte déjà ; ils restent une information.
  function carte() {
    return MODULES.map(fiche => ({
      id: fiche.id, palier: fiche.palier, avant: fiche.avant.slice(), niveaux: fiche.niveaux.length,
      construit: Boolean(fiche.construit)
    }));
  }

  // ------------------------------------------------------------------ les séries

  // Une série d'un niveau : « valide » (12 calculs pour un fait, 10 pour une
  // procédure, les imposés dedans, placés au hasard) ou « entraine » (10
  // calculs, sans imposé). La même graine rend la même série.
  function genererSerie(cleNiveau, {graine = 1, genre = "entraine", total = null} = {}) {
    const trouve = niveauDe(cleNiveau);
    if (!trouve || typeof trouve.niveau.composer !== "function") return [];
    const {niveau} = trouve;
    const rng = mulberry32(graine);
    const validation = genre === "valide";
    const nombre = total !== null ? total : validation ? TOTAUX[niveau.type] : TOTAUX.entraine;
    const imposes = validation ? niveau.imposes.slice(0, nombre) : [];
    return melanger(rng, niveau.composer(rng, nombre, imposes)).slice(0, nombre);
  }

  // Le test de module (« Tu connais déjà ? ») : `parNiveau` calculs de chaque
  // niveau, sans imposé, mélangés. Chaque calcul porte son niveau.
  function genererTest(id, {graine = 1, parNiveau = 3} = {}) {
    const fiche = moduleDe(id);
    if (!fiche || !fiche.construit) return [];
    const calculs = fiche.niveaux.flatMap(niveau =>
      genererSerie(`${id}-${niveau.n}`, {graine: (graine + niveau.n * 7919) >>> 0, genre: "entraine"}).slice(0, parNiveau));
    return melanger(mulberry32(graine), calculs);
  }

  // Un seul calcul d'un niveau (Mes calculs du jour en tirent un par
  // compétence).
  function genererUn(cleNiveau, graine) {
    const serie = genererSerie(cleNiveau, {graine, genre: "entraine"});
    return serie.length ? serie[0] : null;
  }

  // ---------------------------------------------------------- les erreurs connues

  // La cause d'une réponse fausse, si elle est connue : son numéro, la
  // phrase qui lui répond, l'image (le pas oublié en gras). Les causes sont
  // essayées dans l'ordre de la fiche ; null si aucune ne se reconnaît.
  // `ecrit` : la réponse telle que l'élève l'a tapée (« 2,50 »), pour la
  // phrase qui la cite.
  function diagnostiquer(calcul, reponse, ecrit = "") {
    const fiche = calcul ? moduleDe(calcul.module) : null;
    if (!fiche || !fiche.erreurs || typeof reponse !== "number" || memeNombre(reponse, calcul.reponse)) return null;
    const cause = fiche.erreurs.find(erreur => erreur.test(calcul, reponse));
    if (!cause) return null;
    return {c: cause.c, nom: cause.nom, texte: cause.retour(calcul, reponse, ecrit), image: fiche.image(calcul, cause.gras || 0)};
  }

  // L'image d'un calcul, réponse montrée (après une erreur, à la phrase-bilan).
  function imageDe(calcul, gras = 0) {
    const fiche = calcul ? moduleDe(calcul.module) : null;
    return fiche && typeof fiche.image === "function" ? fiche.image(calcul, gras) : null;
  }

  return Object.freeze({
    PALIERS,
    TOTAUX,
    MODULES,
    CASE,
    ESPACE_FINE,
    mulberry32,
    graineDe,
    formaterNombre,
    lireReponse,
    memeNombre,
    cleNombre,
    exact,
    decimalesDe,
    moduleDe,
    niveauDe,
    nomCompetence,
    carte,
    genererSerie,
    genererTest,
    genererUn,
    diagnostiquer,
    imageDe,
    a2Sauts
  });
});
