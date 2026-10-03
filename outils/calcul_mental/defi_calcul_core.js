// Défi calcul — les modules (lot 1a, 03/10/2026).
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

  // Pendant l'essai du lot 1, les quatre pilotes sont ouverts sans
  // condition. À retirer au lot 3.
  const ESSAI_PILOTES = true;
  const PILOTES = Object.freeze(["A2", "A5", "M2", "D2"]);

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
  function formaterNombre(nombre) {
    const n = Number(nombre);
    if (!Number.isFinite(n)) return "";
    const signe = n < 0 ? "−" : "";
    const [entiere, decimales = ""] = Math.abs(n).toFixed(3).split(".");
    const groupes = entiere.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_FINE);
    const reste = decimales.replace(/0+$/, "");
    return signe + groupes + (reste ? "," + reste : "");
  }

  // Ce que l'élève a tapé, en nombre : virgule ou point, espaces ignorées,
  // « 360 » et « 360,0 » sont le même nombre. null si ce n'est pas un nombre.
  function lireReponse(texte) {
    const propre = String(texte == null ? "" : texte).replace(/[\s  ]/g, "").replace(",", ".");
    if (!/^\d+(\.\d*)?$|^\.\d+$/.test(propre)) return null;
    const nombre = Number(propre);
    return Number.isFinite(nombre) ? nombre : null;
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
  // s'écrit « x », sauf quand elle est le résultat, en dernier.
  function fabriquer(module, niveau, forme, morceaux, reponse, donnees) {
    const texte = morceaux.map(m => (m === TROU ? CASE : typeof m === "number" ? formaterNombre(m) : m)).join(" ");
    const operandes = morceaux.filter(m => m === TROU || typeof m === "number");
    const cles = operandes.map((m, index) => (m === TROU ? (index === operandes.length - 1 ? null : "x") : cleNombre(m)))
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

  // ------------------------------------------------------------- les 71 modules

  const niveauxVides = nombre => Array.from({length: nombre}, (_, i) => ({n: i + 1}));

  const A2 = {
    id: "A2", nom: "Compléments à 10, 100, 1\u202f000", exemple: "37 + ? = 100",
    famille: "A", palier: 1, rang: 2, avant: ["A1"], construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A2_ERREURS, image: a2Image,
    niveaux: [
      {
        n: 1, titre: "à 10, dizaine suivante", type: "F", avant: [],
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
        n: 2, titre: "à 100\u00a0: dizaines et nombres en 5", type: "F", avant: ["A2-1"],
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
        n: 3, titre: "à 100\u00a0: tous les nombres", type: "P", avant: ["A2-2"],
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
        n: 4, titre: "à 1\u202f000", type: "P", avant: ["A2-3"],
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

  // M2 et D2 : réservés avec leurs niveaux, construits au lot 1b.
  const M2 = {
    id: "M2", nom: "× 10, × 100, × 1\u202f000", exemple: "27 × 100",
    famille: "M", palier: 1, rang: 5, avant: [], construit: false,
    niveaux: [
      {n: 1, titre: "produits", type: "P", avant: []},
      {n: 2, titre: "nombres en 0, trous, divisions", type: "P", avant: ["M2-1"]}
    ]
  };
  const D2 = {
    id: "D2", nom: "× 10, × 100, × 1\u202f000 avec virgule", exemple: "7,54 × 100",
    famille: "D", palier: 3, rang: 2, avant: ["M2", "D1"], construit: false,
    niveaux: [
      {n: 1, titre: "× 10", type: "P", avant: []},
      {n: 2, titre: "× 100, × 1\u202f000 sans zéro à écrire", type: "P", avant: ["D2-1"]},
      {n: 3, titre: "des zéros à écrire", type: "P", avant: ["D2-2"]},
      {n: 4, titre: "trous", type: "P", avant: ["D2-3"]}
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
    reserve("M8", "Distributivité : décomposer", "6 × 23", 2, 8, ["M3", "A4"], 3),
    reserve("A9", "Regrouper pour calculer", "27 + 48 + 73", 2, 9, ["A2", "A4"], 3),
    reserve("M10", "Regrouper les facteurs", "5 × 43 × 2", 2, 10, ["M5", "M7"], 3),
    reserve("C3", "Égalités à équilibrer", "144 + 7 = 142 + ?", 2, 11, ["A8", "M10"], 3),
    reserve("M11", "Quotient et reste", "17 = 3 × 5 + ?", 2, 12, ["M4"], 2),
    reserve("M12", "Diviser en décomposant", "96 ÷ 8", 2, 13, ["M3", "M4"], 3),
    reserve("M9", "Distributivité : retrancher", "7 × 99", 2, 14, ["M8", "A6", "A7"], 3),

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
    reserve("R6", "Somme ou produit ?", "−3 × (−5)", 0, 0, ["R4", "R5", "C2"], 2),
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

  // Ce que le moteur de la progression a besoin de savoir de la carte, sans
  // les textes ni les générateurs : l'ordre conseillé, les « avant », ce qui
  // est construit, ce qui est ouvert pendant l'essai.
  function carte() {
    return MODULES.map(fiche => ({
      id: fiche.id, palier: fiche.palier, avant: fiche.avant.slice(), niveaux: fiche.niveaux.length,
      construit: Boolean(fiche.construit), pilote: ESSAI_PILOTES && PILOTES.includes(fiche.id)
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

  // Un seul calcul d'un niveau (le mélange du jour en tire dix, un par un).
  function genererUn(cleNiveau, graine) {
    const serie = genererSerie(cleNiveau, {graine, genre: "entraine"});
    return serie.length ? serie[0] : null;
  }

  // ---------------------------------------------------------- les erreurs connues

  // La cause d'une réponse fausse, si elle est connue : son numéro, la
  // phrase qui lui répond, l'image (le pas oublié en gras). Les causes sont
  // essayées dans l'ordre de la fiche ; null si aucune ne se reconnaît.
  function diagnostiquer(calcul, reponse) {
    const fiche = calcul ? moduleDe(calcul.module) : null;
    if (!fiche || !fiche.erreurs || typeof reponse !== "number" || memeNombre(reponse, calcul.reponse)) return null;
    const cause = fiche.erreurs.find(erreur => erreur.test(calcul, reponse));
    if (!cause) return null;
    return {c: cause.c, nom: cause.nom, texte: cause.retour(calcul, reponse), image: fiche.image(calcul, cause.gras)};
  }

  // L'image d'un calcul, réponse montrée (après une erreur, à la phrase-bilan).
  function imageDe(calcul, gras = 0) {
    const fiche = calcul ? moduleDe(calcul.module) : null;
    return fiche && typeof fiche.image === "function" ? fiche.image(calcul, gras) : null;
  }

  return Object.freeze({
    ESSAI_PILOTES,
    PILOTES,
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
    moduleDe,
    niveauDe,
    carte,
    genererSerie,
    genererUn,
    diagnostiquer,
    imageDe,
    a2Sauts
  });
});
