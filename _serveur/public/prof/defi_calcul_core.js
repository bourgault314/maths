// Défi calcul — les modules (lot 1a, 03/10/2026 ; M2 et D2 au lot 1b ;
// le test de module au lot 2a ; la carte v2 et le scénario d'un module au
// lot 3, 30/10/2026 : test en escalier, J'apprends sur trois calculs
// différents, calculs rangés du simple au difficile, outil de l'entraînement).
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

  // Les quatre paliers de la carte v2 : ce sont les NIVEAUX (les
  // compétences) qui y sont rangés, par classe, pas les modules.
  const PALIERS = Object.freeze([
    Object.freeze({n: 1, nom: "Les bases", classes: "CP · CE1 · CE2"}),
    Object.freeze({n: 2, nom: "Le CM1", classes: "CM1"}),
    Object.freeze({n: 3, nom: "Le CM2", classes: "CM2"}),
    Object.freeze({n: 4, nom: "Vers la 6e", classes: "6e et choix pédagogiques"})
  ]);

  // Une validation (mode professeur) : 12 calculs pour un fait, 10 pour une
  // procédure. Un entraînement : jusqu'à 20 calculs, rangés du plus simple
  // au plus dur (la série s'arrête avant, le plus souvent).
  const TOTAUX = Object.freeze({F: 12, P: 10, entraine: 20});

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
  const A2_NOMBRES_3 = Object.freeze(Array.from({length: 99}, (_, i) => i + 1).filter(n => n % 5 !== 0 && n > 10 && n < 90));

  // Niveau 1 : à la dizaine suivante (cible variable : 67 + ? = 70,
  // 433 + ? = 440). Les compléments à 10 sont partis dans A1 (carte v2).
  function a2Niveau1(rng, total, imposes) {
    const [deux, trois] = repartir(total, [1, 1]);
    const impose = imposes.length;
    const aDeux = tirerDistincts(rng, deux, r => sansUniteNulle(r, 11, 99))
      .map(n => a2Complement(1, n, dizaineSuivante(n), {suivante: true}));
    const aTrois = tirerDistincts(rng, Math.max(0, trois - impose), r => sansUniteNulle(r, 101, 999), imposes.map(c => c.donnees.a))
      .map(n => a2Complement(1, n, dizaineSuivante(n), {suivante: true}));
    return [...aDeux, ...aTrois, ...imposes];
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

  // Du plus simple au plus dur (le test en escalier et l'entraînement
  // rangent leurs calculs avec ça) : la forme d'abord (« a + ? » avant
  // « ? + a », avant « 100 − a »), puis un saut de plus à faire, puis la
  // taille du nombre de départ.
  const A2_FORMES = Object.freeze({complement: 0, "complement-gauche": 1, difference: 2});
  function a2Difficulte(calcul) {
    const {a} = calcul.donnees;
    const sauts = a2Sauts(calcul).sauts.length;
    return A2_FORMES[calcul.forme] * 1000 + (sauts - 1) * 300 + String(a).length * 30 + (a % 10 ? 10 - a % 10 : 0);
  }

  // L'outil du début de l'entraînement, et de « je représente » : la droite
  // est dessinée, ses points aussi (62, 70, 100), mais les sauts disent
  // « + ? » — c'est eux qu'on cherche.
  function a2Aide(calcul) {
    const image = a2Image(calcul);
    return Object.assign({}, image, {sauts: image.sauts.map(saut => ({val: saut.val, masque: true}))});
  }

  // Le rekenrek d'un complément (jusqu'à 100) : finir la rangée d'un coup,
  // puis les rangées qui manquent, 10 perles d'un coup. La consigne ne dit
  // jamais le nombre de perles : c'est lui qu'on cherche.
  function a2Perles(calcul, consigne) {
    const {a, cible} = calcul.donnees;
    if (cible > 100) return null;
    const {palier} = a2Sauts(calcul);
    return Object.freeze({
      outil: "perles", depart: a, texte: calcul.texte.replace(CASE, "?"),
      gestes: Object.freeze(palier === null
        ? (cible - a < 10 ? [cible - a] : Array.from({length: (cible - a) / 10}, () => 10))
        : [palier - a, ...Array.from({length: (cible - palier) / 10}, () => 10)]),
      consigne: consigne || (palier === null
        ? (cible - a < 10 ? "Finis la rangée d’un coup." : "Pousse les rangées qui manquent, 10 perles d’un coup.")
        : "Finis la rangée d’un coup, puis pousse les rangées qui manquent."),
      traces: Object.freeze(palier === null
        ? [Object.freeze({apres: cible - a < 10 ? 1 : (cible - a) / 10, attente: `${a} + … = ${cible}`, texte: `${a} + ${cible - a} = ${cible}`})]
        : [
          Object.freeze({apres: 1, attente: `${a} + … = ${palier}`, texte: `${a} + ${palier - a} = ${palier}`}),
          Object.freeze({apres: 1 + (cible - palier) / 10, attente: `${palier} + … = ${cible}`, texte: `${palier} + ${cible - palier} = ${cible}`})
        ])
    });
  }

  // Les étapes de « J'écris » d'un complément : jusqu'au palier, puis
  // jusqu'à la cible, puis le complément entier. Un seul saut : une étape.
  function a2Etapes(calcul) {
    const {a, cible} = calcul.donnees;
    const {palier} = a2Sauts(calcul);
    const etape = (texte, reponse) => Object.freeze({texte, reponse});
    if (palier === null) return Object.freeze([etape(`${formaterNombre(a)} + ${CASE} = ${formaterNombre(cible)}`, cible - a)]);
    return Object.freeze([
      etape(`${formaterNombre(a)} + ${CASE} = ${formaterNombre(palier)}`, palier - a),
      etape(`${formaterNombre(palier)} + ${CASE} = ${formaterNombre(cible)}`, cible - palier),
      etape(`${formaterNombre(a)} + ${CASE} = ${formaterNombre(cible)}`, cible - a)
    ]);
  }

  function a2Phrase(calcul) {
    const {a, cible} = calcul.donnees;
    const {palier} = a2Sauts(calcul);
    if (palier === null) return `De ${formaterNombre(a)} à ${formaterNombre(cible)}, c’est + ${formaterNombre(cible - a)}.`;
    return `Regarde\u00a0: ${formaterNombre(palier - a)} puis ${formaterNombre(cible - palier)}, ça fait ${formaterNombre(cible - a)}.`;
  }

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

  // Du plus simple au plus dur : le terme ajouté (9 avant 19 avant 29), un
  // retour de 2 après un retour de 1, le passage de la centaine, la taille
  // du nombre de départ.
  function a5Difficulte(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    return a * 10 + (r - a) * 100 + (a5Passage(n) ? 400 : 0) + String(n).length * 30 + (n % 10 ? 0 : 20);
  }

  // L'outil du début de l'entraînement, et de « je représente » : la droite
  // avec le détour (+ 10, − 1), ses deux arrivées à trouver.
  function a5Aide(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    return {outil: "droite-sauts", depart: n, sauts: [{val: r}, {val: a - r}], direct: a, inconnues: [1, 2]};
  }

  // Le rekenrek d'une somme (jusqu'à 100) : une rangée entière d'un coup
  // (ou plusieurs), puis on retire.
  function a5Perles(calcul) {
    const {n, a} = calcul.donnees;
    if (n + a > 100) return null;
    const r = a5Arrondi(a);
    const d = r - a;
    const rangees = r / 10;
    return Object.freeze({
      outil: "perles", depart: n, texte: `${n} + ${a}`,
      gestes: Object.freeze([...Array.from({length: rangees}, () => 10), -d]),
      consigne: rangees === 1
        ? `Pousse 10 perles d’un coup, puis retires-en ${d}.`
        : `Pousse ${r} perles, 10 d’un coup, puis retires-en ${d}${d > 1 ? " d’un coup" : ""}.`,
      traces: Object.freeze([
        Object.freeze({apres: rangees, attente: `${n} + ${r} = …`, texte: `${n} + ${r} = ${n + r}`}),
        Object.freeze({apres: rangees + 1, attente: `${n + r} − ${d} = …`, texte: `${n + r} − ${d} = ${n + a}`})
      ])
    });
  }

  function a5Etapes(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    const etape = (texte, reponse) => Object.freeze({texte, reponse});
    return Object.freeze([
      etape(`${formaterNombre(n)} + ${r} = ${CASE}`, n + r),
      etape(`${formaterNombre(n + r)} − ${r - a} = ${CASE}`, n + a),
      etape(`${formaterNombre(n)} + ${a} = ${CASE}`, n + a)
    ]);
  }

  function a5Phrase(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    return `Regarde\u00a0: + ${r}, ça fait ${formaterNombre(n + r)}\u202f; − ${r - a}, ça fait ${formaterNombre(n + a)}.`;
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

  // ------------------------------------------- « relier » : le dessin de J'écris
  //
  // Lot « relier » (31/10/2026, décision de Gwenaël) : dans « J'écris »,
  // le dessin est au-dessus des étapes, vide au début, et chaque égalité
  // juste fait apparaître SON morceau. `dessins[k]` est ce qu'on voit quand
  // k étapes sont faites : dessins[0] avant la première, le dernier quand
  // tout est écrit. Jamais un nombre que l'élève n'a pas encore trouvé
  // (gardé par un test sur les huit modules). `revele` : le même dessin, tout
  // montré sans le vert (la réponse donnée au 2e essai faux) — même place,
  // rien ne bouge.
  //
  // La droite : un morceau par étape.
  //  - un ajout ou un retrait (236 + 7) : chaque saut avec son point
  //    d'arrivée (236 + 4 = 240 : le saut + 4 et le point 240), puis la
  //    dernière égalité (236 + 7 = 243) : le saut direct, dessous ;
  //    un seul saut écrit en deux étapes (4 + 3 = 7, puis 254 + 3 = 257) :
  //    le saut, puis son point ;
  //  - un trou (6 + □ = 13, 24 + □ = 100) : les points sont donnés, chaque
  //    étape écrit l'étiquette de son saut, la dernière le saut direct.
  //  - `groupes` (modules lot 2) : les sauts de chaque étape, quand une
  //    étape en fait plusieurs (88 + 4 = 92 passe par 90 : les sauts + 2 et
  //    + 2, et leurs points 90 et 92, viennent ensemble).
  function droiteDessins({depart, sauts, direct, trou, etapes, groupes = null}) {
    const morceaux = groupes
      ? groupes.map(liste => ({saut: liste, point: liste.map(i => i + 1)}))
      : trou
        ? sauts.map((_, i) => ({etiquette: i}))
        : sauts.length === 1 && etapes > 1
          ? [{saut: 0}, {point: 1}]
          : sauts.map((_, i) => ({saut: i, point: i + 1}));
    if (direct !== undefined) morceaux.push({direct: true});
    const dessin = (vus, revele = false) => {
      const voit = cle => vus.some(m => m[cle] !== undefined && m[cle] !== false);
      const contient = (valeur, i) => (Array.isArray(valeur) ? valeur.includes(i) : valeur === i);
      const sautVu = i => vus.some(m => contient(m.saut, i));
      const pointVu = i => vus.some(m => contient(m.point, i));
      const etiquetteVue = i => vus.some(m => m.etiquette === i);
      const image = {outil: "droite-sauts", depart};
      if (trou) {
        image.sauts = sauts.map((val, i) => (etiquetteVue(i) ? {val} : {val, masque: true}));
      } else {
        image.sauts = sauts.map((val, i) => (sautVu(i) ? {val} : {val, cache: true}));
        const points = sauts.map((_, i) => i + 1);
        image.inconnues = points.filter(i => !pointVu(i));
        // Ce que l'élève a trouvé, en vert ; révélé, seule l'arrivée l'est
        // (comme sur la correction).
        image.acquis = revele ? [sauts.length] : points.filter(pointVu);
      }
      if (direct !== undefined) {
        image.direct = direct;
        if (!voit("direct")) image.directCache = true;
      }
      return Object.freeze(image);
    };
    return dessinsDe(morceaux, etapes, dessin);
  }

  // dessins[k] : les morceaux des k premières étapes ; la dernière étape
  // montre tout ce qui reste.
  function dessinsDe(morceaux, etapes, dessin) {
    const liste = [];
    for (let k = 0; k <= etapes; k += 1) liste.push(dessin(k === etapes ? morceaux : morceaux.slice(0, k)));
    return {dessins: Object.freeze(liste), revele: dessin(morceaux, true)};
  }

  // Le schéma en barres (M1) : les morceaux du nombre un par un (moitié de
  // 74 : 35 et 35 sous le 70, puis 2 et 2 sous le 4), puis la dernière
  // égalité : l'accolade (et les deux barres égales de la moitié).
  function barresDessins(image, etapes) {
    const morceaux = image.morceaux.map((_, i) => ({morceau: i}));
    morceaux.push({fini: true});
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: vus.filter(m => m.morceau !== undefined).map(m => m.morceau), fini: vus.some(m => m.fini)})));
    return dessinsDe(morceaux, etapes, dessin);
  }

  // Le tableau à flèches (M2, D2) : chaque étape écrit les chiffres de sa
  // partie (72 × 10 = 720 : le 7 et le 2 ; 0,41 × 10 = 4,1 : le 4 et le 1),
  // la dernière tout le nombre ; un trou (35 × □ = 3 500) : l'étiquette
  // « × 100 ». `montre` d'une étape : « entiers » ou « decimaux » ; sans
  // lui, tout.
  function tableauDessins(aide, solution, etapes) {
    const rangs = Array.from({length: 13}, (_, i) => 6 - i);
    const decalage = Math.round(Math.log10(solution.p)) * (solution.operation === "÷" ? -1 : 1);
    const morceaux = etapes.map(etape => {
      if (aide.masque) return {etiquette: true};
      if (etape.montre === "entiers") return {rangs: rangs.filter(r => r - decalage >= 0)};
      if (etape.montre === "decimaux") return {rangs: rangs.filter(r => r - decalage < 0)};
      return {rangs};
    });
    const dessin = (vus, revele = false) => {
      if (revele) return Object.freeze(Object.assign({}, solution));
      if (aide.masque) return Object.freeze(Object.assign({}, aide, {etiquetteTrouvee: vus.some(m => m.etiquette)}));
      const trouves = [...new Set(vus.flatMap(m => m.rangs || []))].sort((a, b) => b - a);
      return Object.freeze(Object.assign({}, aide, {trouves}));
    };
    return dessinsDe(morceaux, etapes.length, dessin);
  }

  // La partie « J'écris » d'un J'apprends, avec ses dessins.
  function ecrisAvecDessins(ecris, relier) {
    return Object.freeze(Object.assign({}, ecris, {
      dessins: relier.dessins,
      solution: Object.freeze(Object.assign({}, ecris.solution, {image: relier.revele}))
    }));
  }

  // Les trois temps de « J'apprends » d'un niveau d'A5, sur TROIS calculs
  // différents (scénario du 30/10) : le rekenrek sur le premier (une rangée
  // entière d'un coup, puis on retire), la droite sur le deuxième (le détour
  // dessus, le saut direct dessous, les arrivées à trouver), les étapes à
  // remplir sur le troisième. Au 2e essai faux, la réponse s'affiche sur
  // l'outil (« solution ») et une phrase la lit.
  function a5Apprends(nM, nR, nE, a, bilan) {
    const r = a5Arrondi(a);
    const d = r - a;
    const cM = a5Somme(0, nM, a);
    const cR = a5Somme(0, nR, a);
    const cE = a5Somme(0, nE, a);
    // Au-delà de 100 perles (+ 99), pas de rekenrek : on commence par la droite.
    const manipule = a5Perles(cM);
    const premier = manipule ? cM : cR;
    return Object.freeze({
      exemple: Object.freeze({texte: `${premier.donnees.n} + ${a}`, reponse: premier.reponse}),
      manipule,
      represente: Object.freeze({
        outil: "droite-sauts",
        consigne: `+ ${a}, c’est + ${r} puis − ${d}.`,
        texte: cR.texte, reponse: cR.reponse,
        image: Object.freeze(a5Aide(cR)),
        solution: Object.freeze({image: a5Image(cR), phrase: a5Phrase(cR)})
      }),
      ecris: ecrisAvecDessins({
        etapes: a5Etapes(cE), reponse: cE.reponse,
        solution: Object.freeze({image: a5Image(cE), phrase: a5Phrase(cE)})
      }, droiteDessins({depart: cE.donnees.n, sauts: [r, -d], direct: a, trou: false, etapes: 3})),
      bilan,
      image: Object.freeze({outil: "droite-sauts", depart: premier.donnees.n, sauts: [{val: r}, {val: -d}], direct: a, acquis: [2]}),
      textes: Object.freeze([premier.texte, cR.texte, cE.texte])
    });
  }

  // Les trois temps d'un niveau d'A2, sur trois calculs différents : les
  // perles sur le premier (niveau 4 : pas de perles au-delà de 100), la
  // droite dessinée avec ses sauts « + ? » sur le deuxième, les étapes à
  // remplir sur le troisième.
  function a2Apprends({manipule, represente, ecris, consigne, consigneManipule, bilan}) {
    const calculDe = ({a, cible}) => a2Complement(0, a, cible, cible !== 10 && cible !== 100 && cible !== 1000 ? {suivante: true} : {});
    const cM = manipule ? calculDe(manipule) : null;
    const cR = calculDe(represente);
    const cE = calculDe(ecris);
    const premier = cM || cR;
    return Object.freeze({
      exemple: Object.freeze({texte: premier.texte.replace(CASE, "?"), reponse: premier.reponse}),
      manipule: cM ? a2Perles(cM, consigneManipule) : null,
      represente: Object.freeze({
        outil: "droite-sauts", consigne,
        texte: cR.texte, reponse: cR.reponse,
        image: Object.freeze(a2Aide(cR)),
        solution: Object.freeze({image: a2Image(cR), phrase: a2Phrase(cR)})
      }),
      ecris: ecrisAvecDessins({
        etapes: a2Etapes(cE), reponse: cE.reponse,
        solution: Object.freeze({image: a2Image(cE), phrase: a2Phrase(cE)})
      }, a2Dessins(cE)),
      bilan,
      image: Object.freeze(a2Image(cR)),
      textes: Object.freeze([premier.texte, cR.texte, cE.texte])
    });
  }

  // Le dessin de « J'écris » d'un complément : les points sont donnés, chaque
  // étape écrit son saut, la dernière le complément entier (dessous).
  function a2Dessins(calcul) {
    const {sauts} = a2Sauts(calcul);
    return droiteDessins({depart: calcul.donnees.a, sauts, direct: sauts.length > 1 ? calcul.reponse : undefined,
      trou: true, etapes: a2Etapes(calcul).length});
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

  const COLONNES_M2 = Object.freeze([5, 4, 3, 2, 1, 0]);
  const COLONNES_D2 = Object.freeze([3, 2, 1, 0, -1, -2, -3]);
  const MILLE = `1${ESPACE_FINE}000`;

  // Du plus simple au plus dur, pour M2 et D2 : la forme d'abord (les
  // produits, puis les trous sur la puissance, puis les trous sur le nombre,
  // puis les divisions), la puissance (× 10 avant × 1 000), la taille du
  // nombre (ses chiffres, ses décimales, un nombre sous 1).
  const GLISSE_FORMES = Object.freeze({produit: 0, "produit-gauche": 1, "trou-facteur": 2, "trou-egal": 3, "trou-nombre": 4, "trou-nombre-gauche": 5, division: 6});
  function glisseDifficulte(calcul) {
    const {n, p} = calcul.donnees;
    const zeros = calcul.module === "D2" && estProduit(calcul) ? Math.max(0, colonnesDe(p) - decimalesDe(n)) : 0;
    return GLISSE_FORMES[calcul.forme] * 1000 + colonnesDe(p) * 100 + zeros * 60 + (n < 1 ? 40 : 0)
      + String(Math.trunc(n)).length * 10 + decimalesDe(n) * 10;
  }

  // L'outil du début de l'entraînement, et de « je représente » : le
  // tableau à flèches, l'arrivée à écrire (ses zéros sont des « ? ») ; sur
  // un trou de la puissance, l'étiquette dit « × ? ».
  function glisseAide(calcul) {
    const image = tableauDe(calcul);
    if (calcul.forme === "trou-facteur" || calcul.forme === "trou-egal") return Object.assign({}, image, {masque: true});
    // « □ × 100 = 9 400 » : on part de l'arrivée et on revient (÷ 100), sinon
    // le tableau écrirait le nombre cherché en haut.
    if (estTrouNombre(calcul)) {
      const {n, p, m} = calcul.donnees;
      return {outil: "tableau-fleches", depart: m, arrivee: n, p, operation: "÷", virgule: calcul.module === "D2", inconnue: true};
    }
    return Object.assign({}, image, {inconnue: true});
  }

  // Le glisse-nombres d'un calcul de M2 ou D2 : le nombre de départ dans la
  // bande, et le glissement attendu. Sur un trou de la puissance, on glisse
  // jusqu'à lire l'arrivée.
  function glisseManipulation(calcul) {
    const {n, p, m} = calcul.donnees;
    const colonnes = calcul.module === "D2" ? COLONNES_D2 : COLONNES_M2;
    const k = colonnesDe(p);
    const division = calcul.forme === "division" || estTrouNombre(calcul);
    const depart = division ? m : n;
    const arrivee = division ? n : m;
    const trou = calcul.forme === "trou-facteur" || calcul.forme === "trou-egal";
    const sens = division ? "moins" : "plus";
    return Object.freeze({
      outil: "glisse", depart, colonnes, decalage: division ? -k : k,
      texte: calcul.texte.replace(CASE, "?"),
      consigne: trou ? `Glisse jusqu’à lire ${formaterNombre(m)}.` : `Chaque chiffre vaut ${formaterNombre(p)} fois ${sens}.`,
      refus: trou ? null : `Chaque chiffre doit valoir ${formaterNombre(p)} fois ${sens}\u00a0: ${pluriel(k, "colonne")}.`,
      traces: Object.freeze([Object.freeze({
        apres: 1,
        attente: trou ? `${formaterNombre(n)} × … = ${formaterNombre(m)}` : `${formaterNombre(depart)} ${division ? "÷" : "×"} ${formaterNombre(p)} = …`,
        texte: trou ? `${formaterNombre(n)} × ${formaterNombre(p)} = ${formaterNombre(m)}` : `${formaterNombre(depart)} ${division ? "÷" : "×"} ${formaterNombre(p)} = ${formaterNombre(arrivee)}`
      })])
    });
  }

  // Les trois temps d'un niveau de M2 ou D2, sur trois calculs différents :
  // le glisse-nombres (les chiffres glissent, la virgule ne bouge pas) sur
  // le premier, le tableau à flèches sur le deuxième, les étapes écrites sur
  // le troisième.
  //   calcul     : le calcul du glisse-nombres
  //   represente : le calcul du tableau (son arrivée à trouver, ou « × ? »)
  //   ecris      : {calcul, etapes: [{texte, reponse}], phrase}
  //   colonnes   : les rangs du glisse-nombres (5 = centaines de mille,
  //                0 = unités, −3 = millièmes)
  //   consigne   : celle du glisse-nombres et du tableau
  //   refus      : la phrase d'un glissement faux (null : la consigne tremble)
  function glisseApprends({calcul, exemple, represente, ecris, colonnes, consigne, consigneTableau = consigne, refus, trace, bilan}) {
    const {n, m} = calcul.donnees;
    const decalage = calcul.forme === "division" ? -colonnesDe(calcul.donnees.p) : colonnesDe(calcul.donnees.p);
    return Object.freeze({
      exemple: Object.freeze({texte: exemple, reponse: calcul.reponse}),
      manipule: Object.freeze({
        outil: "glisse", depart: calcul.forme === "division" ? m : n, colonnes: Object.freeze(colonnes.slice()),
        decalage, consigne, refus,
        traces: Object.freeze([Object.freeze({apres: 1, attente: trace[0], texte: trace[1]})])
      }),
      represente: Object.freeze({
        outil: "tableau-fleches", consigne: consigneTableau,
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(glisseAide(represente)),
        solution: Object.freeze({image: tableauDe(represente), phrase: ecris.phraseRepresente || glissePhrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        etapes: Object.freeze(ecris.etapes.map(e => Object.freeze(Object.assign({}, e)))), reponse: ecris.calcul.reponse,
        solution: Object.freeze({image: tableauDe(ecris.calcul), phrase: ecris.phrase || glissePhrase(ecris.calcul)})
      }, tableauDessins(glisseAide(ecris.calcul), tableauDe(ecris.calcul), ecris.etapes)),
      bilan,
      image: Object.freeze(tableauDe(calcul)),
      textes: Object.freeze([calcul.texte, represente.texte, ecris.calcul.texte])
    });
  }

  // La phrase qui lit la réponse d'un calcul de M2 ou D2, au 2e essai faux.
  function glissePhrase(calcul) {
    const {n, p, m} = calcul.donnees;
    if (calcul.forme === "trou-facteur" || calcul.forme === "trou-egal") return `Regarde\u00a0: de ${formaterNombre(n)} à ${formaterNombre(m)}, les chiffres glissent de ${pluriel(colonnesDe(p), "colonne")}\u00a0: c’est × ${formaterNombre(p)}.`;
    if (calcul.forme === "division" || estTrouNombre(calcul)) return `Regarde\u00a0: ${formaterNombre(m)} ÷ ${formaterNombre(p)} = ${formaterNombre(n)}.`;
    return `Regarde\u00a0: ${formaterNombre(n)} × ${formaterNombre(p)} = ${formaterNombre(m)}.`;
  }

  // ------------------------------------------------------------- les 74 modules
  //
  // La carte v2 (30/10/2026) : 45 modules, 129 compétences. Chaque niveau
  // porte SON palier (par classe) et son type (F = fait à savoir par cœur,
  // P = procédure). Les 29 identifiants réservés (palier 0) restent décrits
  // dans l'ancienne carte et ne sont jamais affichés.

  // L'ordre du parcours (carte v2 du 30/10/2026, § 3) : la séance prend
  // toujours la première compétence de cette liste qui n'est pas dans les
  // boîtes. Les modules non construits sont sautés.
  const ORDRE = Object.freeze([
    // palier 1 : 37 compétences
    "A1-1", "A1-2", "A1-3", "A10-1", "A11-1", "M1-1", "A10-2", "A11-2", "A2-1", "A3-1",
    "M4-1", "A2-2", "M2-1", "A4-1", "A4-2", "A5-1", "A6-1", "M4-2", "A2-3", "A3-2",
    "A7-1", "M1-2", "A10-3", "A11-3", "A5-2", "A6-2", "M3-1", "A7-2", "M5-1", "A4-3",
    "M6-1", "A8-1", "A5-3", "M8-1", "M1-3", "M6-2", "M8-2",
    // palier 2 : 32 compétences
    "A2-4", "A6-3", "D1-1", "M2-2", "F2-1", "A3-3", "D2-1", "D3-1", "M7-1", "A7-3",
    "F1-1", "M3-2", "D1-2", "F3-1", "A4-4", "M7-2", "D4-1", "F3-2", "C1-1", "A8-2",
    "F5-1", "M8-3", "C3-1", "F6-1", "M10-1", "F8-1", "A8-3", "F3-3", "C3-2", "F5-2",
    "M12-1", "F8-2",
    // palier 3 : 45 compétences
    "A5-4", "A6-4", "D2-2", "D3-2", "M3-3", "F2-2", "D8-1", "M13-1", "D1-3", "D2-3",
    "D3-3", "F1-2", "D6-1", "M7-3", "D4-2", "M11-1", "D5-1", "F4-1", "D6-2", "M13-2",
    "D8-2", "F6-2", "A3-4", "D4-3", "C1-2", "D7-1", "M10-2", "F8-3", "D9-1", "M11-2",
    "F6-3", "D8-3", "C3-3", "M12-2", "F5-3", "D9-2", "F9-1", "M13-3", "A9-1", "C1-3",
    "F11-1", "C4-1", "A9-2", "F9-2", "C4-2",
    // palier 4 : 15 compétences
    "D2-4", "D5-2", "M9-1", "F1-3", "D6-3", "M10-3", "A9-3", "D7-2", "M12-3", "F4-2",
    "M9-2", "D7-3", "F11-2", "A9-4", "M9-3"
  ]);

  const A2 = {
    id: "A2", nom: "Compléments à la dizaine, à 100, à 1\u202f000", exemple: "37 + ? = 100",
    famille: "A", construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A2_ERREURS, image: a2Image, aide: a2Aide, manipulation: calcul => a2Perles(calcul), difficulte: a2Difficulte,
    niveaux: [
      {
        n: 1, titre: "à la dizaine suivante", nom: "Compléments à la dizaine", palier: 1, type: "F",
        composer: a2Niveau1,
        imposes: [a2Complement(1, 433, 440, {suivante: true})],
        apprends: a2Apprends({
          manipule: {a: 67, cible: 70}, represente: {a: 48, cible: 50}, ecris: {a: 433, cible: 440},
          consigneManipule: "Finis la rangée d’un coup.",
          consigne: "Pour aller à la dizaine suivante, je complète les unités.",
          bilan: "Pour aller à la dizaine suivante, je complète les unités."
        })
      },
      {
        n: 2, titre: "à 100\u00a0: dizaines et nombres en 5", nom: "Compléments à 100\u00a0: dizaines", palier: 1, type: "F",
        composer: a2Niveau2,
        imposes: [a2Complement(2, 75, 100), a2Difference(2, 35, 100)],
        apprends: a2Apprends({
          manipule: {a: 40, cible: 100}, represente: {a: 65, cible: 100}, ecris: {a: 20, cible: 100},
          consigneManipule: "Pousse les rangées qui manquent, 10 perles d’un coup.",
          consigne: "Je vais à la dizaine, puis je compte les dizaines jusqu’à 100.",
          bilan: "40 et 60, 30 et 70… les dizaines qui font 100, je les sais."
        })
      },
      {
        n: 3, titre: "à 100\u00a0: tous les nombres", nom: "Compléments à 100", palier: 1, type: "P",
        composer: a2Niveau3,
        imposes: [a2Complement(3, 61, 100), a2Complement(3, 29, 100), a2Complement(3, 13, 100)],
        apprends: a2Apprends({
          manipule: {a: 37, cible: 100}, represente: {a: 58, cible: 100}, ecris: {a: 24, cible: 100},
          consigneManipule: "Finis la rangée d’un coup, puis pousse les rangées qui manquent.",
          consigne: "Je vais à la dizaine, puis à 100.",
          bilan: "Pour aller à 100, je vais d’abord à la dizaine, puis à 100."
        })
      },
      {
        n: 4, titre: "à 1\u202f000 et à la centaine suivante", nom: "Compléments à 1\u202f000", palier: 2, type: "P",
        composer: a2Niveau4,
        imposes: [a2Complement(4, 650, 1000), a2Complement(4, 230, 300, {suivante: true})],
        apprends: a2Apprends({
          manipule: null, represente: {a: 650, cible: 1000}, ecris: {a: 370, cible: 1000},
          consigne: "Je vais à la centaine, puis à 1\u202f000.",
          bilan: "Pour aller à 1\u202f000, je vais d’abord à la centaine, puis à 1\u202f000."
        })
      }
    ]
  };

  const A5 = {
    id: "A5", nom: "Ajouter 9, 19, 29… et 8, 18, 28…", exemple: "47 + 19",
    famille: "A", construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A5_ERREURS, image: a5Image, aide: a5Aide, manipulation: a5Perles, difficulte: a5Difficulte,
    niveaux: [
      {
        n: 1, titre: "+ 9", palier: 1, type: "P",
        composer: a5Niveau(1, [9]),
        imposes: [a5Somme(1, 31, 9), a5Somme(1, 94, 9)],
        apprends: a5Apprends(47, 65, 28, 9, "+ 9, c’est + 10 puis − 1.")
      },
      {
        n: 2, titre: "+ 19, 29, 39", palier: 1, type: "P",
        composer: a5Niveau(2, [19, 29, 39]),
        imposes: [a5Somme(2, 31, 19), a5Somme(2, 285, 19)],
        apprends: a5Apprends(47, 38, 26, 19, "Pour ajouter 19, j’ajoute 20, puis je retranche 1.")
      },
      {
        n: 3, titre: "+ 8, 18, 28, 38", palier: 1, type: "P",
        composer: a5Niveau(3, [8, 18, 28, 38]),
        imposes: [a5Somme(3, 53, 38), a5Somme(3, 147, 18)],
        apprends: a5Apprends(53, 47, 65, 38, "Pour ajouter 38, j’ajoute 40, puis je retranche 2.")
      },
      {
        n: 4, titre: "+ 48, 49… 98, 99", palier: 3, type: "P",
        composer: a5Niveau(4, [48, 49, 58, 59, 68, 69, 78, 79, 88, 89, 98, 99]),
        imposes: [a5Somme(4, 152, 98), a5Somme(4, 126, 99)],
        apprends: a5Apprends(23, 126, 347, 99, "Pour ajouter 99, j’ajoute 100, puis je retranche 1.")
      }
    ]
  };

  // `montre` (lot « relier ») : la partie du tableau que l'étape remplit,
  // « entiers » ou « decimaux » ; sans lui, tout le nombre.
  const etapeDe = (texte, reponse, montre) => (montre ? {texte, reponse, montre} : {texte, reponse});

  const M2 = {
    id: "M2", nom: "× 10, × 100, × 1\u202f000 (entiers)", exemple: "27 × 100",
    famille: "M", construit: true,
    aide_entraine: "tableau-fleches",
    erreurs: M2_ERREURS, image: tableauDe, aide: glisseAide, manipulation: glisseManipulation, difficulte: glisseDifficulte,
    niveaux: [
      {
        n: 1, titre: "produits", nom: "× 10, × 100, × 1\u202f000", palier: 1, type: "P",
        composer: m2Niveau1,
        imposes: [produit("M2", 1, 38, 10), produit("M2", 1, 9, 100, true)],
        apprends: glisseApprends({
          calcul: produit("M2", 1, 27, 100), exemple: "27 × 100", colonnes: COLONNES_M2,
          represente: produit("M2", 1, 45, 10),
          ecris: {calcul: produit("M2", 1, 8, 1000), etapes: [etapeDe(`8 × ${MILLE} = 8 milliers = ${CASE}`, 8000)]},
          consigne: "Chaque chiffre vaut 100 fois plus.", consigneTableau: "Chaque chiffre vaut 10 fois plus.",
          refus: "Chaque chiffre doit valoir 100 fois plus\u00a0: 2 colonnes.",
          trace: ["27 × 100 = …", `27 × 100 = 2${ESPACE_FINE}700`],
          bilan: "Quand je multiplie par 100, chaque chiffre prend une valeur 100 fois plus grande."
        })
      },
      {
        n: 2, titre: "nombres en 0, trous, divisions", nom: "× 10, × 100\u00a0: trous, divisions", palier: 2, type: "P",
        composer: m2Niveau2,
        imposes: [produit("M2", 2, 30, 100), trouFacteur("M2", 2, 35, 100), division("M2", 2, 48, 10)],
        apprends: glisseApprends({
          calcul: division("M2", 2, 48, 10), exemple: "480 ÷ 10", colonnes: COLONNES_M2,
          represente: produit("M2", 2, 30, 100),
          ecris: {calcul: trouFacteur("M2", 2, 35, 100), etapes: [etapeDe(`35 × ${CASE} = 3${ESPACE_FINE}500`, 100)]},
          consigne: "Chaque chiffre vaut 10 fois moins.", consigneTableau: "Chaque chiffre vaut 100 fois plus.",
          refus: "Chaque chiffre doit valoir 10 fois moins\u00a0: 1 colonne.",
          trace: ["480 ÷ 10 = …", "480 ÷ 10 = 48"],
          bilan: "Quand je divise par 10, chaque chiffre prend une valeur 10 fois plus petite."
        })
      }
    ]
  };
  // Les modules à décimales ont la touche « , » au-dessus du pavé.
  const D2 = {
    id: "D2", nom: "× 10, × 100, × 1\u202f000 avec virgule", exemple: "7,54 × 100",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "tableau-fleches",
    erreurs: D2_ERREURS, image: tableauDe, aide: glisseAide, manipulation: glisseManipulation, difficulte: glisseDifficulte,
    niveaux: [
      {
        n: 1, titre: "× 10", nom: "Décimal × 10", palier: 2, type: "P",
        composer: d2Niveau1,
        imposes: [produit("D2", 1, 0.6, 10), produit("D2", 1, 2.5, 10)],
        apprends: glisseApprends({
          calcul: produit("D2", 1, 2.5, 10), exemple: "2,5 × 10", colonnes: COLONNES_D2,
          represente: produit("D2", 1, 0.6, 10),
          ecris: {calcul: produit("D2", 1, 72.41, 10), etapes: [etapeDe(`72 × 10 = ${CASE}`, 720, "entiers"), etapeDe(`0,41 × 10 = ${CASE}`, 4.1, "decimaux"), etapeDe(`72,41 × 10 = ${CASE}`, 724.1)]},
          consigne: "Chaque chiffre vaut 10 fois plus.",
          refus: "Chaque chiffre doit valoir 10 fois plus\u00a0: 1 colonne.",
          trace: ["2,5 × 10 = …", "2,5 × 10 = 25"],
          bilan: "Quand je multiplie par 10, chaque chiffre prend une valeur 10 fois plus grande. La virgule ne bouge pas, ce sont les chiffres qui glissent."
        })
      },
      {
        n: 2, titre: "× 100, × 1\u202f000 sans zéro à écrire", nom: "Décimal × 100, × 1\u202f000", palier: 3, type: "P",
        composer: d2Niveau2,
        imposes: [produit("D2", 2, 7.54, 100), produit("D2", 2, 4.107, 1000)],
        apprends: glisseApprends({
          calcul: produit("D2", 2, 7.54, 100), exemple: "7,54 × 100", colonnes: COLONNES_D2,
          represente: produit("D2", 2, 4.107, 1000),
          ecris: {calcul: produit("D2", 2, 3.24, 100), etapes: [etapeDe(`3 × 100 = ${CASE}`, 300, "entiers"), etapeDe(`0,24 × 100 = ${CASE}`, 24, "decimaux"), etapeDe(`3,24 × 100 = ${CASE}`, 324)]},
          consigne: "Chaque chiffre vaut 100 fois plus.", consigneTableau: "Chaque chiffre vaut 1\u202f000 fois plus.",
          refus: "Chaque chiffre doit valoir 100 fois plus\u00a0: 2 colonnes.",
          trace: ["7,54 × 100 = …", "7,54 × 100 = 754"],
          bilan: "Quand je multiplie par 100, chaque chiffre prend une valeur 100 fois plus grande."
        })
      },
      {
        n: 3, titre: "des zéros à écrire", nom: "Décimal\u00a0: zéros à écrire", palier: 3, type: "P",
        composer: d2Niveau3,
        imposes: [produit("D2", 3, 3.6, 100), produit("D2", 3, 72.4, 100), produit("D2", 3, 0.2, 100)],
        apprends: glisseApprends({
          calcul: produit("D2", 3, 3.6, 100), exemple: "3,6 × 100", colonnes: COLONNES_D2,
          represente: produit("D2", 3, 72.4, 100),
          ecris: {calcul: produit("D2", 3, 4.5, 1000), etapes: [etapeDe(`4 × ${MILLE} = ${CASE}`, 4000, "entiers"), etapeDe(`0,5 × ${MILLE} = ${CASE}`, 500, "decimaux"), etapeDe(`4,5 × ${MILLE} = ${CASE}`, 4500)]},
          consigne: "Chaque chiffre vaut 100 fois plus.",
          refus: "Chaque chiffre doit valoir 100 fois plus\u00a0: 2 colonnes.",
          trace: ["3,6 × 100 = …", "3,6 × 100 = 360"],
          bilan: "Quand une case reste vide, j’écris un zéro\u00a0: 3,6 × 100 = 360."
        })
      },
      {
        n: 4, titre: "trous", nom: "Décimal\u00a0: trous", palier: 4, type: "P",
        composer: d2Niveau4,
        imposes: [trouFacteur("D2", 4, 3.6, 100), trouNombre("D2", 4, 0.45, 100), trouEgal("D2", 4, 1.2, 1000)],
        apprends: glisseApprends({
          calcul: trouEgal("D2", 4, 1.2, 1000), exemple: `1${ESPACE_FINE}200 = 1,2 × ?`, colonnes: COLONNES_D2,
          represente: trouFacteur("D2", 4, 0.45, 100),
          ecris: {calcul: trouFacteur("D2", 4, 3.6, 100), etapes: [etapeDe(`3,6 × ${CASE} = 360`, 100)]},
          consigne: `Glisse jusqu’à lire 1${ESPACE_FINE}200.`, consigneTableau: "Je compte les colonnes.",
          refus: null,
          trace: [`1,2 × … = 1${ESPACE_FINE}200`, `1,2 × ${MILLE} = 1${ESPACE_FINE}200`],
          bilan: "Pour trouver par combien on a multiplié, je compte les colonnes."
        })
      }
    ]
  };

  // ------------------------------------- A1, A10, A11 : passer par la dizaine
  //
  // Modules lot 1 (31/10/2026). Un calcul d'ajout ou de retrait de moins de
  // 10 se lit sur la droite : on part de n, on fait un saut d (signé), on
  // arrive en m = n + d. S'il franchit une dizaine (une centaine, un
  // millier), on s'y arrête : deux sauts. Les données : {n, d, m}, et la
  // réponse fausse d'une erreur connue quand elle ne se calcule pas
  // simplement à partir d'eux (pour l'exemple de la page prof).

  // La dizaine franchie par un saut de moins de 10, ou null. En reculant
  // depuis une dizaine entière (50 − 6), on ne s'arrête nulle part : un seul
  // saut.
  function dizainePassee(n, d) {
    if (d > 0) {
      const palier = Math.floor(n / 10) * 10 + 10;
      return n + d > palier ? palier : null;
    }
    if (n % 10 === 0) return null;
    const palier = Math.floor(n / 10) * 10;
    return n + d < palier ? palier : null;
  }

  // Vrai quand le calcul change de dizaine (unite = 10), de centaine (100)…
  // 50 − 6 passe la dizaine, 400 − 6 la centaine, même en un seul saut.
  const franchit = (n, d, unite) => Math.floor(n / unite) !== Math.floor((n + d) / unite) && (d < 0 || (n + d) % unite !== 0);

  function sautsDe(n, d) {
    const palier = dizainePassee(n, d);
    return palier === null ? {palier, sauts: [d]} : {palier, sauts: [palier - n, n + d - palier]};
  }

  // Un calcul des modules A1, A10, A11. Formes :
  //  - « somme »            : 47 + 8 = □
  //  - « difference »       : 523 − 7 = □
  //  - « complement »       : 6 + □ = 13
  //  - « complement-egal »  : 13 = 6 + □
  // La clé de « 13 = 6 + □ » finit par « x » : sans lui, elle serait celle
  // de « 13 − 6 = □ ».
  function lignePlus(module, niveau, forme, n, d) {
    const m = n + d;
    const u = n % 10;
    const extra = {};
    // « Le petit du grand » (523 − 7 → 524) : la réponse fausse, pour la page prof.
    if (d < 0 && u > 0 && -d > u) extra.inverse = n - u + (-d - u);
    if (forme === "somme") return fabriquer(module, niveau, forme, [n, "+", d, "=", TROU], m, Object.assign({n, d, m}, extra));
    if (forme === "difference") return fabriquer(module, niveau, forme, [n, "−", -d, "=", TROU], m, Object.assign({n, d, m}, extra));
    if (forme === "complement") return fabriquer(module, niveau, forme, [n, "+", TROU, "=", m], d, {n, d, m});
    const calcul = fabriquer(module, niveau, forme, [m, "=", n, "+", TROU], d, {n, d, m});
    return Object.freeze(Object.assign({}, calcul, {cle: `${calcul.cle}-x`}));
  }

  // Un trou : on cherche le saut (6 + □ = 13), ou l'écart entre deux nombres
  // proches (A8 : 73 − 68 = □, 4 000 − □ = 3 999).
  const FORMES_TROU = new Set(["complement", "complement-egal", "ecart", "ecart-trou"]);
  const estTrou = calcul => FORMES_TROU.has(calcul.forme);

  // Les sauts d'un complément : jusqu'à 10, puis jusqu'à la cible.
  function sautsDuCalcul(calcul) {
    const {n, d} = calcul.donnees;
    return sautsDe(n, d);
  }

  // L'image d'un calcul, réponse montrée (la correction, « À retenir »).
  function plusImage(calcul, gras = 0) {
    const {n, d} = calcul.donnees;
    const {sauts} = sautsDuCalcul(calcul);
    const image = {outil: "droite-sauts", depart: n, sauts: sauts.map(val => ({val})), gras: sauts.length > 1 ? gras : 0};
    if (!estTrou(calcul)) {
      image.acquis = [sauts.length];
      if (sauts.length > 1) image.direct = d;
    }
    return image;
  }

  // L'outil du début de l'entraînement, et de « je représente » : pour un
  // ajout ou un retrait, les sauts sont donnés, les arrivées sont « ? » ;
  // pour un trou, les points sont donnés, les sauts disent « + ? ».
  function plusAide(calcul) {
    const image = plusImage(calcul);
    delete image.acquis;
    if (estTrou(calcul)) return Object.assign(image, {sauts: image.sauts.map(saut => ({val: saut.val, masque: true}))});
    return Object.assign(image, {inconnues: image.sauts.map((_, i) => i + 1)});
  }

  // Le dessin de « J'écris » (lot « relier ») : la droite du calcul, qui se
  // remplit étape par étape ; un trou en deux sauts a aussi son saut direct
  // (6 + □ = 13 : + 4, + 3, puis + 7 dessous).
  function plusDessins(calcul, etapes) {
    const {n, d} = calcul.donnees;
    const {sauts} = sautsDuCalcul(calcul);
    return droiteDessins({depart: n, sauts, direct: sauts.length > 1 ? d : undefined, trou: estTrou(calcul), etapes});
  }

  const signe = d => (d < 0 ? "−" : "+");

  function plusPhrase(calcul) {
    const {n, d, m} = calcul.donnees;
    const {palier, sauts} = sautsDuCalcul(calcul);
    if (estTrou(calcul)) {
      if (palier === null) return `De ${formaterNombre(n)} à ${formaterNombre(m)}, c’est + ${formaterNombre(d)}.`;
      return `Regarde : ${sauts[0]} puis ${sauts[1]}, ça fait ${d}.`;
    }
    if (palier === null) return `Regarde : ${signe(d)} ${Math.abs(d)}, ça fait ${formaterNombre(m)}.`;
    return `Regarde : ${signe(d)} ${Math.abs(sauts[0])}, ça fait ${formaterNombre(palier)} ; ${signe(d)} ${Math.abs(sauts[1])}, ça fait ${formaterNombre(m)}.`;
  }

  // Le rekenrek d'un calcul (jusqu'à 100) : la rangée finie (ou vidée) d'un
  // coup, puis le reste. La consigne d'un trou ne donne jamais le nombre
  // cherché ; celle d'un passage ne donne pas le découpage.
  function plusPerles(calcul) {
    const {n, d, m} = calcul.donnees;
    if (Math.max(n, m) > 100) return null;
    const {palier, sauts} = sautsDuCalcul(calcul);
    const trou = estTrou(calcul);
    const op = signe(d);
    const traces = [];
    if (palier === null) {
      traces.push(trou
        ? Object.freeze({apres: 1, attente: `${n} + … = ${m}`, texte: `${n} + ${d} = ${m}`})
        : Object.freeze({apres: 1, attente: `${n} ${op} ${Math.abs(d)} = …`, texte: `${n} ${op} ${Math.abs(d)} = ${m}`}));
    } else {
      traces.push(Object.freeze({apres: 1, attente: `${n} ${op} … = ${palier}`, texte: `${n} ${op} ${Math.abs(sauts[0])} = ${palier}`}));
      traces.push(trou
        ? Object.freeze({apres: 2, attente: `${palier} + … = ${m}`, texte: `${palier} + ${sauts[1]} = ${m}`})
        : Object.freeze({apres: 2, attente: `${palier} ${op} … = …`, texte: `${palier} ${op} ${Math.abs(sauts[1])} = ${m}`}));
      traces.push(Object.freeze(trou
        ? {apres: 2, attente: `${n} + … = ${m}`, texte: `${n} + ${d} = ${m}`}
        : {apres: 2, attente: `${n} ${op} ${Math.abs(d)} = …`, texte: `${n} ${op} ${Math.abs(d)} = ${m}`}));
    }
    let consigne;
    if (trou) consigne = palier === null ? "Finis la rangée d’un coup." : "Finis la rangée d’un coup, puis pousse les perles qui manquent.";
    else if (d > 0) consigne = palier === null ? `Pousse ${d} perle${d > 1 ? "s" : ""} d’un coup.` : "Finis la rangée d’un coup, puis pousse le reste.";
    else consigne = palier === null ? `Retire ${-d} perle${d < -1 ? "s" : ""} d’un coup.` : "Vide la rangée d’un coup, puis retire le reste.";
    return Object.freeze({
      outil: "perles", depart: n,
      texte: trou ? calcul.texte.replace(CASE, "?") : `${n} ${op} ${Math.abs(d)}`,
      gestes: Object.freeze(sauts.slice()), consigne, traces: Object.freeze(traces)
    });
  }

  // Les trois temps de J'apprends d'un niveau d'A1, A10, A11, sur trois
  // calculs différents : les perles (jusqu'à 100), la droite avec ses « ? »,
  // les étapes à remplir.
  function plusApprends({manipule, represente, ecris, etapes, consigne, bilan}) {
    const premier = manipule || represente;
    return Object.freeze({
      exemple: Object.freeze({texte: estTrou(premier) ? premier.texte.replace(CASE, "?") : premier.texte.replace(` = ${CASE}`, ""), reponse: premier.reponse}),
      manipule: manipule ? plusPerles(manipule) : null,
      represente: Object.freeze({
        outil: "droite-sauts", consigne,
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(plusAide(represente)),
        solution: Object.freeze({image: plusImage(represente), phrase: plusPhrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        etapes: Object.freeze(etapes.map(([texte, reponse]) => Object.freeze({texte, reponse}))),
        reponse: ecris.reponse,
        solution: Object.freeze({image: plusImage(ecris), phrase: plusPhrase(ecris)})
      }, plusDessins(ecris, etapes.length)),
      bilan,
      image: Object.freeze(plusImage(premier)),
      textes: Object.freeze([premier.texte, represente.texte, ecris.texte])
    });
  }

  // Du plus simple au plus dur : la forme, puis le passage (dizaine, puis
  // centaine, puis millier), la taille du saut, celle du nombre de départ.
  const PLUS_FORMES = Object.freeze({somme: 0, difference: 0, complement: 1, "complement-egal": 2});
  function plusDifficulte(calcul) {
    const {n, d, m} = calcul.donnees;
    const franchi = estTrou(calcul) ? (sautsDuCalcul(calcul).palier === null ? 0 : 1)
      : franchit(n, d, 1000) ? 3 : franchit(n, d, 100) ? 2 : franchit(n, d, 10) ? 1 : 0;
    return PLUS_FORMES[calcul.forme] * 2000 + franchi * 400 + Math.abs(d) * 20 + String(Math.max(n, m)).length * 5 + (n % 10 === 0 ? 3 : 0);
  }

  // « 526 : la dizaine n’a pas changé. On passe 520 : 523 − 3 = 520, puis
  // − 4. » En reculant depuis une dizaine entière (50 − 6 → 54), il n'y a
  // pas d'arrêt : on le dit sans lui.
  function pasChange(calcul, reponse, quoi) {
    const {n, d} = calcul.donnees;
    const {palier, sauts} = sautsDuCalcul(calcul);
    if (palier === null) return `${formaterNombre(reponse)} : ${quoi} n’a pas changé. En reculant depuis ${formaterNombre(n)}, on passe sous ${formaterNombre(n)}.`;
    return `${formaterNombre(reponse)} : ${quoi} n’a pas changé. On passe ${formaterNombre(palier)} : ${formaterNombre(n)} ${signe(d)} ${Math.abs(sauts[0])} = ${formaterNombre(palier)}, puis ${signe(d)} ${Math.abs(sauts[1])}.`;
  }

  // Les erreurs connues, communes aux trois modules : chacune ne se
  // reconnaît que là où elle a un sens (un trou, un retrait, un passage).
  const PLUS_CAUSES = Object.freeze({
    arrivee: Object.freeze({
      nom: "l’arrivée donnée",
      test: (calcul, reponse) => estTrou(calcul) && memeNombre(reponse, calcul.donnees.m),
      retour: calcul => `Tu as écrit l’arrivée. Combien faut-il ajouter à ${formaterNombre(calcul.donnees.n)} pour arriver à ${formaterNombre(calcul.donnees.m)} ?`,
      gras: 0
    }),
    ajoute: Object.freeze({
      nom: "ajouté au lieu de retrancher",
      test: (calcul, reponse) => {
        const {n, d, m} = calcul.donnees;
        if (calcul.forme === "difference") return memeNombre(reponse, n - d);
        return estTrou(calcul) && memeNombre(reponse, n + m);
      },
      retour: (calcul, reponse) => {
        const {n, d, m} = calcul.donnees;
        if (calcul.forme === "difference") return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} + ${-d}. Ici, on retire : on recule.`;
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} + ${formaterNombre(m)}. On cherche ce qui manque pour aller de ${formaterNombre(n)} à ${formaterNombre(m)}.`;
      },
      gras: 0
    }),
    inverse: Object.freeze({
      nom: "le petit chiffre retiré du grand",
      test: (calcul, reponse) => calcul.donnees.inverse !== undefined && memeNombre(reponse, calcul.donnees.inverse),
      retour: calcul => {
        const {n, d} = calcul.donnees;
        const {palier} = sautsDuCalcul(calcul);
        const u = n % 10;
        if (palier === null) return `Tu as fait ${-d} − ${u}. Mais on retire ${-d} à ${formaterNombre(n)} : recule de ${-d}.`;
        return `Tu as fait ${-d} − ${u}. Mais on retire ${-d} à ${formaterNombre(n)} : recule jusqu’à ${formaterNombre(palier)}, puis encore.`;
      },
      gras: 1
    }),
    dizaine: Object.freeze({
      nom: "la dizaine pas changée",
      test: (calcul, reponse) => {
        const {d, m} = calcul.donnees;
        return !estTrou(calcul) && franchit(calcul.donnees.n, d, 10) && memeNombre(reponse, m - 10 * Math.sign(d));
      },
      retour: (calcul, reponse) => pasChange(calcul, reponse, "la dizaine"),
      gras: 2
    }),
    centaine: Object.freeze({
      nom: "la centaine pas changée",
      test: (calcul, reponse) => {
        const {d, m} = calcul.donnees;
        return !estTrou(calcul) && franchit(calcul.donnees.n, d, 100) && memeNombre(reponse, m - 100 * Math.sign(d));
      },
      retour: (calcul, reponse) => pasChange(calcul, reponse, "la centaine"),
      gras: 2
    }),
    unPres: Object.freeze({
      nom: "à 1 près",
      test: (calcul, reponse) => Math.abs(reponse - calcul.reponse) === 1,
      retour: calcul => {
        const {n, m} = calcul.donnees;
        // Sur un trou, les sauts sont ce qu'on cherche : on ne les dit pas
        // (« 9 + □ = 10 » : « + 1 » serait la réponse).
        if (estTrou(calcul)) return `C’est à 1 près. Pars de ${formaterNombre(n)} et avance jusqu’à ${formaterNombre(m)}, sans compter le départ.`;
        const {sauts} = sautsDuCalcul(calcul);
        const texte = sauts.map(s => `${signe(s)} ${Math.abs(s)}`).join(", puis ");
        return `C’est à 1 près. Pars de ${formaterNombre(n)} et fais les sauts sans compter le départ : ${texte}.`;
      },
      gras: 0
    })
  });
  const causes = liste => Object.freeze(liste.map(([c, nom]) => Object.freeze(Object.assign({c}, PLUS_CAUSES[nom]))));

  const A1_ERREURS = causes([[1, "arrivee"], [2, "ajoute"], [3, "inverse"], [4, "unPres"]]);
  const A10_ERREURS = causes([[1, "dizaine"], [2, "centaine"], [3, "unPres"]]);
  const A11_ERREURS = causes([[1, "inverse"], [2, "dizaine"], [3, "centaine"], [4, "unPres"]]);

  // Un niveau tiré dans des viviers par forme (A1 : des listes courtes, toutes
  // écrites) : `parts` donne la proportion de chaque forme ; les imposés
  // prennent la place d'un calcul de leur forme.
  function composerViviers(module, niveau, viviers, parts) {
    return function composer(rng, total, imposes) {
      const nombres = repartir(total, parts);
      const pris = new Set(imposes.map(c => c.cle));
      const tires = viviers.flatMap(({forme, liste}, i) => {
        const deja = imposes.filter(c => c.forme === forme).length;
        return melanger(rng, liste.map(([n, d]) => lignePlus(module, niveau, forme, n, d)))
          .filter(c => !pris.has(c.cle)).slice(0, Math.max(0, nombres[i] - deja));
      });
      return [...tires, ...imposes];
    };
  }

  const paires = (filtre, de = 1, a = 9) => {
    const liste = [];
    for (let x = de; x <= 20; x += 1) for (let y = de; y <= a; y += 1) if (filtre(x, y)) liste.push([x, y]);
    return liste;
  };

  // A1-1 : sommes jusqu'à 10, compléments à 10 dans les deux écritures.
  const A1_SOMMES_10 = Object.freeze(paires((x, y) => x <= 9 && x + y <= 10));
  const A1_COMPLEMENTS_10 = Object.freeze(Array.from({length: 9}, (_, i) => [i + 1, 9 - i]));
  // A1-2 : un chiffre + un chiffre, au-delà de 10.
  const A1_SOMMES_20 = Object.freeze(paires((x, y) => x >= 2 && x <= 9 && y >= 2 && x + y >= 11));
  // A1-3 : les différences (en passant 10, et sous 10), les trous qui passent 10.
  const A1_DIFFERENCES_PASSAGE = Object.freeze(paires((x, y) => x >= 11 && x <= 18 && x - y < 10, 2).map(([x, y]) => [x, -y]));
  const A1_DIFFERENCES_SOUS_10 = Object.freeze(paires((x, y) => x >= 5 && x <= 10 && y >= 2 && x - y >= 1, 2).map(([x, y]) => [x, -y]));
  const A1_TROUS_20 = Object.freeze(paires((x, y) => x >= 2 && x <= 9 && x + y >= 11, 2));

  function a1Niveau3(rng, total, imposes) {
    // 3 différences sur 4 passent 10.
    const [differences, trous, egaux] = repartir(total, [6, 3, 3]);
    const [passages] = repartir(differences, [3, 1]);
    const pris = new Set(imposes.map(c => c.cle));
    const prendre = (forme, liste, nombre) => melanger(rng, liste.map(([n, d]) => lignePlus("A1", 3, forme, n, d)))
      .filter(c => !pris.has(c.cle)).slice(0, Math.max(0, nombre));
    const imposesDe = forme => imposes.filter(c => c.forme === forme).length;
    const dPassage = imposes.filter(c => c.forme === "difference" && c.donnees.n > 10).length;
    const dSous = imposesDe("difference") - dPassage;
    const passage = prendre("difference", A1_DIFFERENCES_PASSAGE, passages - dPassage);
    const sous = prendre("difference", A1_DIFFERENCES_SOUS_10, differences - passages - dSous);
    return [...passage, ...sous,
      ...prendre("complement", A1_TROUS_20, trous - imposesDe("complement")),
      ...prendre("complement-egal", A1_TROUS_20, egaux - imposesDe("complement-egal")),
      ...imposes];
  }

  // A10, A11 : des nombres de 2 ou 3 chiffres (millier compris au passage de
  // la centaine), tirés au hasard selon la règle du niveau.
  function plusNiveau(module, niveau, tirer) {
    return function composer(rng, total, imposes) {
      const pris = new Set(imposes.map(c => c.cle));
      const liste = [];
      let essais = 0;
      while (liste.length < Math.max(0, total - imposes.length) && essais < 5000) {
        essais += 1;
        const [n, d] = tirer(rng, liste.length);
        const calcul = lignePlus(module, niveau, d > 0 ? "somme" : "difference", n, d);
        if (pris.has(calcul.cle)) continue;
        pris.add(calcul.cle);
        liste.push(calcul);
      }
      return [...liste, ...imposes];
    };
  }

  // Un nombre de départ : à deux chiffres un calcul sur deux, à trois chiffres
  // l'autre (le rang du calcul dans la série décide, pour que les deux
  // soient toujours là).
  const departDe = (rng, rang, unites) => {
    const dizaines = rang % 2 === 0 ? entierEntre(rng, 2, 9) : entierEntre(rng, 10, 99);
    return {dizaines, n: dizaines * 10 + unites};
  };

  // A10-1 : sans passage (36 + 4 = 40 compris).
  const a10Niveau1 = plusNiveau("A10", 1, (rng, rang) => {
    const u = entierEntre(rng, 1, 8);
    const d = entierEntre(rng, 1, 10 - u);
    return [departDe(rng, rang, u).n, d];
  });
  // A10-2 : passage de la dizaine, sans passer la centaine.
  const a10Niveau2 = plusNiveau("A10", 2, (rng, rang) => {
    const u = entierEntre(rng, 2, 9);
    const d = entierEntre(rng, 11 - u, 9);
    let depart = departDe(rng, rang, u);
    while (depart.dizaines % 10 === 9) depart = departDe(rng, rang, u);
    return [depart.n, d];
  });
  // A10-3 : passage de la centaine (96 + 7, 196 + 7), et du millier une fois
  // sur cinq (996 + 7).
  const a10Niveau3 = plusNiveau("A10", 3, (rng, rang) => {
    const u = entierEntre(rng, 2, 9);
    const d = entierEntre(rng, 11 - u, 9);
    const centaines = rang % 5 === 4 ? 9 : entierEntre(rng, 0, 8);
    return [centaines * 100 + 90 + u, d];
  });
  // A11-1 : sans passage (157 − 7 = 150 compris).
  const a11Niveau1 = plusNiveau("A11", 1, (rng, rang) => {
    const u = entierEntre(rng, 1, 9);
    const d = entierEntre(rng, 1, u);
    return [departDe(rng, rang, u).n, -d];
  });
  // A11-2 : passage de la dizaine, sans passer la centaine ; une fois sur
  // cinq depuis une dizaine entière (50 − 6).
  const a11Niveau2 = plusNiveau("A11", 2, (rng, rang) => {
    const u = rang % 5 === 4 ? 0 : entierEntre(rng, 1, 8);
    const d = entierEntre(rng, u + 1, 9);
    let depart = departDe(rng, rang, u);
    while (depart.dizaines % 10 === 0) depart = departDe(rng, rang, u);
    return [depart.n, -d];
  });
  // A11-3 : passage de la centaine (403 − 5, 400 − 6), et du millier une
  // fois sur cinq (1 002 − 7).
  const a11Niveau3 = plusNiveau("A11", 3, (rng, rang) => {
    const u = entierEntre(rng, 0, 8);
    const d = entierEntre(rng, u + 1, 9);
    const n = rang % 5 === 4 ? entierEntre(rng, 1, 9) * 1000 + u : entierEntre(rng, 1, 9) * 100 + u;
    return [n, -d];
  });

  const ligne = (module, niveau, n, d) => lignePlus(module, niveau, d > 0 ? "somme" : "difference", n, d);
  const etapesDe = (...lignes) => lignes.map(([texte, reponse]) => [texte.replace("?", CASE), reponse]);

  const A1 = {
    id: "A1", nom: "Sommes et différences jusqu’à 20", exemple: "6 + 4",
    famille: "A", construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A1_ERREURS, image: plusImage, aide: plusAide, manipulation: plusPerles, difficulte: plusDifficulte,
    niveaux: [
      {
        n: 1, titre: "compléments à 10, sommes jusqu’à 10", nom: "Sommes jusqu’à 10", palier: 1, type: "F",
        composer: composerViviers("A1", 1, [
          {forme: "somme", liste: A1_SOMMES_10},
          {forme: "complement", liste: A1_COMPLEMENTS_10},
          {forme: "complement-egal", liste: A1_COMPLEMENTS_10}
        ], [6, 4, 2]),
        imposes: [lignePlus("A1", 1, "complement", 3, 7), lignePlus("A1", 1, "complement-egal", 7, 3)],
        apprends: plusApprends({
          manipule: lignePlus("A1", 0, "complement", 3, 7),
          represente: ligne("A1", 0, 4, 5),
          ecris: lignePlus("A1", 0, "complement-egal", 8, 2),
          etapes: etapesDe(["8 + ? = 10", 2], ["10 = 8 + ?", 2]),
          consigne: "Je pars de 4 et j’avance de 5.",
          bilan: "Pour faire 10 : 1 et 9, 2 et 8, 3 et 7, 4 et 6, 5 et 5."
        })
      },
      {
        n: 2, titre: "sommes de 11 à 20 (passer par 10)", nom: "Sommes jusqu’à 20", palier: 1, type: "F",
        composer: composerViviers("A1", 2, [{forme: "somme", liste: A1_SOMMES_20}], [1]),
        imposes: [ligne("A1", 2, 9, 6), ligne("A1", 2, 5, 8)],
        apprends: plusApprends({
          manipule: ligne("A1", 0, 8, 7),
          represente: ligne("A1", 0, 9, 4),
          ecris: ligne("A1", 0, 7, 5),
          etapes: etapesDe(["7 + 3 = ?", 10], ["10 + 2 = ?", 12], ["7 + 5 = ?", 12]),
          consigne: "Je vais à 10, puis j’ajoute le reste.",
          bilan: "Pour dépasser 10, je vais d’abord à 10, puis j’ajoute le reste : 8 + 7 = 8 + 2 + 5 = 15."
        })
      },
      {
        n: 3, titre: "dans les deux sens : différences et trous", nom: "Différences et trous jusqu’à 20", palier: 1, type: "F",
        composer: a1Niveau3,
        imposes: [ligne("A1", 3, 14, -6), lignePlus("A1", 3, "complement", 7, 5)],
        apprends: plusApprends({
          manipule: ligne("A1", 0, 15, -7),
          represente: ligne("A1", 0, 13, -5),
          ecris: lignePlus("A1", 0, "complement", 6, 7),
          etapes: etapesDe(["6 + ? = 10", 4], ["10 + ? = 13", 3], ["6 + ? = 13", 7]),
          consigne: "Je recule jusqu’à 10, puis je retire le reste.",
          bilan: "Pour passer 10 en reculant, je recule d’abord jusqu’à 10, puis je retire le reste : 15 − 7 = 15 − 5 − 2 = 8."
        })
      }
    ]
  };

  const A10 = {
    id: "A10", nom: "Ajouter un nombre à un chiffre", exemple: "47 + 8",
    famille: "A", construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A10_ERREURS, image: plusImage, aide: plusAide, manipulation: plusPerles, difficulte: plusDifficulte,
    niveaux: [
      {
        n: 1, titre: "sans passage", nom: "Ajouter un chiffre sans passage", palier: 1, type: "P",
        composer: a10Niveau1,
        imposes: [ligne("A10", 1, 153, 5)],
        apprends: plusApprends({
          manipule: ligne("A10", 0, 32, 4),
          represente: ligne("A10", 0, 53, 5),
          ecris: ligne("A10", 0, 254, 3),
          etapes: etapesDe(["4 + 3 = ?", 7], ["254 + 3 = ?", 257]),
          consigne: "J’avance de 5 : seul le chiffre des unités change.",
          bilan: "Sans passer la dizaine, seul le chiffre des unités change : 32 + 4 = 36."
        })
      },
      {
        n: 2, titre: "passage de la dizaine", nom: "Ajouter un chiffre en passant la dizaine", palier: 1, type: "P",
        composer: a10Niveau2,
        imposes: [ligne("A10", 2, 58, 6), ligne("A10", 2, 425, 9)],
        apprends: plusApprends({
          manipule: ligne("A10", 0, 47, 8),
          represente: ligne("A10", 0, 68, 5),
          ecris: ligne("A10", 0, 236, 7),
          etapes: etapesDe(["236 + 4 = ?", 240], ["240 + 3 = ?", 243], ["236 + 7 = ?", 243]),
          consigne: "Je vais à la dizaine, puis j’ajoute le reste.",
          bilan: "Pour passer la dizaine, je vais d’abord à la dizaine, puis j’ajoute le reste : 47 + 8 = 47 + 3 + 5 = 55."
        })
      },
      {
        n: 3, titre: "passage de la centaine", nom: "Ajouter un chiffre en passant la centaine", palier: 1, type: "P",
        composer: a10Niveau3,
        imposes: [ligne("A10", 3, 996, 7), ligne("A10", 3, 297, 6)],
        apprends: plusApprends({
          manipule: null,
          represente: ligne("A10", 0, 196, 7),
          ecris: ligne("A10", 0, 395, 8),
          etapes: etapesDe(["395 + 5 = ?", 400], ["400 + 3 = ?", 403], ["395 + 8 = ?", 403]),
          consigne: "Je vais à la centaine, puis j’ajoute le reste.",
          bilan: "Pour passer la centaine, je vais d’abord à la centaine, puis j’ajoute le reste : 196 + 7 = 196 + 4 + 3 = 203."
        })
      }
    ]
  };

  const A11 = {
    id: "A11", nom: "Retrancher un nombre à un chiffre", exemple: "523 − 7",
    famille: "A", construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A11_ERREURS, image: plusImage, aide: plusAide, manipulation: plusPerles, difficulte: plusDifficulte,
    niveaux: [
      {
        n: 1, titre: "sans passage", nom: "Retrancher un chiffre sans passage", palier: 1, type: "P",
        composer: a11Niveau1,
        imposes: [ligne("A11", 1, 157, -5)],
        apprends: plusApprends({
          manipule: ligne("A11", 0, 68, -4),
          represente: ligne("A11", 0, 239, -6),
          ecris: ligne("A11", 0, 486, -3),
          etapes: etapesDe(["6 − 3 = ?", 3], ["486 − 3 = ?", 483]),
          consigne: "Je recule de 6 : seul le chiffre des unités change.",
          bilan: "Sans passer la dizaine, seul le chiffre des unités change : 68 − 4 = 64."
        })
      },
      {
        n: 2, titre: "passage de la dizaine (et 50 − 6)", nom: "Retrancher un chiffre en passant la dizaine", palier: 1, type: "P",
        composer: a11Niveau2,
        imposes: [ligne("A11", 2, 70, -4), ligne("A11", 2, 734, -8)],
        apprends: plusApprends({
          manipule: ligne("A11", 0, 42, -8),
          represente: ligne("A11", 0, 523, -7),
          ecris: ligne("A11", 0, 50, -6),
          etapes: etapesDe(["10 − 6 = ?", 4], ["50 − 6 = ?", 44]),
          consigne: "Je recule jusqu’à la dizaine, puis je retire le reste.",
          bilan: "Pour passer la dizaine en reculant, je recule d’abord jusqu’à la dizaine, puis je retire le reste : 42 − 8 = 42 − 2 − 6 = 34."
        })
      },
      {
        n: 3, titre: "passage de la centaine", nom: "Retrancher un chiffre en passant la centaine", palier: 1, type: "P",
        composer: a11Niveau3,
        imposes: [ligne("A11", 3, 601, -4), ligne("A11", 3, 3005, -8)],
        apprends: plusApprends({
          manipule: null,
          represente: ligne("A11", 0, 403, -5),
          ecris: ligne("A11", 0, 1002, -7),
          etapes: etapesDe([`1${ESPACE_FINE}002 − 2 = ?`, 1000], [`1${ESPACE_FINE}000 − 5 = ?`, 995], [`1${ESPACE_FINE}002 − 7 = ?`, 995]),
          consigne: "Je recule jusqu’à la centaine, puis je retire le reste.",
          bilan: "Pour passer la centaine en reculant, je recule d’abord jusqu’à la centaine, puis je retire le reste : 403 − 5 = 403 − 3 − 2 = 398."
        })
      }
    ]
  };

  // ----------------------------- A3, A4, A7 : garder le premier nombre entier
  //
  // Modules lot 2 (31/10/2026). On garde le premier nombre entier et on
  // saute sur la droite : les dizaines d'un coup (+ 20), puis les unités,
  // en passant par la dizaine comme dans A10 et A11 (+ 3, + 5) : 47 + 28 =
  // 47 + 20 + 3 + 5 (décision du 30/10). A3 n'ajoute que des dizaines (des
  // centaines, des milliers) entières : quand on passe la centaine (le
  // millier), on s'y arrête en gardant ce qui est dessous : 746 + 80 =
  // 746 + 60 + 20 (choix du 31/10). Données : {n, d, m}, d signé, et
  // `sauts`, le chemin sur la droite.

  // L'unité des sauts d'A3 : 10, 100 ou 1 000.
  const rangDe = d => (Math.abs(d) < 100 ? 10 : Math.abs(d) < 1000 ? 100 : 1000);
  const NOMS_UNITE = Object.freeze({10: ["dizaine", "dizaines"], 100: ["centaine", "centaines"], 1000: ["millier", "milliers"]});
  const NOMS_RANG = Object.freeze({100: "la centaine", 1000: "le millier", 10000: "la dizaine de mille"});

  // Le chemin d'A3 : un saut, ou deux quand on passe la centaine (le
  // millier, la dizaine de mille). On s'arrête au rang du dessus en gardant
  // ce qui est sous le saut : 746 → 806 → 826 ; 715 → 705 → 685. En
  // reculant depuis là (705 − 30), un seul saut, comme 50 − 6.
  function sautsRang(n, d) {
    const u = rangDe(d);
    const g = 10 * u;
    if (!franchit(n, d, g)) return [d];
    const arret = (d > 0 ? Math.floor(n / g) + 1 : Math.floor(n / g)) * g + n % u;
    const premier = arret - n;
    return premier === 0 || premier === d ? [d] : [premier, d - premier];
  }

  // Le rang le plus haut qu'un saut d'A3 passe : 100 pour 746 + 80, 1 000
  // pour 1 030 − 50 (on dit « le millier n'a pas changé »), ou null.
  const rangPasse = (n, d) => [10000, 1000, 100].find(g => g > rangDe(d) && franchit(n, d, g)) || null;

  // Le chiffre d'un rang (746, 10 → 4).
  const chiffreDe = (n, u) => Math.floor(n / u) % 10;

  // Les dizaines d'un nombre à deux chiffres signé (− 27 → − 20).
  const dizainesDe = d => d - Math.sign(d) * (Math.abs(d) % 10);

  // Le chemin d'A4 et A7 : les dizaines d'un saut, puis les unités (deux
  // sauts quand elles passent la dizaine, un seul depuis une dizaine entière).
  function sautsDizainesUnites(n, d) {
    const dizaines = dizainesDe(d);
    return [dizaines, ...sautsDe(n + dizaines, d - dizaines).sauts];
  }

  function ligneChemin(module, niveau, n, d) {
    const sauts = Object.freeze(module === "A3" ? sautsRang(n, d) : sautsDizainesUnites(n, d));
    const m = n + d;
    const morceaux = d > 0 ? [n, "+", d, "=", TROU] : [n, "−", -d, "=", TROU];
    // « Le petit chiffre retiré du grand » (63 − 27 → 44 ; 715 − 30 → 725) :
    // la réponse fausse, pour l'exemple de la page prof.
    const extra = {};
    if (d < 0 && module === "A3") {
      const u = rangDe(d);
      const c = chiffreDe(n, u);
      const k = -d / u;
      if (c > 0 && k > c) extra.inverse = n + (k - 2 * c) * u;
    } else if (d < 0) {
      const x = n + dizainesDe(d);
      const u = x % 10;
      const v = -d % 10;
      if (u > 0 && v > u) extra.inverse = x - u + (v - u);
    }
    const calcul = fabriquer(module, niveau, d > 0 ? "somme" : "difference", morceaux, m, Object.assign({n, d, m, sauts}, extra));
    // A3 mêle les deux sens : la clé de « 86 − 10 » finit par « x », sans
    // quoi elle serait celle de « 86 + 10 » (comme « 13 = 6 + □ » au lot 1).
    return module === "A3" && d < 0 ? Object.freeze(Object.assign({}, calcul, {cle: `${calcul.cle}-x`})) : calcul;
  }

  // L'image, réponse montrée : les sauts, le saut direct dessous quand il y
  // en a plusieurs, l'arrivée en vert.
  function cheminImage(calcul, gras = 0) {
    const {n, d, sauts} = calcul.donnees;
    const image = {outil: "droite-sauts", depart: n, sauts: sauts.map(val => ({val})), acquis: [sauts.length], gras: sauts.length > 1 ? gras : 0};
    if (sauts.length > 1) image.direct = d;
    return image;
  }

  // L'outil du début de l'entraînement, et de « je représente » : les sauts
  // donnés, toutes les arrivées « ? » (le point du milieu caché, 31/10).
  function cheminAide(calcul) {
    const image = cheminImage(calcul);
    delete image.acquis;
    return Object.assign(image, {inconnues: image.sauts.map((_, i) => i + 1)});
  }

  const sautsTexte = sauts => sauts.map(s => `${signe(s)} ${formaterNombre(Math.abs(s))}`).join(", puis ");

  function cheminPhrase(calcul) {
    let x = calcul.donnees.n;
    const morceaux = calcul.donnees.sauts.map(s => {
      x += s;
      return `${signe(s)} ${formaterNombre(Math.abs(s))}, ça fait ${formaterNombre(x)}`;
    });
    return `Regarde : ${morceaux.join(" ; ")}.`;
  }

  // Le rekenrek (jusqu'à 100) : les dizaines, une rangée entière à la fois,
  // puis les unités (finir ou vider la rangée quand elles passent la
  // dizaine). La consigne d'un passage ne donne pas le découpage.
  function cheminPerles(calcul) {
    const {n, d, m, sauts} = calcul.donnees;
    if (Math.max(n, m) > 100) return null;
    const op = signe(d);
    const dizaines = sauts[0];
    const rangees = Math.abs(dizaines) / 10;
    const gestes = [...Array.from({length: rangees}, () => Math.sign(d) * 10), ...sauts.slice(1)];
    const x = n + dizaines;
    const unites = d - dizaines;
    const traces = [Object.freeze({apres: rangees, attente: `${n} ${op} ${Math.abs(dizaines)} = …`, texte: `${n} ${op} ${Math.abs(dizaines)} = ${x}`})];
    if (unites) {
      traces.push(Object.freeze({apres: gestes.length, attente: `${x} ${op} ${Math.abs(unites)} = …`, texte: `${x} ${op} ${Math.abs(unites)} = ${m}`}));
      traces.push(Object.freeze({apres: gestes.length, attente: `${n} ${op} ${Math.abs(d)} = …`, texte: `${n} ${op} ${Math.abs(d)} = ${m}`}));
    }
    const verbe = d > 0 ? "Pousse" : "Retire";
    const debut = rangees === 1 ? `${verbe} 10 perles d’un coup` : `${verbe} ${Math.abs(dizaines)} perles, 10 d’un coup`;
    let consigne = `${debut}.`;
    if (unites && sauts.length > 2) consigne = `${debut}, puis ${d > 0 ? "finis" : "vide"} la rangée et ${d > 0 ? "pousse" : "retire"} le reste.`;
    else if (unites) consigne = Math.abs(unites) > 1 ? `${debut}, puis ${Math.abs(unites)} perles d’un coup.` : `${debut}, puis 1 perle.`;
    return Object.freeze({
      outil: "perles", depart: n, texte: `${n} ${op} ${Math.abs(d)}`,
      gestes: Object.freeze(gestes), consigne, traces: Object.freeze(traces)
    });
  }

  // Les trois temps de J'apprends d'A3, A4, A7, comme A10 et A11 : les
  // perles (jusqu'à 100), la droite avec ses « ? », les étapes à remplir
  // (avec, au-dessus, une ligne qui dit ce que vaut le nombre : « 715,
  // c'est 71 dizaines et 5 unités »).
  function cheminApprends({manipule, represente, ecris, etapes, consigne, consigneEcris = null, bilan}) {
    const premier = manipule || represente;
    return Object.freeze({
      exemple: Object.freeze({texte: premier.texte.replace(` = ${CASE}`, ""), reponse: premier.reponse}),
      manipule: manipule ? cheminPerles(manipule) : null,
      represente: Object.freeze({
        outil: "droite-sauts", consigne,
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(cheminAide(represente)),
        solution: Object.freeze({image: cheminImage(represente), phrase: cheminPhrase(represente)})
      }),
      ecris: ecrisAvecDessins(Object.assign({
        etapes: Object.freeze(etapes.map(([texte, reponse]) => Object.freeze({texte: texte.replace("?", CASE), reponse}))),
        reponse: ecris.reponse,
        solution: Object.freeze({image: cheminImage(ecris), phrase: cheminPhrase(ecris)})
      }, consigneEcris ? {consigne: consigneEcris} : {}), cheminDessins(ecris, etapes.length)),
      bilan,
      image: Object.freeze(cheminImage(premier)),
      textes: Object.freeze([premier.texte, represente.texte, ecris.texte])
    });
  }

  // Le dessin de « J'écris » (lot « relier ») : la droite du calcul, un saut
  // par étape, puis le saut direct dessous. Quand le calcul a plus de sauts
  // que d'étapes (58 + 34 : + 30, + 2, + 2, mais 88 + 4 = 92 s'écrit en une
  // étape), la dernière étape avant le saut direct montre tous les sauts qui
  // restent.
  function cheminDessins(calcul, etapes) {
    const {n, d, sauts} = calcul.donnees;
    const direct = sauts.length > 1 ? d : undefined;
    const avant = etapes - (direct === undefined ? 0 : 1);
    const groupes = sauts.length > avant && avant > 0
      ? Array.from({length: avant}, (_, k) => (k < avant - 1 ? [k] : sauts.map((_, i) => i).slice(k)))
      : null;
    return droiteDessins({depart: n, sauts, direct, trou: false, etapes, groupes});
  }

  // Du plus simple au plus dur : un saut de plus, le passage de la centaine
  // (du millier), la taille des nombres.
  function cheminDifficulte(calcul) {
    const {n, d, m, sauts} = calcul.donnees;
    const passages = [100, 1000, 10000].filter(g => franchit(n, d, g)).length;
    return sauts.length * 400 + passages * 150 + String(Math.max(n, m)).length * 20 + (d < 0 ? 10 : 0) + (Math.abs(d) % 10) * 2 + (n % 10 === 0 ? 1 : 0);
  }

  // Le saut (à partir de 1) qui passe la centaine, pour le mettre en gras.
  function sautQuiPasse(calcul, g) {
    let x = calcul.donnees.n;
    const rang = calcul.donnees.sauts.findIndex(s => {
      const passe = Math.floor(x / g) !== Math.floor((x + s) / g);
      x += s;
      return passe;
    });
    return rang + 1;
  }

  // Les erreurs connues d'A4 et A7 (le même chemin, dans les deux sens).
  const CHEMIN_CAUSES = Object.freeze({
    unites: Object.freeze({
      nom: "les unités oubliées",
      test: (calcul, reponse) => memeNombre(reponse, calcul.donnees.n + dizainesDe(calcul.donnees.d)),
      retour: (calcul, reponse) => {
        const {n, d} = calcul.donnees;
        const dz = dizainesDe(d);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} ${signe(d)} ${Math.abs(dz)}. Il reste à ${d > 0 ? "ajouter" : "retirer"} ${Math.abs(d - dz)}.`;
      },
      gras: 2
    }),
    dizaines: Object.freeze({
      nom: "les dizaines oubliées",
      test: (calcul, reponse) => memeNombre(reponse, calcul.donnees.n + calcul.donnees.d - dizainesDe(calcul.donnees.d)),
      retour: (calcul, reponse) => {
        const {n, d} = calcul.donnees;
        const dz = dizainesDe(d);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} ${signe(d)} ${Math.abs(d - dz)}. Il faut d’abord ${d > 0 ? "ajouter" : "retirer"} les dizaines : ${formaterNombre(n)} ${signe(d)} ${Math.abs(dz)}.`;
      },
      gras: 1
    }),
    // 63 − 27 → 44 : 7 − 3 au lieu de passer la dizaine.
    inverse: Object.freeze({
      nom: "le petit chiffre retiré du grand",
      test: (calcul, reponse) => calcul.donnees.inverse !== undefined && memeNombre(reponse, calcul.donnees.inverse),
      retour: calcul => {
        const {n, d} = calcul.donnees;
        const x = n + dizainesDe(d);
        const u = x % 10;
        const v = Math.abs(d) % 10;
        return `Tu as fait ${v} − ${u}. Mais on retire ${v} : après − ${Math.abs(dizainesDe(d))}, recule jusqu’à ${formaterNombre(x - u)}, puis encore.`;
      },
      gras: 2
    }),
    dizaine: Object.freeze({
      nom: "la dizaine pas changée",
      test: (calcul, reponse) => {
        const {n, d, m} = calcul.donnees;
        const dz = dizainesDe(d);
        return franchit(n + dz, d - dz, 10) && memeNombre(reponse, m - 10 * Math.sign(d));
      },
      retour: (calcul, reponse) => {
        const {n, d, sauts} = calcul.donnees;
        const x = n + dizainesDe(d);
        if (sauts.length < 3) return `${formaterNombre(reponse)} : la dizaine n’a pas changé. En reculant depuis ${formaterNombre(x)}, on passe sous ${formaterNombre(x)}.`;
        const palier = x + sauts[1];
        return `${formaterNombre(reponse)} : la dizaine n’a pas changé. On passe ${formaterNombre(palier)} : ${formaterNombre(x)} ${signe(d)} ${Math.abs(sauts[1])} = ${formaterNombre(palier)}, puis ${signe(d)} ${Math.abs(sauts[2])}.`;
      },
      gras: 3
    }),
    centaine: Object.freeze({
      nom: "la centaine pas changée",
      test: (calcul, reponse) => franchit(calcul.donnees.n, calcul.donnees.d, 100) && memeNombre(reponse, calcul.donnees.m - 100 * Math.sign(calcul.donnees.d)),
      retour: (calcul, reponse) => `${formaterNombre(reponse)} : la centaine n’a pas changé. Pars de ${formaterNombre(calcul.donnees.n)} et fais les sauts : ${sautsTexte(calcul.donnees.sauts)}.`,
      gras: 0
    }),
    unPres: Object.freeze({
      nom: "à 1 près",
      test: (calcul, reponse) => Math.abs(reponse - calcul.reponse) === 1,
      retour: calcul => `C’est à 1 près. Pars de ${formaterNombre(calcul.donnees.n)} et fais les sauts sans compter le départ : ${sautsTexte(calcul.donnees.sauts)}.`,
      gras: 0
    })
  });
  const cheminCauses = liste => Object.freeze(liste.map(([c, nom]) => {
    const cause = Object.assign({c}, CHEMIN_CAUSES[nom]);
    // La centaine : le saut qui la passe, en gras.
    if (nom === "centaine") cause.grasDe = calcul => sautQuiPasse(calcul, 100);
    return Object.freeze(cause);
  }));
  const A4_ERREURS = cheminCauses([[1, "unites"], [2, "dizaines"], [3, "dizaine"], [4, "centaine"], [5, "unPres"]]);
  const A7_ERREURS = cheminCauses([[1, "inverse"], [2, "unites"], [3, "dizaines"], [4, "dizaine"], [5, "centaine"], [6, "unPres"]]);

  // Les erreurs connues d'A3 : le chiffre du rang retiré à l'envers (715 − 30
  // → 725), le mauvais rang (746 + 80 → 754), le rang du dessus pas changé
  // (746 + 80 → 726), une dizaine (une centaine…) de trop ou de moins.
  const A3_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "le petit chiffre retiré du grand",
      test: (calcul, reponse) => calcul.donnees.inverse !== undefined && memeNombre(reponse, calcul.donnees.inverse),
      retour: calcul => {
        const {n, d, sauts} = calcul.donnees;
        const u = rangDe(d);
        const k = Math.abs(d) / u;
        return `Tu as fait ${k} − ${chiffreDe(n, u)}. Mais on retire ${k} ${NOMS_UNITE[u][k > 1 ? 1 : 0]} : recule jusqu’à ${formaterNombre(n + sauts[0])}, puis encore.`;
      },
      gras: 1
    }),
    Object.freeze({
      c: 2, nom: "le mauvais rang",
      test: (calcul, reponse) => {
        const {n, d} = calcul.donnees;
        return memeNombre(reponse, n + d / 10) || memeNombre(reponse, n + d * 10);
      },
      retour: (calcul, reponse) => {
        const {n, d} = calcul.donnees;
        const u = rangDe(d);
        const k = Math.abs(d) / u;
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} ${signe(d)} ${formaterNombre(Math.abs(reponse - n))}. Ici, on ${d > 0 ? "ajoute" : "retire"} ${k} ${NOMS_UNITE[u][k > 1 ? 1 : 0]} : ${signe(d)} ${formaterNombre(Math.abs(d))}.`;
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "le rang du dessus pas changé",
      test: (calcul, reponse) => {
        const {n, d, m} = calcul.donnees;
        const g = rangPasse(n, d);
        return g !== null && memeNombre(reponse, m - g * Math.sign(d));
      },
      retour: (calcul, reponse) => {
        const {n, d, m, sauts} = calcul.donnees;
        const g = rangPasse(n, d);
        const passe = (d > 0 ? Math.floor(m / g) : Math.floor(n / g)) * g;
        const debut = `${formaterNombre(reponse)} : ${NOMS_RANG[g]} n’a pas changé.`;
        if (sauts.length > 1) return `${debut} On passe ${formaterNombre(passe)} : ${formaterNombre(n)} ${signe(d)} ${formaterNombre(Math.abs(sauts[0]))} = ${formaterNombre(n + sauts[0])}, puis ${signe(d)} ${formaterNombre(Math.abs(sauts[1]))}.`;
        return d > 0 ? `${debut} On passe ${formaterNombre(passe)}.` : `${debut} En reculant, on passe sous ${formaterNombre(passe)}.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 4, nom: "une dizaine de trop ou de moins",
      test: (calcul, reponse) => Math.abs(reponse - calcul.reponse) === rangDe(calcul.donnees.d),
      retour: calcul => {
        const {n, d, sauts} = calcul.donnees;
        const u = rangDe(d);
        return `C’est à ${u === 1000 ? "un" : "une"} ${NOMS_UNITE[u][0]} près. Pars de ${formaterNombre(n)} et fais les sauts : ${sautsTexte(sauts)}.`;
      },
      gras: 0
    })
  ]);

  // Un niveau tiré au hasard selon sa règle : `tirer(rng, rang)` rend
  // [n, d], ou null pour retirer. Jamais un résultat sous 11, ni égal à un
  // nombre que les phrases des erreurs citent (60 − 30 = 30 : « − 30 » ;
  // 1 200 − 700 = 500 : « − 200, puis − 500 » ; 360 + 40 = 400 :
  // « 760, c’est 360 + 400 »).
  function cheminNiveau(module, niveau, tirer) {
    return function composer(rng, total, imposes) {
      const pris = new Set(imposes.map(c => c.cle));
      const liste = [];
      let essais = 0;
      while (liste.length < Math.max(0, total - imposes.length) && essais < 20000) {
        essais += 1;
        const tire = tirer(rng, liste.length);
        if (!tire) continue;
        const [n, d] = tire;
        const m = n + d;
        if (m < 11 || [d, d * 10, d / 10, dizainesDe(d)].some(x => Math.abs(x) === m)) continue;
        const calcul = ligneChemin(module, niveau, n, d);
        if (pris.has(calcul.cle) || calcul.donnees.sauts.some(saut => Math.abs(saut) === m)) continue;
        pris.add(calcul.cle);
        liste.push(calcul);
      }
      return [...liste, ...imposes];
    };
  }

  // A3-1 : sans passage. 3 calculs sur 10 sur un nombre à deux chiffres
  // (76 − 30 : les perles), 4 avec des dizaines sur trois chiffres
  // (234 + 60), 3 avec des centaines (765 − 200) ; un sur deux en retirant.
  // Arriver juste sur la centaine (340 + 60 = 400) est sans passage.
  const a3Niveau1 = cheminNiveau("A3", 1, (rng, rang) => {
    const sorte = rang % 10 < 3 ? 0 : rang % 10 < 7 ? 1 : 2;
    const n = sorte === 0 ? entierEntre(rng, 11, 99) : entierEntre(rng, 101, 999);
    const d = (rang % 2 ? -1 : 1) * entierEntre(rng, 1, 9) * (sorte === 2 ? 100 : 10);
    return franchit(n, d, 10 * rangDe(d)) ? null : [n, d];
  });
  // A3-2 : des dizaines en passant la centaine, sous 1 000 (746 + 80,
  // 715 − 30, 792 + 10). Un sur cinq part d'un nombre à deux chiffres
  // (76 + 50), un sur cinq recule depuis le début de la centaine (705 − 30).
  const a3Niveau2 = cheminNiveau("A3", 2, (rng, rang) => {
    const k = entierEntre(rng, 1, 9);
    let n = entierEntre(rng, 101, 999);
    let d = (rang % 2 ? -10 : 10) * k;
    if (rang % 5 === 1) { n = entierEntre(rng, 11, 99); d = 10 * k; }
    if (rang % 5 === 3) { n = entierEntre(rng, 1, 9) * 100 + entierEntre(rng, 0, 9); d = -10 * k; }
    return franchit(n, d, 100) && !franchit(n, d, 1000) && n + d < 1000 ? [n, d] : null;
  });
  // A3-3 : passer le millier, avec des dizaines (950 + 70, 1 030 − 50) ou
  // des centaines (2 800 + 400, 1 200 − 400), sur des nombres ronds.
  const a3Niveau3 = cheminNiveau("A3", 3, (rng, rang) => {
    const u = rang % 2 ? 100 : 10;
    const s = Math.floor(rang / 2) % 2 ? -1 : 1;
    const millier = entierEntre(rng, 1, 9) * 1000;
    const n = millier - s * u * entierEntre(rng, 1, 9);
    const d = s * u * entierEntre(rng, 1, 9);
    return franchit(n, d, 1000) && n + d < 10000 ? [n, d] : null;
  });
  // A3-4 : les grands nombres, à 4 ou 5 chiffres. La moitié ajoute ou
  // retire des milliers (21 462 + 3 000 ; 47 530 + 6 000, en passant la
  // dizaine de mille) ; l'autre moitié des centaines ou des dizaines, sans
  // passage (1 462 + 300 ; 6 780 − 50). Un sur trois en retirant.
  const a3Niveau4 = cheminNiveau("A3", 4, (rng, rang) => {
    const u = rang % 2 === 0 ? 1000 : rang % 4 === 1 ? 100 : 10;
    const n = entierEntre(rng, 1001, 99999);
    const d = (rang % 3 === 2 ? -1 : 1) * u * entierEntre(rng, 1, 9);
    const m = n + d;
    if (m < 1000 || m >= 100000) return null;
    return u < 1000 && franchit(n, d, 10 * u) ? null : [n, d];
  });

  const deuxChiffres = rng => 10 * entierEntre(rng, 1, 9) + entierEntre(rng, 1, 9);
  // A4-1 : deux chiffres + deux chiffres sans passer la dizaine, sous 100
  // (42 + 35 ; 42 + 38 = 80 compris).
  const a4Niveau1 = cheminNiveau("A4", 1, rng => {
    const n = entierEntre(rng, 11, 89);
    const a = deuxChiffres(rng);
    return n % 10 + a % 10 <= 10 && n + a <= 99 ? [n, a] : null;
  });
  // A4-2 : en passant la dizaine, sous 100 (47 + 28 ; 36 + 47).
  const a4Niveau2 = cheminNiveau("A4", 2, rng => {
    const n = entierEntre(rng, 11, 89);
    const a = deuxChiffres(rng);
    return n % 10 + a % 10 >= 11 && n + a <= 99 ? [n, a] : null;
  });
  // A4-3 : le résultat passe 100 (78 + 45 ; 96 + 37 ; 64 + 52).
  const a4Niveau3 = cheminNiveau("A4", 3, rng => {
    const n = entierEntre(rng, 11, 99);
    const a = deuxChiffres(rng);
    return n + a >= 101 ? [n, a] : null;
  });
  // A4-4 : trois chiffres + deux chiffres (168 + 18 ; 275 + 46).
  const a4Niveau4 = cheminNiveau("A4", 4, rng => {
    const n = entierEntre(rng, 101, 899);
    const a = deuxChiffres(rng);
    return n + a <= 999 ? [n, a] : null;
  });

  // A7-1 : sans passer la dizaine (78 − 35 ; 576 − 34), un sur deux à trois
  // chiffres, sans passer la centaine (78 − 38 = 40 compris).
  const a7Niveau1 = cheminNiveau("A7", 1, (rng, rang) => {
    const n = rang % 2 ? entierEntre(rng, 101, 999) : entierEntre(rng, 21, 99);
    const a = deuxChiffres(rng);
    return n % 10 >= a % 10 && !franchit(n, -a, 100) ? [n, -a] : null;
  });
  // A7-2 : en passant la dizaine (63 − 27 ; 82 − 47 ; 543 − 27), sans
  // passer la centaine ; un sur cinq depuis une dizaine entière (60 − 27),
  // un sur trois à trois chiffres.
  const a7Niveau2 = cheminNiveau("A7", 2, (rng, rang) => {
    let n = rang % 3 === 2 ? entierEntre(rng, 101, 999) : entierEntre(rng, 21, 99);
    if (rang % 5 === 4) n -= n % 10;
    const a = deuxChiffres(rng);
    return n % 10 < a % 10 && !franchit(n, -a, 100) ? [n, -a] : null;
  });
  // A7-3 : en passant la centaine (523 − 67 ; 412 − 35).
  const a7Niveau3 = cheminNiveau("A7", 3, rng => {
    const n = entierEntre(rng, 101, 999);
    const a = deuxChiffres(rng);
    return franchit(n, -a, 100) ? [n, -a] : null;
  });

  const chemin = (module, n, d) => ligneChemin(module, 0, n, d);
  const commun = {famille: "A", construit: true, aide_entraine: "droite-sauts", image: cheminImage, aide: cheminAide, manipulation: cheminPerles, difficulte: cheminDifficulte};

  const A3 = Object.assign({
    id: "A3", nom: "Ajouter, retrancher des dizaines, des centaines entières", exemple: "76 − 30",
    erreurs: A3_ERREURS,
    niveaux: [
      {
        n: 1, titre: "sans passage", nom: "Dizaines, centaines entières sans passage", palier: 1, type: "P",
        composer: a3Niveau1,
        imposes: [ligneChemin("A3", 1, 541, -20), ligneChemin("A3", 1, 765, -200)],
        apprends: cheminApprends({
          manipule: chemin("A3", 76, -30),
          represente: chemin("A3", 354, 500),
          ecris: chemin("A3", 234, 60),
          etapes: [["3 + 6 = ?", 9], ["234 + 60 = ?", 294]],
          consigneEcris: "Dans 234, le chiffre des dizaines est 3.",
          consigne: "J’avance de 5 centaines : seul le chiffre des centaines change.",
          bilan: "Quand j’ajoute ou que je retire des dizaines, seul le chiffre des dizaines change : 76 − 30 = 46."
        })
      },
      {
        n: 2, titre: "passage de la centaine", nom: "Dizaines entières en passant la centaine", palier: 1, type: "P",
        composer: a3Niveau2,
        imposes: [ligneChemin("A3", 2, 792, 10), ligneChemin("A3", 2, 534, -70)],
        apprends: cheminApprends({
          manipule: null,
          represente: chemin("A3", 746, 80),
          ecris: chemin("A3", 715, -30),
          etapes: [["715 − 10 = ?", 705], ["705 − 20 = ?", 685], ["715 − 30 = ?", 685]],
          consigneEcris: "715, c’est 71 dizaines et 5 unités.",
          consigne: "Je complète la centaine avec des dizaines, puis j’ajoute le reste.",
          bilan: "Pour passer la centaine, je la complète avec des dizaines, puis j’ajoute le reste : 746 + 80 = 746 + 60 + 20 = 826."
        })
      },
      {
        n: 3, titre: "passage du millier", nom: "Dizaines, centaines en passant le millier", palier: 2, type: "P",
        composer: a3Niveau3,
        imposes: [ligneChemin("A3", 3, 1030, -50), ligneChemin("A3", 3, 2800, 400)],
        apprends: cheminApprends({
          manipule: null,
          represente: chemin("A3", 950, 70),
          ecris: chemin("A3", 1200, -400),
          etapes: [[`1${ESPACE_FINE}200 − 200 = ?`, 1000], [`1${ESPACE_FINE}000 − 200 = ?`, 800], [`1${ESPACE_FINE}200 − 400 = ?`, 800]],
          consigneEcris: `1${ESPACE_FINE}200, c’est 12 centaines.`,
          consigne: "Je vais au millier, puis j’ajoute le reste.",
          bilan: `Pour passer le millier, je vais d’abord au millier, puis j’ajoute le reste : 950 + 70 = 950 + 50 + 20 = 1${ESPACE_FINE}020.`
        })
      },
      {
        n: 4, titre: "milliers dans les grands nombres", nom: "Milliers dans les grands nombres", palier: 3, type: "P",
        composer: a3Niveau4,
        imposes: [ligneChemin("A3", 4, 1462, 300), ligneChemin("A3", 4, 6780, -50)],
        apprends: cheminApprends({
          manipule: null,
          represente: chemin("A3", 47530, 6000),
          ecris: chemin("A3", 21462, 3000),
          etapes: [["1 + 3 = ?", 4], [`21${ESPACE_FINE}462 + 3${ESPACE_FINE}000 = ?`, 24462]],
          consigneEcris: `Dans 21${ESPACE_FINE}462, le chiffre des milliers est 1.`,
          consigne: "Je vais à la dizaine de mille, puis j’ajoute le reste.",
          bilan: `Dans un grand nombre, je repère le chiffre qui change : 47${ESPACE_FINE}530 + 6${ESPACE_FINE}000 = 47${ESPACE_FINE}530 + 3${ESPACE_FINE}000 + 3${ESPACE_FINE}000 = 53${ESPACE_FINE}530.`
        })
      }
    ]
  }, commun);

  const A4 = Object.assign({
    id: "A4", nom: "Additionner deux nombres", exemple: "42 + 35",
    erreurs: A4_ERREURS,
    niveaux: [
      {
        n: 1, titre: "deux chiffres, sans retenue", nom: "Additionner sans passer la dizaine", palier: 1, type: "P",
        composer: a4Niveau1,
        imposes: [ligneChemin("A4", 1, 53, 24), ligneChemin("A4", 1, 26, 42)],
        apprends: cheminApprends({
          manipule: chemin("A4", 42, 35),
          represente: chemin("A4", 51, 27),
          ecris: chemin("A4", 61, 28),
          etapes: [["61 + 20 = ?", 81], ["81 + 8 = ?", 89], ["61 + 28 = ?", 89]],
          consigne: "Je garde 51 : j’ajoute les dizaines, puis les unités.",
          bilan: "J’ajoute les dizaines, puis les unités : 42 + 35 = 42 + 30 + 5 = 77."
        })
      },
      {
        n: 2, titre: "deux chiffres, avec retenue", nom: "Additionner en passant la dizaine", palier: 1, type: "P",
        composer: a4Niveau2,
        imposes: [ligneChemin("A4", 2, 36, 47), ligneChemin("A4", 2, 28, 56)],
        apprends: cheminApprends({
          manipule: chemin("A4", 47, 28),
          represente: chemin("A4", 36, 57),
          ecris: chemin("A4", 58, 34),
          etapes: [["58 + 30 = ?", 88], ["88 + 4 = ?", 92], ["58 + 34 = ?", 92]],
          consigne: "Je garde 36 : j’ajoute les dizaines, puis je passe la dizaine.",
          bilan: "J’ajoute les dizaines, puis les unités en passant par la dizaine : 47 + 28 = 47 + 20 + 3 + 5 = 75."
        })
      },
      {
        n: 3, titre: "résultat qui passe 100", nom: "Additionner au-delà de 100", palier: 1, type: "P",
        composer: a4Niveau3,
        imposes: [ligneChemin("A4", 3, 96, 37), ligneChemin("A4", 3, 64, 52)],
        apprends: cheminApprends({
          manipule: null,
          represente: chemin("A4", 78, 45),
          ecris: chemin("A4", 87, 36),
          etapes: [["87 + 30 = ?", 117], ["117 + 6 = ?", 123], ["87 + 36 = ?", 123]],
          consigne: "Je garde 78 : j’ajoute les dizaines, puis les unités.",
          bilan: "J’ajoute les dizaines, puis les unités, même au-delà de 100 : 78 + 45 = 78 + 40 + 5 = 123."
        })
      },
      {
        n: 4, titre: "trois chiffres + deux chiffres", nom: "Trois chiffres + deux chiffres", palier: 2, type: "P",
        composer: a4Niveau4,
        imposes: [ligneChemin("A4", 4, 168, 18), ligneChemin("A4", 4, 482, 35)],
        apprends: cheminApprends({
          manipule: null,
          represente: chemin("A4", 275, 46),
          ecris: chemin("A4", 347, 28),
          etapes: [["347 + 20 = ?", 367], ["367 + 8 = ?", 375], ["347 + 28 = ?", 375]],
          consigne: "Je garde 275 : j’ajoute les dizaines, puis les unités.",
          bilan: "Avec trois chiffres aussi, j’ajoute les dizaines, puis les unités : 275 + 46 = 275 + 40 + 6 = 321."
        })
      }
    ]
  }, commun);

  const A7 = Object.assign({
    id: "A7", nom: "Soustraire un nombre à deux chiffres", exemple: "78 − 35",
    erreurs: A7_ERREURS,
    niveaux: [
      {
        n: 1, titre: "sans retenue", nom: "Soustraire sans passer la dizaine", palier: 1, type: "P",
        composer: a7Niveau1,
        imposes: [ligneChemin("A7", 1, 576, -34), ligneChemin("A7", 1, 95, -42)],
        apprends: cheminApprends({
          manipule: chemin("A7", 78, -35),
          represente: chemin("A7", 486, -53),
          ecris: chemin("A7", 89, -46),
          etapes: [["89 − 40 = ?", 49], ["49 − 6 = ?", 43], ["89 − 46 = ?", 43]],
          consigne: "Je garde 486 : je retire les dizaines, puis les unités.",
          bilan: "Je retire les dizaines, puis les unités : 78 − 35 = 78 − 30 − 5 = 43."
        })
      },
      {
        n: 2, titre: "avec passage de la dizaine", nom: "Soustraire en passant la dizaine", palier: 1, type: "P",
        composer: a7Niveau2,
        imposes: [ligneChemin("A7", 2, 82, -47), ligneChemin("A7", 2, 70, -24)],
        apprends: cheminApprends({
          manipule: chemin("A7", 63, -27),
          represente: chemin("A7", 81, -46),
          ecris: chemin("A7", 74, -38),
          etapes: [["74 − 30 = ?", 44], ["44 − 8 = ?", 36], ["74 − 38 = ?", 36]],
          consigne: "Je garde 81 : je retire les dizaines, puis je passe la dizaine.",
          bilan: "Je retire les dizaines, puis les unités en passant par la dizaine : 63 − 27 = 63 − 20 − 3 − 4 = 36."
        })
      },
      {
        n: 3, titre: "passage de la centaine", nom: "Soustraire en passant la centaine", palier: 2, type: "P",
        composer: a7Niveau3,
        imposes: [ligneChemin("A7", 3, 412, -35), ligneChemin("A7", 3, 704, -28)],
        apprends: cheminApprends({
          manipule: null,
          represente: chemin("A7", 523, -67),
          ecris: chemin("A7", 615, -38),
          etapes: [["615 − 30 = ?", 585], ["585 − 8 = ?", 577], ["615 − 38 = ?", 577]],
          consigne: "Je garde 523 : je retire les dizaines, puis les unités.",
          bilan: "Je retire les dizaines, puis les unités, même en passant la centaine : 523 − 67 = 523 − 60 − 7 = 456."
        })
      }
    ]
  }, commun);

  // -------------------------------------------- A6 : retrancher 9, 19, 29… et 8, 18, 28…
  //
  // Modules lot 2 (31/10/2026). Le miroir d'A5 (remarque du 30/10) : − 9,
  // c'est − 10 puis + 1. La même droite (le grand recul, le petit retour,
  // le saut direct dessous), les mêmes perles (des rangées entières d'un
  // coup, puis on remet), les mêmes erreurs à l'envers. Jamais de résultat
  // négatif.

  function a6Difference(niveau, n, a) {
    return fabriquer("A6", niveau, "difference", [n, "−", a, "=", TROU], n - a, {n, a});
  }

  const a6Passage = calcul => franchit(calcul.donnees.n, -calcul.donnees.a, 100);

  function a6Niveau(niveau, retraits) {
    return function composer(rng, total, imposes) {
      const pris = new Set(imposes.map(c => c.cle));
      const liste = [];
      let essais = 0;
      while (liste.length < Math.max(0, total - imposes.length) && essais < 20000) {
        essais += 1;
        const rang = liste.length;
        const a = choisir(rng, retraits);
        // − 9 : 2 passages de la centaine sur 10 (105 − 9) ; − 99 : le
        // millier une fois sur cinq (1 040 − 99).
        let n = entierEntre(rng, a + 11, 999);
        if (niveau === 1 && rang % 5 === 2) n = entierEntre(rng, 1, 9) * 100 + entierEntre(rng, 1, 8);
        if (niveau === 4 && rang % 5 === 4) n = 1000 + entierEntre(rng, 0, a - 1);
        // Le résultat n'est jamais un nombre de la phrase (59 − 29 = 30,
        // 36 − 18 = 18).
        if (n - a < 11 || n - a === a5Arrondi(a) || n - a === a) continue;
        const calcul = a6Difference(niveau, n, a);
        if (pris.has(calcul.cle)) continue;
        pris.add(calcul.cle);
        liste.push(calcul);
      }
      return [...liste, ...imposes];
    };
  }

  function a6Image(calcul, gras = 0) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    return {outil: "droite-sauts", depart: n, sauts: [{val: -r}, {val: r - a}], direct: -a, acquis: [2], gras};
  }

  function a6Aide(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    return {outil: "droite-sauts", depart: n, sauts: [{val: -r}, {val: r - a}], direct: -a, inconnues: [1, 2]};
  }

  function a6Difficulte(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    return a * 10 + (r - a) * 100 + (a6Passage(calcul) ? 400 : 0) + String(n).length * 30 + (n % 10 ? 0 : 20);
  }

  // Le rekenrek (jusqu'à 100) : des rangées entières retirées d'un coup,
  // puis on remet.
  function a6Perles(calcul) {
    const {n, a} = calcul.donnees;
    if (n > 100) return null;
    const r = a5Arrondi(a);
    const d = r - a;
    const rangees = r / 10;
    return Object.freeze({
      outil: "perles", depart: n, texte: `${n} − ${a}`,
      gestes: Object.freeze([...Array.from({length: rangees}, () => -10), d]),
      consigne: rangees === 1
        ? `Retire 10 perles d’un coup, puis remets-en ${d}.`
        : `Retire ${r} perles, 10 d’un coup, puis remets-en ${d}${d > 1 ? " d’un coup" : ""}.`,
      traces: Object.freeze([
        Object.freeze({apres: rangees, attente: `${n} − ${r} = …`, texte: `${n} − ${r} = ${n - r}`}),
        Object.freeze({apres: rangees + 1, attente: `${n - r} + ${d} = …`, texte: `${n - r} + ${d} = ${n - a}`})
      ])
    });
  }

  function a6Etapes(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    const etape = (texte, reponse) => Object.freeze({texte, reponse});
    return Object.freeze([
      etape(`${formaterNombre(n)} − ${r} = ${CASE}`, n - r),
      etape(`${formaterNombre(n - r)} + ${r - a} = ${CASE}`, n - a),
      etape(`${formaterNombre(n)} − ${a} = ${CASE}`, n - a)
    ]);
  }

  function a6Phrase(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    return `Regarde : − ${r}, ça fait ${formaterNombre(n - r)} ; + ${r - a}, ça fait ${formaterNombre(n - a)}.`;
  }

  const A6_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "retour oublié",
      test: (calcul, reponse) => memeNombre(reponse, calcul.donnees.n - a5Arrondi(calcul.donnees.a)),
      retour: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} − ${r}. Il reste à remettre ${r - a}.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 2, nom: "retour dans le mauvais sens",
      test: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return memeNombre(reponse, n - r - (r - a));
      },
      retour: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} − ${r} − ${r - a}. Après − ${r}, il faut remettre ${r - a}, pas l’enlever.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 3, nom: "dizaines oubliées",
      test: (calcul, reponse) => calcul.donnees.a >= 18 && memeNombre(reponse, calcul.donnees.n - calcul.donnees.a % 10),
      retour: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} − ${a % 10}. − ${a}, c’est − ${r} puis + ${r - a}.`;
      },
      gras: 1
    }),
    Object.freeze({
      c: 4, nom: "retour de 1 au lieu de 2",
      test: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return r - a === 2 && memeNombre(reponse, n - r + 1);
      },
      retour: (calcul, reponse) => {
        const {n, a} = calcul.donnees;
        const r = a5Arrondi(a);
        return `${formaterNombre(reponse)}, c’est ${formaterNombre(n)} − ${r} + 1. Pour − ${a}, c’est − ${r} puis + 2.`;
      },
      gras: 2
    })
  ]);

  // Les trois temps d'un niveau d'A6, comme A5, sur trois calculs
  // différents : les perles (jusqu'à 100), la droite avec le détour, les
  // étapes.
  function a6Apprends(nM, nR, nE, a, bilan) {
    const r = a5Arrondi(a);
    const d = r - a;
    const cM = a6Difference(0, nM, a);
    const cR = a6Difference(0, nR, a);
    const cE = a6Difference(0, nE, a);
    const manipule = a6Perles(cM);
    const premier = manipule ? cM : cR;
    return Object.freeze({
      exemple: Object.freeze({texte: `${premier.donnees.n} − ${a}`, reponse: premier.reponse}),
      manipule,
      represente: Object.freeze({
        outil: "droite-sauts",
        consigne: `− ${a}, c’est − ${r} puis + ${d}.`,
        texte: cR.texte, reponse: cR.reponse,
        image: Object.freeze(a6Aide(cR)),
        solution: Object.freeze({image: a6Image(cR), phrase: a6Phrase(cR)})
      }),
      ecris: ecrisAvecDessins({
        etapes: a6Etapes(cE), reponse: cE.reponse,
        solution: Object.freeze({image: a6Image(cE), phrase: a6Phrase(cE)})
      }, droiteDessins({depart: cE.donnees.n, sauts: [-r, d], direct: -a, trou: false, etapes: a6Etapes(cE).length})),
      bilan,
      image: Object.freeze({outil: "droite-sauts", depart: premier.donnees.n, sauts: [{val: -r}, {val: d}], direct: -a, acquis: [2]}),
      textes: Object.freeze([premier.texte, cR.texte, cE.texte])
    });
  }

  const A6 = {
    id: "A6", nom: "Retrancher 9, 19, 29… et 8, 18, 28…", exemple: "63 − 9",
    famille: "A", construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A6_ERREURS, image: a6Image, aide: a6Aide, manipulation: a6Perles, difficulte: a6Difficulte,
    niveaux: [
      {
        n: 1, titre: "− 9", palier: 1, type: "P",
        composer: a6Niveau(1, [9]),
        imposes: [a6Difference(1, 105, 9), a6Difference(1, 31, 9)],
        apprends: a6Apprends(63, 85, 142, 9, "− 9, c’est − 10 puis + 1 : 63 − 9 = 63 − 10 + 1 = 54.")
      },
      {
        n: 2, titre: "− 19, 29, 39", palier: 1, type: "P",
        composer: a6Niveau(2, [19, 29, 39]),
        imposes: [a6Difference(2, 143, 29), a6Difference(2, 86, 39)],
        apprends: a6Apprends(72, 154, 86, 29, "Pour retrancher 29, je retranche 30, puis j’ajoute 1 : 72 − 29 = 72 − 30 + 1 = 43.")
      },
      {
        n: 3, titre: "− 8, 18, 28, 38", palier: 2, type: "P",
        composer: a6Niveau(3, [8, 18, 28, 38]),
        imposes: [a6Difference(3, 71, 18), a6Difference(3, 250, 38)],
        apprends: a6Apprends(73, 145, 92, 18, "Pour retrancher 18, je retranche 20, puis j’ajoute 2 : 73 − 18 = 73 − 20 + 2 = 55.")
      },
      {
        n: 4, titre: "− 48, 49… 98, 99", palier: 3, type: "P",
        composer: a6Niveau(4, [48, 49, 58, 59, 68, 69, 78, 79, 88, 89, 98, 99]),
        imposes: [a6Difference(4, 210, 98), a6Difference(4, 1040, 99)],
        apprends: a6Apprends(250, 432, 710, 99, "Pour retrancher 99, je retranche 100, puis j’ajoute 1 : 432 − 99 = 432 − 100 + 1 = 333.")
      }
    ]
  };

  // ---------------------------------- A8 : soustraire par l'écart (nombres proches)
  //
  // Modules lot 2 (31/10/2026). Quand les deux nombres sont proches, la
  // droite ne recule pas : elle avance du petit au grand, comme les
  // compléments d'A2 (73 − 68 : 68 → 70 → 73, + 2 puis + 3). La soustraction
  // se lit comme un écart. Consigne choisie le 31/10 : « Les nombres sont
  // proches : je pars de 68 et j'avance jusqu'à 73. » Données : {n, d, m}
  // comme un trou de A1 (n le petit nombre, m le grand, d l'écart).

  function ligneEcart(niveau, forme, petit, grand) {
    const e = grand - petit;
    // `chiffres` : la réponse fausse « chiffre par chiffre » (73 − 68 → 15).
    const donnees = {n: petit, d: e, m: grand, chiffres: chiffreParChiffre(grand, petit)};
    if (forme === "ecart") return fabriquer("A8", niveau, forme, [grand, "−", petit, "=", TROU], e, donnees);
    return fabriquer("A8", niveau, forme, [grand, "−", TROU, "=", petit], e, donnees);
  }

  // « 15 » pour 73 − 68 : chaque chiffre, le petit retiré du grand.
  function chiffreParChiffre(grand, petit) {
    let resultat = 0;
    for (let a = grand, b = petit, p = 1; a > 0 || b > 0; a = Math.floor(a / 10), b = Math.floor(b / 10), p *= 10) resultat += Math.abs(a % 10 - b % 10) * p;
    return resultat;
  }

  const A8_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "chiffre par chiffre",
      test: (calcul, reponse) => memeNombre(reponse, calcul.donnees.chiffres),
      retour: (calcul, reponse) => {
        const {n, m} = calcul.donnees;
        return `${formaterNombre(reponse)} : tu as retiré chiffre par chiffre, le petit du grand. Les nombres sont proches : pars de ${formaterNombre(n)} et avance jusqu’à ${formaterNombre(m)}.`;
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "arrêté à la dizaine",
      test: (calcul, reponse) => {
        const {palier, sauts} = sautsDuCalcul(calcul);
        return palier !== null && memeNombre(reponse, sauts[0]);
      },
      retour: (calcul, reponse) => {
        const {palier} = sautsDuCalcul(calcul);
        return `${formaterNombre(reponse)}, c’est de ${formaterNombre(calcul.donnees.n)} à ${formaterNombre(palier)}. Continue jusqu’à ${formaterNombre(calcul.donnees.m)}.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 3, nom: "parti de la dizaine",
      test: (calcul, reponse) => {
        const {palier, sauts} = sautsDuCalcul(calcul);
        return palier !== null && memeNombre(reponse, sauts[1]);
      },
      retour: (calcul, reponse) => {
        const {palier} = sautsDuCalcul(calcul);
        return `${formaterNombre(reponse)}, c’est de ${formaterNombre(palier)} à ${formaterNombre(calcul.donnees.m)}. Il faut partir de ${formaterNombre(calcul.donnees.n)}.`;
      },
      gras: 1
    }),
    Object.freeze(Object.assign({c: 4}, PLUS_CAUSES.ajoute)),
    Object.freeze(Object.assign({c: 5}, PLUS_CAUSES.unPres))
  ]);

  // Du plus simple au plus dur : l'écriture (« 4 000 − □ = 3 999 » à la
  // fin), l'écart, la taille.
  function a8Difficulte(calcul) {
    const {d, m} = calcul.donnees;
    return (calcul.forme === "ecart-trou" ? 2000 : 0) + d * 20 + String(m).length * 5;
  }

  // Le rekenrek (jusqu'à 100) : on part du petit nombre, on finit la
  // rangée d'un coup, puis on pousse jusqu'au grand.
  function a8Perles(calcul) {
    const perles = plusPerles(calcul);
    if (!perles) return null;
    const {n, d, m} = calcul.donnees;
    const traces = perles.traces.slice(0, -1).concat(Object.freeze({apres: perles.gestes.length, attente: `${m} − ${n} = …`, texte: `${m} − ${n} = ${d}`}));
    return Object.freeze(Object.assign({}, perles, {
      texte: `${m} − ${n}`,
      consigne: `Pars de ${n} : finis la rangée d’un coup, puis pousse jusqu’à ${m}.`,
      traces: Object.freeze(traces)
    }));
  }

  // Un niveau d'A8 : `tirer(rng, rang)` rend [petit, grand, forme] ou null.
  function a8Niveau(niveau, tirer) {
    return function composer(rng, total, imposes) {
      const pris = new Set(imposes.map(c => c.cle));
      const liste = [];
      let essais = 0;
      while (liste.length < Math.max(0, total - imposes.length) && essais < 20000) {
        essais += 1;
        const tire = tirer(rng, liste.length);
        if (!tire) continue;
        const calcul = ligneEcart(niveau, tire[2], tire[0], tire[1]);
        if (pris.has(calcul.cle)) continue;
        pris.add(calcul.cle);
        liste.push(calcul);
      }
      return [...liste, ...imposes];
    };
  }

  // A8-1 : deux nombres à deux chiffres, de part et d'autre d'une dizaine,
  // à moins de 10 l'un de l'autre (73 − 68 ; 52 − 47).
  const a8Niveau1 = a8Niveau(1, rng => {
    const petit = entierEntre(rng, 11, 88);
    const grand = petit + entierEntre(rng, 2, 9);
    return grand <= 99 && grand % 10 !== 0 && Math.floor(grand / 10) !== Math.floor(petit / 10) ? [petit, grand, "ecart"] : null;
  });
  // A8-2 : de part et d'autre d'une centaine (402 − 397 ; 103 − 97).
  const a8Niveau2 = a8Niveau(2, rng => {
    const centaine = entierEntre(rng, 1, 9) * 100;
    const petit = centaine - entierEntre(rng, 1, 9);
    const grand = petit + entierEntre(rng, 2, 9);
    return grand > centaine && grand < 1000 ? [petit, grand, "ecart"] : null;
  });
  // A8-3 : de part et d'autre d'un millier (1 003 − 996), et une fois sur
  // trois « 4 000 − □ = 3 999 » (exemple officiel de CM1).
  const a8Niveau3 = a8Niveau(3, (rng, rang) => {
    const millier = entierEntre(rng, 1, 9) * 1000;
    const petit = millier - entierEntre(rng, 1, 9);
    const grand = millier + entierEntre(rng, 0, 9);
    return grand - petit <= 12 ? [petit, grand, rang % 3 === 2 ? "ecart-trou" : "ecart"] : null;
  });

  // Les trois temps d'un niveau d'A8 : les perles (jusqu'à 100), la droite
  // qui avance du petit au grand (les sauts « + ? »), les étapes.
  function a8Apprends({manipule, represente, ecris, etapes, bilan}) {
    const premier = manipule || represente;
    const {n, m} = represente.donnees;
    return Object.freeze({
      exemple: Object.freeze({texte: `${formaterNombre(premier.donnees.m)} − ${formaterNombre(premier.donnees.n)}`, reponse: premier.reponse}),
      manipule: manipule ? a8Perles(manipule) : null,
      represente: Object.freeze({
        outil: "droite-sauts",
        consigne: `Les nombres sont proches : je pars de ${formaterNombre(n)} et j’avance jusqu’à ${formaterNombre(m)}.`,
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(plusAide(represente)),
        solution: Object.freeze({image: plusImage(represente), phrase: plusPhrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        etapes: Object.freeze(etapes.map(([texte, reponse]) => Object.freeze({texte: texte.replace("?", CASE), reponse}))),
        reponse: ecris.reponse,
        solution: Object.freeze({image: plusImage(ecris), phrase: plusPhrase(ecris)})
      }, plusDessins(ecris, etapes.length)),
      bilan,
      image: Object.freeze(plusImage(premier)),
      textes: Object.freeze([premier.texte, represente.texte, ecris.texte])
    });
  }

  const ecart = (petit, grand, forme = "ecart") => ligneEcart(0, forme, petit, grand);

  const A8 = {
    id: "A8", nom: "Soustraire par l’écart (nombres proches)", exemple: "73 − 68",
    famille: "A", construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A8_ERREURS, image: plusImage, aide: plusAide, manipulation: a8Perles, difficulte: a8Difficulte,
    niveaux: [
      {
        n: 1, titre: "deux chiffres proches", nom: "Écart entre deux nombres proches", palier: 1, type: "P",
        composer: a8Niveau1,
        imposes: [ligneEcart(1, "ecart", 86, 91), ligneEcart(1, "ecart", 57, 63)],
        apprends: a8Apprends({
          manipule: ecart(68, 73),
          represente: ecart(47, 52),
          ecris: ecart(76, 81),
          etapes: [["76 + ? = 80", 4], ["80 + ? = 81", 1], ["81 − 76 = ?", 5]],
          bilan: "Quand les nombres sont proches, je pars du petit et j’avance jusqu’au grand : 73 − 68 = 2 + 3 = 5."
        })
      },
      {
        n: 2, titre: "de part et d’autre d’une centaine", nom: "Écart de part et d’autre d’une centaine", palier: 2, type: "P",
        composer: a8Niveau2,
        imposes: [ligneEcart(2, "ecart", 296, 305), ligneEcart(2, "ecart", 97, 103)],
        apprends: a8Apprends({
          manipule: null,
          represente: ecart(397, 402),
          ecris: ecart(596, 604),
          etapes: [["596 + ? = 600", 4], ["600 + ? = 604", 4], ["604 − 596 = ?", 8]],
          bilan: "De part et d’autre d’une centaine, j’avance du petit au grand : 402 − 397 = 3 + 2 = 5."
        })
      },
      {
        n: 3, titre: "de part et d’autre d’un millier", nom: "Écart de part et d’autre d’un millier", palier: 2, type: "P",
        composer: a8Niveau3,
        imposes: [ligneEcart(3, "ecart-trou", 3999, 4000), ligneEcart(3, "ecart", 996, 1003)],
        apprends: a8Apprends({
          manipule: null,
          represente: ecart(2996, 3004),
          ecris: ecart(4997, 5000, "ecart-trou"),
          etapes: [[`4${ESPACE_FINE}997 + ? = 5${ESPACE_FINE}000`, 3], [`5${ESPACE_FINE}000 − ? = 4${ESPACE_FINE}997`, 3]],
          bilan: `De part et d’autre d’un millier, j’avance du petit au grand : 3${ESPACE_FINE}004 − 2${ESPACE_FINE}996 = 4 + 4 = 8.`
        })
      }
    ]
  };

  // ------------------------------------------------- M1 : doubles et moitiés
  //
  // Le schéma en barres de Gwenaël : pour une moitié, la barre du nombre,
  // découpée en morceaux (46 = 40 + 6), puis deux barres égales en dessous ;
  // pour un double, deux barres égales, puis la barre entière en dessous.
  // Pas de manipulation (décision du 31/10) : M1 commence au schéma.
  // Formes : « double » (double de 17), « moitie » (moitié de 36),
  // « trou-double » (2 × □ = 70), « double-fois » (2 × 250), « division »
  // (92 ÷ 2). Données : n (le nombre doublé ou coupé), r (la réponse).

  const M1_MOITIES = Object.freeze(["moitie", "trou-double", "division"]);
  const estMoitie = calcul => M1_MOITIES.includes(calcul.forme);

  // Les morceaux d'un nombre : ses chiffres non nuls, chacun à son rang
  // (46 → 40 et 6 ; 1 200 → 1 000 et 200).
  function morceauxDe(n) {
    const morceaux = [];
    let rang = 1;
    for (let reste = n; reste > 0; reste = Math.floor(reste / 10), rang *= 10) {
      if (reste % 10) morceaux.unshift((reste % 10) * rang);
    }
    return morceaux;
  }

  // Chiffre par chiffre, chacun coupé en deux sans retenue (56 → 23) : la
  // réponse fausse de la cause 3.
  function moitieParChiffre(n) {
    return morceauxDe(n).reduce((somme, morceau) => {
      const rang = 10 ** (String(morceau).length - 1);
      return somme + Math.floor(morceau / rang / 2) * rang;
    }, 0);
  }

  function m1Calcul(niveau, forme, n) {
    const moitie = M1_MOITIES.includes(forme);
    const r = moitie ? n / 2 : n * 2;
    const extra = moitie && moitieParChiffre(n) !== r ? {parChiffre: moitieParChiffre(n)} : {};
    const donnees = Object.assign({n, r}, extra);
    if (forme === "double") return fabriquer("M1", niveau, forme, ["double de", n, "=", TROU], r, donnees);
    if (forme === "double-fois") return fabriquer("M1", niveau, forme, [2, "×", n, "=", TROU], r, donnees);
    if (forme === "trou-double") return fabriquer("M1", niveau, forme, [2, "×", TROU, "=", n], r, donnees);
    if (forme === "division") return fabriquer("M1", niveau, forme, [n, "÷", 2, "=", TROU], r, donnees);
    // « moitié de 36 » : sa clé porte « q » (quotient), sinon elle serait
    // celle de « double de 36 ».
    const calcul = fabriquer("M1", niveau, forme, ["moitié de", n, "=", TROU], r, donnees);
    return Object.freeze(Object.assign({}, calcul, {cle: `${calcul.cle}-q`}));
  }

  // L'image : {outil: "barres", sorte, n, morceaux}. `masque` : l'aide, la
  // réponse cachée.
  function m1Image(calcul) {
    const {n} = calcul.donnees;
    return {outil: "barres", sorte: estMoitie(calcul) ? "moitie" : "double", n, morceaux: morceauxDe(n)};
  }
  function m1Aide(calcul) {
    return Object.assign(m1Image(calcul), {masque: true});
  }

  function m1Phrase(calcul) {
    const {n, r} = calcul.donnees;
    const morceaux = morceauxDe(n);
    const f = formaterNombre;
    if (estMoitie(calcul)) {
      if (morceaux.length < 2) return `Regarde : ${f(n)} coupé en deux, ça fait ${f(r)} et ${f(r)}.`;
      return `Regarde : ${morceaux.map(m => f(m / 2)).join(" et ")}, ça fait ${f(r)}.`;
    }
    if (morceaux.length < 2) return `Regarde : ${f(n)} et encore ${f(n)}, ça fait ${f(r)}.`;
    return `Regarde : ${morceaux.map(m => f(2 * m)).join(" et ")}, ça fait ${f(r)}.`;
  }

  // Du plus simple au plus dur : le double, puis la moitié, puis les autres
  // écritures ; un morceau de plus ; un morceau impair (moitié de 30) ; la
  // taille.
  const M1_FORMES = Object.freeze({double: 0, moitie: 1, "trou-double": 2, "double-fois": 2, division: 2});
  function m1Difficulte(calcul) {
    const {n} = calcul.donnees;
    const morceaux = morceauxDe(n);
    const impair = estMoitie(calcul) && moitieParChiffre(n) !== n / 2 ? 1 : 0;
    return M1_FORMES[calcul.forme] * 1000 + (morceaux.length - 1) * 200 + impair * 100 + String(n).length * 20 + (n % 10);
  }

  const M1_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "double et moitié confondus",
      test: (calcul, reponse) => {
        const {n} = calcul.donnees;
        return estMoitie(calcul) ? memeNombre(reponse, 2 * n) : memeNombre(reponse, n / 2);
      },
      retour: (calcul, reponse) => {
        const {n} = calcul.donnees;
        const f = formaterNombre;
        return estMoitie(calcul)
          ? `${f(reponse)}, c’est le double de ${f(n)}. Ici, on coupe ${f(n)} en deux : ${f(n)} ÷ 2.`
          : `${f(reponse)}, c’est la moitié de ${f(n)}. Le double, c’est 2 fois ${f(n)} : ${f(n)} + ${f(n)}.`;
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "un morceau oublié",
      test: (calcul, reponse) => {
        const {n, r} = calcul.donnees;
        const morceaux = morceauxDe(n);
        if (morceaux.length < 2) return false;
        return morceaux.some(m => memeNombre(reponse, estMoitie(calcul) ? r + m / 2 : r - m));
      },
      retour: calcul => {
        const morceaux = morceauxDe(calcul.donnees.n).map(formaterNombre).join(" et ");
        return estMoitie(calcul) ? `Coupe CHAQUE morceau en deux : ${morceaux}.` : `Double CHAQUE morceau : ${morceaux}.`;
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "chiffre par chiffre, sans la retenue",
      test: (calcul, reponse) => calcul.donnees.parChiffre !== undefined && memeNombre(reponse, calcul.donnees.parChiffre),
      retour: (calcul, reponse) => {
        const morceau = morceauxDe(calcul.donnees.n).find(m => (m / 10 ** (String(m).length - 1)) % 2 === 1 && m >= 10);
        const rang = 10 ** (String(morceau).length - 1);
        return `${formaterNombre(reponse)}, c’est trop petit : la moitié de ${formaterNombre(morceau)}, ce n’est pas ${formaterNombre(Math.floor(morceau / rang / 2) * rang)}.`;
      },
      gras: 0
    })
  ]);

  // Les viviers des niveaux, par forme (les calculs d'un niveau ne sont
  // jamais ceux d'un autre).
  const entre = (de, a, pas = 1) => Array.from({length: Math.floor((a - de) / pas) + 1}, (_, i) => de + i * pas);
  const M1_VIVIERS = Object.freeze({
    1: Object.freeze({
      double: [...entre(2, 20), 30, 40, 50],
      moitie: [...entre(4, 40, 2), 50, 60, 70, 80, 90, 100],
      "trou-double": [...entre(12, 40, 2), 50, 60, 70, 80, 90, 100]
    }),
    2: Object.freeze({
      double: [25, 35, 45, 75, 60, 70, 80, 90, 150, 250, 350, 450, 500, 600, 700, 800, 900],
      moitie: [120, 140, 160, 180, 150, 200, 300, 500, 700, 900, 1000, 1200, 1400, 1600, 1800, 2000, 3000, 5000],
      "double-fois": [25, 75, 150, 250, 350, 450, 500, 600, 750, 1500, 2500]
    }),
    3: Object.freeze({
      double: [...entre(21, 49).filter(n => n % 5 !== 0), 124, 132, 136, 143, 214, 225, 236, 318, 342, 417],
      moitie: [...entre(42, 98, 2).filter(n => n % 10 !== 0), 230, 250, 270, 370, 410, 470, 520, 650, 830, 910],
      division: [...entre(42, 98, 2).filter(n => n % 10 !== 0), 230, 250, 270, 370, 410, 470, 520, 650, 830, 910]
    })
  });

  function m1Niveau(niveau, parts) {
    const viviers = M1_VIVIERS[niveau];
    const formes = Object.keys(viviers);
    return function composer(rng, total, imposes) {
      const nombres = repartir(total, parts);
      const pris = new Set(imposes.map(c => c.cle));
      const tires = formes.flatMap((forme, i) => {
        const deja = imposes.filter(c => c.forme === forme).length;
        return melanger(rng, viviers[forme].map(n => m1Calcul(niveau, forme, n)))
          .filter(c => !pris.has(c.cle)).slice(0, Math.max(0, nombres[i] - deja));
      });
      return [...tires, ...imposes];
    };
  }

  // J'apprends d'un niveau de M1 : le schéma (« je représente »), puis les
  // étapes (« j'écris »), où la moitié s'écrit aussi « ÷ 2 » (carte v2).
  function m1Apprends({represente, ecris, consigne, consigneEcris, etapes, bilan}) {
    return Object.freeze({
      exemple: Object.freeze({texte: represente.texte.replace(` = ${CASE}`, "").replace(CASE, "?"), reponse: represente.reponse}),
      manipule: null,
      represente: Object.freeze({
        outil: "barres", consigne,
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(m1Aide(represente)),
        solution: Object.freeze({image: m1Image(represente), phrase: m1Phrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        consigne: consigneEcris,
        etapes: Object.freeze(etapes.map(([texte, reponse]) => Object.freeze({texte: texte.replace("?", CASE), reponse}))),
        reponse: ecris.reponse,
        solution: Object.freeze({image: m1Image(ecris), phrase: m1Phrase(ecris)})
      }, barresDessins(m1Image(ecris), etapes.length)),
      bilan,
      image: Object.freeze(m1Image(ecris)),
      textes: Object.freeze([represente.texte, represente.texte, ecris.texte])
    });
  }

  const M1 = {
    id: "M1", nom: "Doubles et moitiés", exemple: "double de 17",
    famille: "M", construit: true,
    aide_entraine: "barres",
    erreurs: M1_ERREURS, image: m1Image, aide: m1Aide, manipulation: () => null, difficulte: m1Difficulte,
    niveaux: [
      {
        n: 1, titre: "doubles de 1 à 20, moitiés des pairs jusqu’à 40, dizaines", nom: "Doubles et moitiés jusqu’à 40", palier: 1, type: "F",
        composer: m1Niveau(1, [5, 5, 2]),
        imposes: [m1Calcul(1, "moitie", 60), m1Calcul(1, "trou-double", 70)],
        apprends: m1Apprends({
          represente: m1Calcul(0, "double", 17),
          ecris: m1Calcul(0, "moitie", 28),
          consigne: "Le double de 17, c’est 17 + 17.",
          consigneEcris: "moitié de 28 = 28 ÷ 2",
          etapes: [["20 ÷ 2 = ?", 10], ["8 ÷ 2 = ?", 4], ["moitié de 28 = ?", 14]],
          bilan: "Le double, c’est 2 fois le nombre. La moitié, c’est le nombre divisé par 2 : moitié de 28 = 28 ÷ 2 = 14."
        })
      },
      {
        n: 2, titre: "nombres usuels (25, 75, 150, 600, 1 200…)", nom: "Doubles et moitiés des nombres usuels", palier: 1, type: "F",
        composer: m1Niveau(2, [5, 5, 2]),
        imposes: [m1Calcul(2, "moitie", 1200), m1Calcul(2, "double-fois", 250)],
        apprends: m1Apprends({
          represente: m1Calcul(0, "moitie", 150),
          ecris: m1Calcul(0, "double", 75),
          consigne: "Je coupe chaque morceau en deux.",
          consigneEcris: "double de 75 = 2 × 75",
          etapes: [["2 × 70 = ?", 140], ["2 × 5 = ?", 10], ["double de 75 = ?", 150]],
          bilan: "Double de 25 = 50, double de 75 = 150, moitié de 150 = 150 ÷ 2 = 75, moitié de 1 200 = 600 : ces nombres-là, je les sais par cœur."
        })
      },
      {
        n: 3, titre: "par décomposition", nom: "Doubles et moitiés en découpant", palier: 1, type: "P",
        composer: m1Niveau(3, [4, 4, 2]),
        imposes: [m1Calcul(3, "moitie", 470), m1Calcul(3, "double", 136), m1Calcul(3, "division", 92)],
        apprends: m1Apprends({
          represente: m1Calcul(0, "moitie", 74),
          ecris: m1Calcul(0, "moitie", 46),
          consigne: "Je coupe chaque morceau en deux.",
          consigneEcris: "moitié de 46 = 46 ÷ 2",
          etapes: [["40 ÷ 2 = ?", 20], ["6 ÷ 2 = ?", 3], ["moitié de 46 = ?", 23]],
          bilan: "Pour la moitié, je coupe chaque morceau en deux : moitié de 46 = 46 ÷ 2 = 20 + 3 = 23. Pour le double, je double chaque morceau."
        })
      }
    ]
  };

  // ======================================== modules lot 3 (01/11/2026) :
  // M3, M4, M5, M6, M8, le multiplicatif du palier 1. Décisions de Gwenaël
  // (questions à choix, planches « choix-1 » à « choix-5 ») :
  //  - M3 : la table, puis le glisse-nombres de M2 (9 × 40 : 9 × 4 = 36, et
  //    36 glisse d'une colonne), puis le tableau à flèches ;
  //  - M4 : pas de manipulation, la bande de la table ; l'élève qui fait 2
  //    erreurs sur une même table dans une série est envoyé vers Défi tables
  //    (phrase et bouton à la fin de la série) ;
  //  - M5 : la barre du repère (100, 60) coupée en parts égales ;
  //  - M6 : un seul schéma en barres, rangées collées : 23 | 23 | 23 | 23,
  //    puis 46 | 46, puis 92 (l'accolade) ;
  //  - M8 : le rectangle déjà coupé (10 | 3), quadrillé au niveau 1.

  // Les deux-points, points d'interrogation et d'exclamation d'une phrase :
  // l'espace insécable devant.
  const fr = texte => texte.replace(/ ([:?!;])/g, " $1");
  const f = formaterNombre;
  // « À retenir » : un signe ne se sépare pas du nombre qui le suit
  // (« 5 ×⏎20 » au téléphone).
  const frBilan = texte => fr(texte).replace(/ ([×÷+−=]) (\d)/g, " $1\u00a0$2");

  // Un niveau tiré dans des viviers fixes, par écriture (comme M1) :
  // `viviers` {forme: [calculs]}, `parts` les proportions des écritures.
  function vivierNiveau(viviers, parts) {
    const formes = Object.keys(viviers);
    return function composer(rng, total, imposes) {
      const nombres = repartir(total, parts);
      const pris = new Set(imposes.map(c => c.cle));
      const tires = formes.flatMap((forme, i) => {
        const deja = imposes.filter(c => c.forme === forme).length;
        return melanger(rng, viviers[forme]).filter(c => !pris.has(c.cle)).slice(0, Math.max(0, nombres[i] - deja));
      });
      return [...tires, ...imposes];
    };
  }

  // Les étapes de J'écris (« 8 × 4 = ? » → « 8 × 4 = □ »).
  const etapesEcris = etapes => Object.freeze(etapes.map(([texte, reponse]) => Object.freeze({texte: texte.replace("?", CASE), reponse})));
  // L'exemple d'un J'apprends : le calcul sans sa case.
  const exempleDe = calcul => Object.freeze({texte: calcul.texte.replace(` = ${CASE}`, "").replace(CASE, "?"), reponse: calcul.reponse});

  // Un J'apprends sans manipulation (M4, M5, M6, M8, comme M1) : l'image
  // de « je représente », puis les étapes de « j'écris » avec leurs dessins.
  function apprendsSansManip({fiche, represente, ecris, consigne, consigneEcris, etapes, dessins, bilan, retenir = null}) {
    return Object.freeze({
      exemple: exempleDe(represente),
      manipule: null,
      represente: Object.freeze({
        outil: fiche.aide(represente).outil, consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(fiche.aide(represente)),
        solution: Object.freeze({image: fiche.image(represente), phrase: fiche.phrase(represente)})
      }),
      ecris: ecrisAvecDessins(Object.assign({
        etapes: etapesEcris(etapes), reponse: ecris.reponse,
        solution: Object.freeze({image: fiche.image(ecris), phrase: fiche.phrase(ecris)})
      }, consigneEcris ? {consigne: fr(consigneEcris)} : {}), dessins(ecris, etapes.length)),
      bilan: frBilan(bilan),
      // « À retenir » : l'image du calcul de « je représente », sauf quand
      // la fiche en donne une autre (M4 : la famille de faits en points).
      image: Object.freeze(retenir || fiche.image(represente)),
      textes: Object.freeze([represente.texte, represente.texte, ecris.texte])
    });
  }

  // Les erreurs d'un calcul : jamais sur la bonne réponse.
  const sauf = test => (calcul, reponse) => !memeNombre(reponse, calcul.reponse) && test(calcul, reponse);

  // ----------------------------------------------- M4, M5 : les faits de × et ÷
  //
  // Un fait : « a × b = □ », « p ÷ a = □ », « a × □ = p », « p = a × □ ».
  // Données : a (le premier facteur écrit), b (l'autre), p (le produit),
  // table (la table de la bande, M4 ; 25 ou le repère, M5).
  function faitCalcul(module, niveau, forme, a, b, table = a) {
    const p = a * b;
    const donnees = {a, b, p, table, plus: p + a, somme: a + b};
    if (forme === "produit") return fabriquer(module, niveau, forme, [a, "×", b, "=", TROU], p, donnees);
    if (forme === "division") return fabriquer(module, niveau, forme, [p, "÷", a, "=", TROU], b, donnees);
    if (forme === "trou-facteur") return fabriquer(module, niveau, forme, [a, "×", TROU, "=", p], b, donnees);
    // « 10 = 2 × □ » : sa clé finit par « x », sans quoi elle serait celle
    // de « 10 × 2 = □ ».
    const egal = fabriquer(module, niveau, "trou-egal", [p, "=", a, "×", TROU], b, donnees);
    return Object.freeze(Object.assign({}, egal, {cle: `${egal.cle}-x`}));
  }

  // Les erreurs connues des faits (M4, M5).
  const FAITS_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "un rang de la table à côté",
      test: sauf((calcul, reponse) => {
        if (calcul.forme !== "produit") return false;
        const {a, b, p, table} = calcul.donnees;
        return (calcul.module === "M5" ? [table] : [a, b]).some(x => memeNombre(reponse, p + x) || memeNombre(reponse, p - x));
      }),
      retour: (calcul, reponse) => {
        const {a, b, p, table} = calcul.donnees;
        const x = (calcul.module === "M5" ? [table] : [a, b]).find(y => memeNombre(reponse, p + y) || memeNombre(reponse, p - y));
        return fr(`${f(reponse)}, c’est ${f(x)} × ${f(reponse / x)}. Ici, c’est ${f(x)} × ${f(p / x)} : ${calcul.module === "M4" ? "compte les sauts sur la bande" : "compte les parts"}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "à 1 près",
      test: sauf((calcul, reponse) => calcul.forme !== "produit" && Number.isInteger(reponse) && Math.abs(reponse - calcul.reponse) === 1),
      retour: (calcul, reponse) => {
        const {a, b, p} = calcul.donnees;
        // 16 = 4 × □ → 3 : « 4 × 3 » écrirait la réponse (4) ; on dit
        // « 3 × 3 ».
        const autre = a === b ? reponse : a;
        return fr(`${f(autre)} × ${f(reponse)} = ${f(autre * reponse)}, pas ${f(p)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "additionné au lieu de multiplier",
      test: sauf((calcul, reponse) => calcul.forme === "produit" && memeNombre(reponse, calcul.donnees.a + calcul.donnees.b)),
      retour: (calcul, reponse) => {
        const {a, b} = calcul.donnees;
        return fr(`${f(reponse)}, c’est ${f(a)} + ${f(b)}. Ici, on multiplie : ${f(b)} fois ${f(a)}.`);
      },
      gras: 0
    })
  ]);

  // Du plus simple au plus dur : le produit, puis le nombre manquant, puis
  // l'égalité à l'envers, puis la division ; puis la taille du produit.
  const FAITS_FORMES = Object.freeze({produit: 0, "trou-facteur": 1, "trou-egal": 2, division: 3});
  const faitDifficulte = calcul => FAITS_FORMES[calcul.forme] * 1000 + calcul.donnees.p;

  // ---- M4 : la bande de la table, le rectangle de points
  //
  // Décision du 01/11 (planche « choix-6 ») : un produit se lit sur la bande
  // de la table (7 × 8 : on compte de 7 en 7 jusqu'à « × 8 » ; la table est
  // tirée au moment d'écrire, 8 × 7 se lit sur la même bande). Une division
  // ou un nombre manquant se lit sur le rectangle de points : 56 ÷ 7, « dans
  // 56, combien de fois 7 ? », 56 points rangés par 7.
  function m4Image(calcul) {
    const {a, p, table} = calcul.donnees;
    return calcul.forme === "produit"
      ? {outil: "bande", table, cherche: p / table}
      : {outil: "points", rangees: p / a, parRangee: a};
  }
  const m4Aide = calcul => Object.assign(m4Image(calcul), {masque: true});
  function m4Phrase(calcul) {
    const {a, p, table} = calcul.donnees;
    if (calcul.forme !== "produit") return fr(`Regarde : dans ${f(p)}, il y a ${f(p / a)} fois ${f(a)}.`);
    return fr(`Regarde : ${f(table)} × ${f(p / table)} = ${f(p)}.`);
  }

  // M4-1 : au moins un facteur de 2 à 5, l'autre de 2 à 10. M4-2 : les deux
  // de 6 à 10, au moins un de 6 à 9 (le reste des tables) : les deux niveaux
  // n'ont aucun calcul commun.
  function m4Vivier(niveau) {
    const paires = [];
    for (let a = 2; a <= 10; a += 1) for (let b = 2; b <= 10; b += 1) {
      const petit = Math.min(a, b);
      const ok = niveau === 1 ? petit <= 5 : petit >= 6 && Math.min(a, b) <= 9 && !(a === 10 && b === 10);
      if (ok) paires.push([a, b]);
    }
    // La table d'un produit : niveau 1, le facteur de 2 à 5 (le plus grand
    // des deux s'ils le sont tous les deux) ; niveau 2, le facteur de 6 à 9.
    const tableDe = (a, b) => {
      const candidates = [a, b].filter(x => (niveau === 1 ? x <= 5 : x <= 9));
      return Math.max(...candidates);
    };
    return Object.freeze({
      produit: paires.map(([a, b]) => faitCalcul("M4", niveau, "produit", a, b, tableDe(a, b))),
      division: paires.filter(([a]) => a <= 9).map(([a, b]) => faitCalcul("M4", niveau, "division", a, b)),
      "trou-facteur": paires.filter(([a]) => a <= 9).map(([a, b]) => faitCalcul("M4", niveau, "trou-facteur", a, b)),
      "trou-egal": paires.filter(([a]) => a <= 9).map(([a, b]) => faitCalcul("M4", niveau, "trou-egal", a, b))
    });
  }
  const M4_VIVIERS = Object.freeze({1: m4Vivier(1), 2: m4Vivier(2)});
  const m4Fait = (niveau, forme, a, b) => M4_VIVIERS[niveau][forme].find(c => c.donnees.a === a && c.donnees.b === b);

  // Le rectangle de points dans J'écris (54 ÷ 6 : 54 points rangés par 6) :
  // la première égalité (6 × □ = 54) trouve « 9 fois », la dernière
  // (54 ÷ 6 = □) le redit.
  function finiDessins(image, etapes) {
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, fini: vus.length > 0})));
    return dessinsDe(Array.from({length: etapes}, () => ({})), etapes, dessin);
  }

  // La table à revoir dans Défi tables (décision du 01/11) : celle d'une
  // série d'M4 où l'élève a fait au moins 2 erreurs. Rend le numéro de la
  // table (la plus ratée, la plus petite en cas d'égalité) ou null.
  //   reponses : [{juste, calcul}]
  function tableARevoir(reponses) {
    const erreurs = new Map();
    (reponses || []).forEach(reponse => {
      if (reponse.juste || !reponse.calcul || reponse.calcul.module !== "M4") return;
      const table = reponse.calcul.donnees.table;
      erreurs.set(table, (erreurs.get(table) || 0) + 1);
    });
    const ratees = [...erreurs.entries()].filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1] || x[0] - y[0]);
    return ratees.length ? ratees[0][0] : null;
  }

  const M4 = {
    id: "M4", nom: "Les tables dans tous les sens", exemple: "4 × 7",
    famille: "M", construit: true,
    aide_entraine: "bande",
    erreurs: FAITS_ERREURS, image: m4Image, aide: m4Aide, phrase: m4Phrase, manipulation: () => null, difficulte: faitDifficulte
  };
  M4.niveaux = [
    {
      n: 1, titre: "tables de 2 à 5 : ×, ÷, nombre manquant", nom: "Tables de 2 à 5 dans tous les sens", palier: 1, type: "F",
      composer: vivierNiveau(M4_VIVIERS[1], [5, 3, 2, 2]),
      imposes: [m4Fait(1, "trou-facteur", 3, 8), m4Fait(1, "trou-egal", 4, 3)],
      apprends: apprendsSansManip({
        fiche: M4,
        represente: faitCalcul("M4", 0, "produit", 4, 7, 4),
        ecris: faitCalcul("M4", 0, "division", 5, 4),
        consigne: "Je compte de 4 en 4 jusqu’à « × 7 ».",
        consigneEcris: "20 ÷ 5 : combien de fois 5 dans 20 ?",
        etapes: [["5 × ? = 20", 4], ["20 ÷ 5 = ?", 4]],
        dessins: (calcul, n) => finiDessins(m4Image(calcul), n),
        retenir: {outil: "points", rangees: 4, parRangee: 5, colonnes: true},
        bilan: "4 × 5 = 5 × 4 = 20. Dans 20, il y a 4 fois 5 : 20 ÷ 5 = 4. Il y a aussi 5 fois 4 : 20 ÷ 4 = 5."
      })
    },
    {
      n: 2, titre: "toutes les tables : ×, ÷, nombre manquant", nom: "Toutes les tables dans tous les sens", palier: 1, type: "F",
      composer: vivierNiveau(M4_VIVIERS[2], [5, 3, 2, 2]),
      imposes: [m4Fait(2, "division", 7, 8), m4Fait(2, "trou-facteur", 6, 9), m4Fait(2, "trou-egal", 7, 10)],
      apprends: apprendsSansManip({
        fiche: M4,
        represente: faitCalcul("M4", 0, "produit", 7, 8, 7),
        ecris: faitCalcul("M4", 0, "division", 6, 9),
        consigne: "Je compte de 7 en 7 jusqu’à « × 8 ».",
        consigneEcris: "54 ÷ 6 : combien de fois 6 dans 54 ?",
        etapes: [["6 × ? = 54", 9], ["54 ÷ 6 = ?", 9]],
        dessins: (calcul, n) => finiDessins(m4Image(calcul), n),
        retenir: {outil: "points", rangees: 9, parRangee: 6, colonnes: true},
        bilan: "6 × 9 = 9 × 6 = 54. Dans 54, il y a 9 fois 6 : 54 ÷ 6 = 9. Il y a aussi 6 fois 9 : 54 ÷ 9 = 6."
      })
    }
  ];

  // ---- M5 : repères 25, 60, 100
  //
  // Les multiples de 25 (3 × 25 ; 25 × 6), les décompositions de 100 et de
  // 60 (100 = 4 × □ ; 60 ÷ 12). L'image : la barre du repère coupée en
  // parts égales (planche « choix-3 »).
  function m5Image(calcul) {
    const {a, b, p} = calcul.donnees;
    if (calcul.forme === "produit") {
      const k = a === 25 ? b : a;
      return {outil: "parts", total: 100, parts: 4, cherche: "nombre", pris: k};
    }
    // Une division par un grand nombre (100 ÷ 25, 60 ÷ 12) : combien de
    // parts de 25 (de 12) ; par un petit (100 ÷ 4, 60 ÷ 5) : combien dans
    // chaque part. Un nombre manquant (60 = 4 × □) : 4 parts égales.
    if (calcul.forme === "division" && a > 6) return {outil: "parts", total: p, parts: b, cherche: "parts"};
    return {outil: "parts", total: p, parts: a, cherche: "part"};
  }
  const m5Aide = calcul => Object.assign(m5Image(calcul), {masque: true});
  function m5Phrase(calcul) {
    const {a, b, p} = calcul.donnees;
    return fr(`Regarde : ${f(a)} × ${f(b)} = ${f(p)}.`);
  }
  function partsDessins(image, etapes) {
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: vus.length > 0, fini: vus.length > 0})));
    return dessinsDe(Array.from({length: etapes}, () => ({})), etapes, dessin);
  }

  const M5_VIVIER = (() => {
    const v = {produit: [], division: [], "trou-egal": [], "trou-facteur": []};
    // 25 × 4 = 100 n'est pas un produit à calculer : la barre l'écrit.
    [2, 3, 5, 6, 7, 8].forEach(k => {
      v.produit.push(faitCalcul("M5", 1, "produit", k, 25, 25), faitCalcul("M5", 1, "produit", 25, k, 25));
      v.division.push(faitCalcul("M5", 1, "division", 25, k, 25));
    });
    v.division.push(faitCalcul("M5", 1, "division", 25, 4, 25));
    [[100, [2, 4, 5, 10, 20, 50]], [60, [2, 3, 4, 5, 6, 10, 12, 15, 20, 30]]].forEach(([n, diviseurs]) => diviseurs.forEach(d => {
      v.division.push(faitCalcul("M5", 1, "division", d, n / d, n));
      if (d <= 12) {
        v["trou-egal"].push(faitCalcul("M5", 1, "trou-egal", d, n / d, n));
        v["trou-facteur"].push(faitCalcul("M5", 1, "trou-facteur", d, n / d, n));
      }
    }));
    [3, 6, 8].forEach(k => v["trou-facteur"].push(faitCalcul("M5", 1, "trou-facteur", k, 25, 25)));
    return Object.freeze(v);
  })();
  const m5Fait = (forme, a, b) => M5_VIVIER[forme].find(c => c.donnees.a === a && c.donnees.b === b);

  const M5 = {
    id: "M5", nom: "Repères 25, 60, 100", exemple: "3 × 25",
    famille: "M", construit: true,
    aide_entraine: "parts",
    erreurs: FAITS_ERREURS, image: m5Image, aide: m5Aide, phrase: m5Phrase, manipulation: () => null, difficulte: faitDifficulte
  };
  M5.niveaux = [
    {
      n: 1, titre: "multiples de 25, décompositions de 60 et de 100", nom: "Repères 25, 60, 100", palier: 1, type: "F",
      composer: vivierNiveau(M5_VIVIER, [4, 4, 2, 2]),
      imposes: [m5Fait("trou-egal", 4, 15), m5Fait("division", 25, 4)],
      apprends: apprendsSansManip({
        fiche: M5,
        represente: faitCalcul("M5", 0, "produit", 3, 25, 25),
        ecris: faitCalcul("M5", 0, "trou-egal", 4, 15, 60),
        consigne: "100, c’est 4 fois 25.",
        consigneEcris: "Je coupe 60 en 4 parts égales.",
        etapes: [["60 = 4 × ?", 15], ["60 ÷ 4 = ?", 15]],
        dessins: (calcul, n) => partsDessins(m5Image(calcul), n),
        bilan: "100 = 4 × 25, donc 3 × 25 = 75. Je sais par cœur : 100 = 2 × 50 = 5 × 20 et 60 = 4 × 15 = 5 × 12 = 6 × 10."
      })
    }
  ];

  // ------------------------------------------------- M6 : × 4, × 8, le double du double
  //
  // « 23 × 4 » ou « 4 × 37 » : n (le nombre doublé), fois (4 ou 8), r. Les
  // doubles successifs (46, 92…) pour les erreurs connues.
  function m6Calcul(niveau, fois, n, gauche = false) {
    const r = n * fois;
    const donnees = {n, fois, r, double: 2 * n, quadruple: 4 * n, trop: 2 * r, somme: n + fois};
    return gauche
      ? fabriquer("M6", niveau, "produit-gauche", [fois, "×", n, "=", TROU], r, donnees)
      : fabriquer("M6", niveau, "produit", [n, "×", fois, "=", TROU], r, donnees);
  }
  const m6Image = calcul => ({outil: "barres-fois", n: calcul.donnees.n, fois: calcul.donnees.fois});
  const m6Aide = calcul => Object.assign(m6Image(calcul), {masque: true});
  function m6Phrase(calcul) {
    const {n, fois} = calcul.donnees;
    const doubles = [];
    for (let x = n * 2; x <= n * fois; x *= 2) doubles.push(f(x));
    return fr(`Regarde : ${f(n)}, puis ${doubles.join(", puis ")}.`);
  }
  // Du plus simple au plus dur : une retenue en doublant (unités de 5 à 9),
  // puis la taille.
  function m6Difficulte(calcul) {
    const {n} = calcul.donnees;
    return (calcul.forme === "produit-gauche" ? 500 : 0) + (n % 10 >= 5 ? 300 : 0) + n;
  }
  const M6_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "doublé une fois de moins",
      test: sauf((calcul, reponse) => {
        const {n, fois} = calcul.donnees;
        return [2, 4].some(k => k < fois && memeNombre(reponse, n * k));
      }),
      retour: (calcul, reponse) => {
        const {n, fois} = calcul.donnees;
        const k = reponse / n;
        const combien = fois === 4 ? "deux fois" : "trois fois";
        return fr(`${f(reponse)}, c’est ${f(n)} × ${k} : tu as doublé ${k === 2 ? "une fois" : "deux fois"}. × ${fois}, c’est doubler ${combien}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "doublé une fois de trop",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.r * 2)),
      retour: (calcul, reponse) => {
        const {n, fois} = calcul.donnees;
        return fr(`${f(reponse)}, c’est ${f(n)} × ${fois * 2} : tu as doublé une fois de trop.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "additionné au lieu de multiplier",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.n + calcul.donnees.fois)),
      retour: (calcul, reponse) => {
        const {n, fois} = calcul.donnees;
        return fr(`${f(reponse)}, c’est ${f(n)} + ${fois}. Ici, on multiplie : ${f(n)} × ${fois}, c’est doubler ${fois === 4 ? "deux fois" : "trois fois"}.`);
      },
      gras: 0
    })
  ]);
  // Les nombres doublés : à deux chiffres (de 12 à 99 pour × 4, de 11 à 60
  // pour × 8), sans 25, 50, 75 (des repères : M5), sans dizaine entière
  // (40 × 4 : M3).
  const m6Nombres = (de, a) => entre(de, a).filter(n => n % 10 !== 0 && n % 25 !== 0);
  function m6Vivier(niveau, fois, de, a) {
    const nombres = m6Nombres(de, a);
    return Object.freeze({
      produit: nombres.map(n => m6Calcul(niveau, fois, n)),
      "produit-gauche": nombres.map(n => m6Calcul(niveau, fois, n, true))
    });
  }
  // Les étapes de J'écris d'M6 : « 2 × 37 = □ », « 4 × 37 = □ »… Chaque
  // double remplit sa rangée ; le dernier, l'accolade.
  function barresFoisDessins(image, etapes) {
    const dessin = (vus, revele = false) => {
      if (revele) return Object.freeze(Object.assign({}, image));
      const lignes = Math.round(Math.log2(image.fois));
      const faites = vus.length;
      return Object.freeze(Object.assign({}, image, {masque: true, trouves: Math.min(faites, lignes - 1), fini: faites >= etapes}));
    };
    return dessinsDe(Array.from({length: etapes}, () => ({})), etapes, dessin);
  }

  const M6 = {
    id: "M6", nom: "× 4, × 8 : le double du double", exemple: "23 × 4",
    famille: "M", construit: true,
    aide_entraine: "barres-fois",
    erreurs: M6_ERREURS, image: m6Image, aide: m6Aide, phrase: m6Phrase, manipulation: () => null, difficulte: m6Difficulte
  };
  const M6_VIVIERS = Object.freeze({1: m6Vivier(1, 4, 12, 99), 2: m6Vivier(2, 8, 11, 60)});
  M6.niveaux = [
    {
      n: 1, titre: "× 4", nom: "× 4 : le double du double", palier: 1, type: "P",
      composer: vivierNiveau(M6_VIVIERS[1], [7, 3]),
      imposes: [m6Calcul(1, 4, 38, true), m6Calcul(1, 4, 47)],
      apprends: apprendsSansManip({
        fiche: M6,
        represente: m6Calcul(0, 4, 23),
        ecris: m6Calcul(0, 4, 37, true),
        consigne: "Je double 23, puis je double encore.",
        consigneEcris: "4 × 37 : je double 37, puis je double encore.",
        etapes: [["2 × 37 = ?", 74], ["4 × 37 = ?", 148]],
        dessins: (calcul, n) => barresFoisDessins(m6Image(calcul), n),
        bilan: "× 4, c’est le double du double : 23 × 4 = 46 × 2 = 92."
      })
    },
    {
      n: 2, titre: "× 8", nom: "× 8 : doubler trois fois", palier: 1, type: "P",
      composer: vivierNiveau(M6_VIVIERS[2], [7, 3]),
      imposes: [m6Calcul(2, 8, 26, true), m6Calcul(2, 8, 17)],
      apprends: apprendsSansManip({
        fiche: M6,
        represente: m6Calcul(0, 8, 15),
        ecris: m6Calcul(0, 8, 27, true),
        consigne: "Je double 15, puis encore, puis encore.",
        consigneEcris: "8 × 27 : je double trois fois.",
        etapes: [["2 × 27 = ?", 54], ["4 × 27 = ?", 108], ["8 × 27 = ?", 216]],
        dessins: (calcul, n) => barresFoisDessins(m6Image(calcul), n),
        bilan: "× 8, c’est doubler trois fois : 15 × 8 = 30 × 4 = 60 × 2 = 120."
      })
    }
  ];

  // ------------------------------------------------- M8 : distributivité, décomposer
  //
  // « 13 × 7 » ou « 7 × 13 » : a (le facteur qu'on garde), b (celui qu'on
  // coupe), morceaux de b (10 et 3 ; 40 et 7 ; 10 et 2). Données pour les
  // erreurs : g (le grand morceau × a), u (le petit, sans × a : 70 + 3),
  // plat (les dizaines prises pour des unités : 1 × 7 + 3 × 7).
  function m8Calcul(niveau, a, b, gauche = false) {
    const morceaux = [b - b % 10, b % 10];
    const r = a * b;
    const g = morceaux[0] * a;
    const donnees = {a, b, r, g, oubli: g + morceaux[1], plat: (morceaux[0] / 10 + morceaux[1]) * a};
    return gauche
      ? fabriquer("M8", niveau, "produit-gauche", [a, "×", b, "=", TROU], r, donnees)
      : fabriquer("M8", niveau, "produit", [b, "×", a, "=", TROU], r, donnees);
  }
  // M8-3, en trou : « 12 × 42 = 10 × 42 + □ × 42 » (la réponse : 2).
  function m8Trou(niveau, a, b) {
    const morceaux = [b - b % 10, b % 10];
    return fabriquer("M8", niveau, "trou", [b, "×", a, "=", morceaux[0], "×", a, "+", TROU, "×", a], morceaux[1], {a, b, r: a * b});
  }
  function m8Image(calcul) {
    const {a, b} = calcul.donnees;
    return {outil: "rectangle", a, b, morceaux: [b - b % 10, b % 10], quadrille: b < 20 && a < 10};
  }
  const m8Aide = calcul => Object.assign(m8Image(calcul), {masque: true});
  function m8Phrase(calcul) {
    const {a, b} = calcul.donnees;
    const [d, u] = [b - b % 10, b % 10];
    return fr(`Regarde : ${f(d)} × ${f(a)} = ${f(d * a)} et ${u} × ${f(a)} = ${f(u * a)}, ça fait ${f(a * b)}.`);
  }
  function m8Difficulte(calcul) {
    const {a, b} = calcul.donnees;
    if (calcul.forme === "trou") return 5000 + b;
    return (calcul.forme === "produit-gauche" ? 2000 : 0) + (b % 10) * a + b;
  }
  const M8_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "un morceau oublié",
      test: sauf((calcul, reponse) => calcul.forme !== "trou" && memeNombre(reponse, calcul.donnees.g)),
      retour: (calcul, reponse) => {
        const {a, b} = calcul.donnees;
        const [d, u] = [b - b % 10, b % 10];
        return fr(`${f(reponse)}, c’est ${f(d)} × ${f(a)}. Il reste ${u} × ${f(a)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "le petit morceau pas multiplié",
      test: sauf((calcul, reponse) => calcul.forme !== "trou" && memeNombre(reponse, calcul.donnees.oubli)),
      retour: (calcul, reponse) => {
        const {a, b} = calcul.donnees;
        const u = b % 10;
        return fr(`${f(reponse)} : tu as ajouté ${u}. Il faut ajouter ${u} × ${f(a)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "les dizaines prises pour des unités",
      test: sauf((calcul, reponse) => calcul.forme !== "trou" && calcul.donnees.b >= 20 && memeNombre(reponse, calcul.donnees.plat)),
      retour: (calcul, reponse) => {
        const {b} = calcul.donnees;
        const [d, u] = [b - b % 10, b % 10];
        return fr(`${f(reponse)} : ${f(b)}, c’est ${f(d)} + ${u}, pas ${d / 10} + ${u}.`);
      },
      gras: 0
    })
  ]);
  // Le dessin de J'écris : chaque morceau (10 × 7, 3 × 7), puis l'accolade.
  function rectangleDessins(image, etapes) {
    const morceaux = image.morceaux.map((_, i) => ({morceau: i}));
    morceaux.push({fini: true});
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: vus.filter(m => m.morceau !== undefined).map(m => m.morceau), fini: vus.some(m => m.fini)})));
    return dessinsDe(morceaux, etapes, dessin);
  }
  // Les chiffres qu'on garde : 3, 6, 7, 9 (× 2 : M1 ; × 4, × 8 : M6 ; × 5 : M7).
  const M8_CHIFFRES = Object.freeze([3, 6, 7, 9]);
  function m8Vivier(niveau) {
    const v = {produit: [], "produit-gauche": []};
    if (niveau < 3) {
      const nombres = niveau === 1 ? entre(11, 19) : entre(21, 99).filter(b => b % 10 !== 0);
      M8_CHIFFRES.forEach(a => nombres.forEach(b => { v.produit.push(m8Calcul(niveau, a, b)); v["produit-gauche"].push(m8Calcul(niveau, a, b, true)); }));
      return Object.freeze(v);
    }
    // M8-3 : × 11, × 12, × 21, × 31 d'un nombre à deux chiffres (de 13 à 99,
    // sans dizaine entière) ; un calcul sur cinq en trou.
    v.trou = [];
    [11, 12, 21, 31].forEach(b => entre(13, 99).filter(a => a % 10 !== 0 && a !== 21 && a !== 31 && a !== 11 && a !== 12).forEach(a => {
      v.produit.push(m8Calcul(3, a, b));
      v["produit-gauche"].push(m8Calcul(3, a, b, true));
      v.trou.push(m8Trou(3, a, b));
    }));
    return Object.freeze(v);
  }
  const M8_VIVIERS = Object.freeze({1: m8Vivier(1), 2: m8Vivier(2), 3: m8Vivier(3)});

  const M8 = {
    id: "M8", nom: "Distributivité : décomposer", exemple: "13 × 7",
    famille: "M", construit: true,
    aide_entraine: "rectangle",
    erreurs: M8_ERREURS, phrase: m8Phrase, manipulation: () => null, difficulte: m8Difficulte,
    // Le trou (M8-3) n'a pas d'aide : le rectangle écrirait la réponse (le
    // petit morceau). Il l'a pour la correction.
    image: m8Image,
    aide: calcul => (calcul.forme === "trou" ? null : m8Aide(calcul))
  };
  M8.niveaux = [
    {
      n: 1, titre: "un chiffre × 11 à 19", nom: "Un chiffre × 11 à 19", palier: 1, type: "P",
      composer: vivierNiveau(M8_VIVIERS[1], [6, 4]),
      imposes: [m8Calcul(1, 6, 14, true), m8Calcul(1, 9, 17)],
      apprends: apprendsSansManip({
        fiche: M8,
        represente: m8Calcul(0, 7, 13),
        ecris: m8Calcul(0, 6, 14, true),
        consigne: "13 fois 7, c’est 10 fois 7 plus 3 fois 7.",
        consigneEcris: "6 × 14 : je coupe 14 en 10 et 4.",
        etapes: [["10 × 6 = ?", 60], ["4 × 6 = ?", 24], ["6 × 14 = ?", 84]],
        dessins: (calcul, n) => rectangleDessins(m8Image(calcul), n),
        bilan: "13 fois 7, c’est 10 fois 7 plus 3 fois 7 : 13 × 7 = 70 + 21 = 91."
      })
    },
    {
      n: 2, titre: "un chiffre × deux chiffres", nom: "Un chiffre × deux chiffres", palier: 1, type: "P",
      composer: vivierNiveau(M8_VIVIERS[2], [6, 4]),
      imposes: [m8Calcul(2, 7, 23), m8Calcul(2, 6, 47, true)],
      apprends: apprendsSansManip({
        fiche: M8,
        represente: m8Calcul(0, 7, 23),
        ecris: m8Calcul(0, 6, 47, true),
        consigne: "Je coupe 23 en 20 et 3.",
        consigneEcris: "6 × 47 : je coupe 47 en 40 et 7.",
        etapes: [["40 × 6 = ?", 240], ["7 × 6 = ?", 42], ["6 × 47 = ?", 282]],
        dessins: (calcul, n) => rectangleDessins(m8Image(calcul), n),
        bilan: "Je coupe le nombre en dizaines et unités : 23 × 7 = 20 × 7 + 3 × 7 = 140 + 21 = 161."
      })
    },
    {
      n: 3, titre: "× 11, × 12, × 21, × 31 (et en trou)", nom: "× 11, × 12, × 21, × 31", palier: 2, type: "P",
      composer: vivierNiveau(M8_VIVIERS[3], [4, 4, 2]),
      imposes: [m8Calcul(3, 42, 12), m8Trou(3, 35, 21)],
      apprends: apprendsSansManip({
        fiche: M8,
        represente: m8Calcul(0, 43, 21),
        ecris: m8Calcul(0, 35, 12),
        consigne: "21 fois 43, c’est 20 fois 43 plus 1 fois 43.",
        consigneEcris: "12 × 35 : je coupe 12 en 10 et 2.",
        etapes: [["10 × 35 = ?", 350], ["2 × 35 = ?", 70], ["12 × 35 = ?", 420]],
        dessins: (calcul, n) => rectangleDessins(m8Image(calcul), n),
        bilan: "21 fois 43, c’est 20 fois 43 plus 1 fois 43 : 21 × 43 = 860 + 43 = 903."
      })
    }
  ];

  // ------------------------------------------------- M3 : tables étendues
  //
  // « 9 × 40 », « 900 × 700 » : chaque facteur est un chiffre suivi de
  // zéros. On fait la table (9 × 4 = 36), puis chaque chiffre vaut 10 fois
  // (100, 1 000…) plus. Données : x, y (les facteurs écrits), c1, c2 (leurs
  // chiffres), t (la table), p (la puissance de 10), r ; voisin (une table
  // fausse, × p) pour l'exemple de la page prof.
  function m3Calcul(niveau, x, y) {
    const chiffre = n => Number(String(n)[0]);
    const c1 = chiffre(x);
    const c2 = chiffre(y);
    const t = c1 * c2;
    const p = (x * y) / t;
    const r = x * y;
    // « 40 × 9 » : les facteurs ont changé de place (niveaux 1 et 2).
    const forme = niveau !== 3 && String(x).length > String(y).length ? "produit-gauche" : "produit";
    return fabriquer("M3", niveau, forme, [x, "×", y, "=", TROU], r, {x, y, c1, c2, t, p, r, voisin: (t + c1) * p, somme: x + y});
  }
  const m3Rangs = calcul => colonnesDe(calcul.donnees.p);
  const m3Image = calcul => ({outil: "tableau-fleches", depart: calcul.donnees.t, arrivee: calcul.donnees.r, p: calcul.donnees.p, operation: "×"});
  const m3Aide = calcul => Object.assign(m3Image(calcul), {inconnue: true});
  function m3Phrase(calcul) {
    const {c1, c2, t, p, r} = calcul.donnees;
    return fr(`Regarde : ${c1} × ${c2} = ${t}, et ${t} × ${f(p)} = ${f(r)}.`);
  }
  // Le glisse-nombres, après la table : le résultat de la table glisse de
  // autant de colonnes qu'il y a de zéros.
  function m3Manipulation(calcul) {
    const {c1, c2, t, p, r} = calcul.donnees;
    const k = m3Rangs(calcul);
    return Object.freeze({
      outil: "glisse", depart: t, colonnes: COLONNES_M2, decalage: k,
      texte: calcul.texte.replace(` = ${CASE}`, ""),
      consigne: fr(`${c1} × ${c2} = ${t}. Glisse ${t} : chaque chiffre vaut ${f(p)} fois plus.`),
      refus: fr(`Chaque chiffre doit valoir ${f(p)} fois plus : ${pluriel(k, "colonne")}.`),
      traces: Object.freeze([Object.freeze({apres: 1, attente: `${calcul.texte.replace(` = ${CASE}`, "")} = …`, texte: `${calcul.texte.replace(` = ${CASE}`, "")} = ${f(r)}`})])
    });
  }
  function m3Difficulte(calcul) {
    const {t} = calcul.donnees;
    return m3Rangs(calcul) * 1000 + (calcul.forme === "produit-gauche" ? 200 : 0) + t;
  }
  const M3_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "un rang de trop ou de moins",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.r * 10) || memeNombre(reponse, calcul.donnees.r / 10)),
      retour: (calcul, reponse) => {
        const {x, y, c1, c2, t, p, r} = calcul.donnees;
        return fr(`${f(reponse)} : un rang de ${reponse > r ? "trop" : "moins"}. ${f(x)} × ${f(y)} = ${c1} × ${c2} × ${f(p)} : chaque chiffre de ${t} vaut ${f(p)} fois plus.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "la table fausse",
      test: sauf((calcul, reponse) => {
        const {c1, c2, t, p} = calcul.donnees;
        const q = reponse / p;
        return Number.isInteger(q) && q !== t && [c1, c2].includes(Math.abs(q - t));
      }),
      retour: calcul => {
        const {c1, c2} = calcul.donnees;
        return fr(`La table d’abord : combien font ${c1} × ${c2} ?`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "additionné au lieu de multiplier",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.x + calcul.donnees.y)),
      retour: (calcul, reponse) => {
        const {x, y, c1, c2, p} = calcul.donnees;
        return fr(`${f(reponse)}, c’est ${f(x)} + ${f(y)}. Ici, on multiplie : ${c1} × ${c2}, puis × ${f(p)}.`);
      },
      gras: 0
    })
  ]);
  const chiffres29 = entre(2, 9);
  function m3Vivier(niveau) {
    const v = {produit: [], "produit-gauche": []};
    const ajouter = (x, y) => { const c = m3Calcul(niveau, x, y); v[c.forme].push(c); };
    if (niveau === 1) chiffres29.forEach(a => chiffres29.forEach(c => { ajouter(a, c * 10); ajouter(c * 10, a); }));
    if (niveau === 2) chiffres29.forEach(a => chiffres29.forEach(c => [100, 1000].forEach(q => { ajouter(a, c * q); ajouter(c * q, a); })));
    if (niveau === 3) {
      [[10, 10], [10, 100], [100, 10], [10, 1000], [1000, 10], [100, 100]].forEach(([q1, q2]) =>
        chiffres29.forEach(a => chiffres29.forEach(c => ajouter(a * q1, c * q2))));
      return Object.freeze({produit: [...v.produit, ...v["produit-gauche"]]});
    }
    return Object.freeze(v);
  }
  const M3_VIVIERS = Object.freeze({1: m3Vivier(1), 2: m3Vivier(2), 3: m3Vivier(3)});

  // Le dessin de J'écris d'M3 : le tableau à flèches, le nombre du haut
  // caché ; la table (8 × 4 = 32) l'écrit, la dernière égalité la rangée du
  // bas.
  function m3Dessins(calcul, etapes) {
    const aide = m3Aide(calcul);
    const rangs = [...chiffresParRangDe(calcul.donnees.r).keys()];
    const morceaux = [{haut: true}, {bas: true}];
    const dessin = (vus, revele = false) => {
      if (revele) return Object.freeze(m3Image(calcul));
      const haut = vus.some(m => m.haut) ? "trouve" : "cherche";
      return Object.freeze(Object.assign({}, aide, {haut, trouves: vus.some(m => m.bas) ? rangs : []}));
    };
    return dessinsDe(morceaux.slice(0, etapes), etapes, dessin);
  }
  // Les rangs des chiffres d'un entier (36 → 1, 0).
  function chiffresParRangDe(n) {
    const rangs = new Map();
    String(n).split("").reverse().forEach((c, rang) => rangs.set(rang, Number(c)));
    return rangs;
  }

  function m3Apprends({manipule, represente, ecris, consigne, consigneEcris, etapes, bilan}) {
    const glisse = m3Manipulation(manipule);
    return Object.freeze({
      exemple: exempleDe(manipule),
      manipule: Object.freeze({outil: "glisse", depart: glisse.depart, colonnes: glisse.colonnes, decalage: glisse.decalage, consigne: glisse.consigne, refus: glisse.refus, traces: glisse.traces}),
      represente: Object.freeze({
        outil: "tableau-fleches", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(m3Aide(represente)),
        solution: Object.freeze({image: m3Image(represente), phrase: m3Phrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        consigne: fr(consigneEcris),
        etapes: etapesEcris(etapes), reponse: ecris.reponse,
        solution: Object.freeze({image: m3Image(ecris), phrase: m3Phrase(ecris)})
      }, m3Dessins(ecris, etapes.length)),
      bilan: frBilan(bilan),
      image: Object.freeze(m3Image(manipule)),
      textes: Object.freeze([manipule.texte, represente.texte, ecris.texte])
    });
  }

  const M3 = {
    id: "M3", nom: "Tables étendues", exemple: "9 × 40",
    famille: "M", construit: true,
    aide_entraine: "tableau-fleches",
    erreurs: M3_ERREURS, image: m3Image, aide: m3Aide, phrase: m3Phrase, manipulation: m3Manipulation, difficulte: m3Difficulte,
    niveaux: [
      {
        n: 1, titre: "un chiffre × dizaines", nom: "Un chiffre × dizaines", palier: 1, type: "P",
        composer: vivierNiveau(M3_VIVIERS[1], [7, 3]),
        imposes: [m3Calcul(1, 6, 70), m3Calcul(1, 80, 7)],
        apprends: m3Apprends({
          manipule: m3Calcul(0, 9, 40),
          represente: m3Calcul(0, 6, 70),
          ecris: m3Calcul(0, 8, 40),
          consigne: "6 × 70 = 6 × 7 × 10",
          consigneEcris: "8 × 40 = 8 × 4 × 10",
          etapes: [["8 × 4 = ?", 32], ["8 × 40 = ?", 320]],
          bilan: "Pour 9 × 40, je fais la table : 9 × 4 = 36. Puis × 10 : chaque chiffre vaut 10 fois plus. 9 × 40 = 360."
        })
      },
      {
        n: 2, titre: "un chiffre × centaines, milliers", nom: "Un chiffre × centaines, milliers", palier: 2, type: "P",
        composer: vivierNiveau(M3_VIVIERS[2], [7, 3]),
        imposes: [m3Calcul(2, 9, 400), m3Calcul(2, 6, 3000)],
        apprends: m3Apprends({
          manipule: m3Calcul(0, 6, 300),
          represente: m3Calcul(0, 7, 400),
          ecris: m3Calcul(0, 3, 2000),
          consigne: "7 × 400 = 7 × 4 × 100",
          consigneEcris: `3 × 2${ESPACE_FINE}000 = 3 × 2 × 1${ESPACE_FINE}000`,
          etapes: [["3 × 2 = ?", 6], [`3 × 2${ESPACE_FINE}000 = ?`, 6000]],
          bilan: `6 × 300 = 6 × 3 × 100 : je fais la table, 18, puis chaque chiffre vaut 100 fois plus. 6 × 300 = 1${ESPACE_FINE}800.`
        })
      },
      {
        n: 3, titre: "dizaines, centaines, milliers entre eux", nom: "Dizaines, centaines, milliers entre eux", palier: 3, type: "P",
        composer: vivierNiveau(M3_VIVIERS[3], [1]),
        imposes: [m3Calcul(3, 90, 20), m3Calcul(3, 900, 700), m3Calcul(3, 3000, 20)],
        apprends: m3Apprends({
          manipule: m3Calcul(0, 90, 20),
          represente: m3Calcul(0, 400, 30),
          ecris: m3Calcul(0, 3000, 20),
          consigne: `400 × 30 = 4 × 3 × 1${ESPACE_FINE}000`,
          consigneEcris: `3${ESPACE_FINE}000 × 20 = 3 × 2 × 10${ESPACE_FINE}000`,
          etapes: [["3 × 2 = ?", 6], [`3${ESPACE_FINE}000 × 20 = ?`, 60000]],
          bilan: `90 × 20 = 9 × 2 × 100 : je fais la table, 18, puis chaque chiffre vaut 100 fois plus. 90 × 20 = 1${ESPACE_FINE}800.`
        })
      }
    ]
  };

  // Un module pas encore construit (« bientôt ») : son nom, son exemple,
  // ses niveaux avec leur palier et leur type.
  const reserve = (id, nom, exemple, niveaux) =>
    ({id, nom, exemple, famille: id[0], construit: false, niveaux: niveaux.map(niveau => Object.assign({}, niveau))});
  // Un identifiant réservé (palier 0, jamais affiché) : ses niveaux sans palier.
  const reserveSansPalier = (id, nom, exemple, nombre) =>
    reserve(id, nom, exemple, Array.from({length: nombre}, (_, i) => ({n: i + 1, palier: 0, type: "P"})));

  // Les 45 modules de la carte v2, dans l'ordre de ses tableaux, puis les 29
  // identifiants réservés.
  const MODULES = Object.freeze([
    A1,
    A10,
    A11,
    A2,
    A3,
    A4,
    A5,
    A6,
    A7,
    A8,
    reserve("A9", "Regrouper pour calculer", "27 + 48 + 73", [
      {n: 1, titre: "trois termes", palier: 3, type: "P", exemple: "27 + 48 + 73"},
      {n: 2, titre: "quatre termes", palier: 3, type: "P", exemple: "18 + 25 + 82 + 75"},
      {n: 3, titre: "avec des soustractions", palier: 4, type: "P", exemple: "524 − 44 + 176 − 56"},
      {n: 4, titre: "avec des décimaux", palier: 4, type: "P", exemple: "3,7 + 0,3 + 2,5 + 1,2"}
    ]),
    M4,
    M1,
    M2,
    M3,
    M5,
    M6,
    reserve("M13", "÷ 4, ÷ 8 : la moitié de la moitié", "140 ÷ 4", [
      {n: 1, titre: "÷ 4", palier: 3, type: "P", exemple: "140 ÷ 4"},
      {n: 2, titre: "÷ 8", palier: 3, type: "P", exemple: "360 ÷ 8"},
      {n: 3, titre: "résultat décimal", palier: 3, type: "P", exemple: "260 ÷ 8 = 32,5"}
    ]),
    reserve("M7", "× 5, × 50", "46 × 5", [
      {n: 1, titre: "× 5, nombre pair", palier: 2, type: "P", exemple: "46 × 5"},
      {n: 2, titre: "× 5, tout nombre jusqu’à 200", palier: 2, type: "P", exemple: "37 × 5"},
      {n: 3, titre: "× 50", palier: 3, type: "P", exemple: "24 × 50"}
    ]),
    M8,
    reserve("M9", "Distributivité : retrancher", "45 × 9", [
      {n: 1, titre: "× 9", palier: 4, type: "P", exemple: "45 × 9"},
      {n: 2, titre: "× 19, × 29", palier: 4, type: "P", exemple: "6 × 19"},
      {n: 3, titre: "× 99, × 98", palier: 4, type: "P", exemple: "7 × 99"}
    ]),
    reserve("M10", "Regrouper les facteurs", "5 × 43 × 2", [
      {n: 1, titre: "avec 2 et 5", palier: 2, type: "P", exemple: "5 × 43 × 2"},
      {n: 2, titre: "avec 4 et 25", palier: 3, type: "P", exemple: "4 × 37 × 25"},
      {n: 3, titre: "× 25 seul, moitié-double", palier: 4, type: "P", exemple: "16 × 25"}
    ]),
    reserve("M11", "Quotient et reste", "17 = 3 × 5 + ?", [
      {n: 1, titre: "tables de 2 à 5", palier: 3, type: "P", exemple: "17 = 3 × 5 + ?"},
      {n: 2, titre: "toutes les tables", palier: 3, type: "P", exemple: "47 = 6 × ? + 5"}
    ]),
    reserve("M12", "Diviser en décomposant", "240 ÷ 6", [
      {n: 1, titre: "dizaines, centaines entières ÷ un chiffre", palier: 2, type: "P", exemple: "240 ÷ 6"},
      {n: 2, titre: "quotient à deux chiffres", palier: 3, type: "P", exemple: "96 ÷ 8"},
      {n: 3, titre: "dividende à trois chiffres", palier: 4, type: "P", exemple: "536 ÷ 8"}
    ]),
    reserve("C1", "Parenthèses", "3 × (10 − 6)", [
      {n: 1, titre: "une paire", palier: 2, type: "P", exemple: "3 × (10 − 6)"},
      {n: 2, titre: "deux paires", palier: 3, type: "P", exemple: "(4 + 6) × (9 − 2)"},
      {n: 3, titre: "emboîtées", palier: 3, type: "P", exemple: "37 − (3 × (14 − 6))"}
    ]),
    reserve("C3", "Égalités à trou : + et −", "347 = 20 + ?", [
      {n: 1, titre: "trous simples", palier: 2, type: "P", exemple: "347 = 20 + ?"},
      {n: 2, titre: "garder l’égalité", palier: 2, type: "P", exemple: "144 + 7 = 142 + ?"},
      {n: 3, titre: "garder l’égalité, grands nombres", palier: 3, type: "P", exemple: "144 + 237 = ? + 239"}
    ]),
    reserve("C4", "Remonter un calcul", "(2 × ?) − 5 = 23", [
      {n: 1, titre: "deux opérations", palier: 3, type: "P", exemple: "(2 × ?) − 5 = 23"},
      {n: 2, titre: "réponse décimale", palier: 3, type: "P", exemple: "8 + (2 × ?) = 11"}
    ]),
    reserve("D1", "Écritures d’un décimal", "3 + 2/10", [
      {n: 1, titre: "dixièmes", palier: 2, type: "P", exemple: "3 + 2/10"},
      {n: 2, titre: "centièmes", palier: 2, type: "P", exemple: "712/100"},
      {n: 3, titre: "millièmes, sommes en désordre", palier: 3, type: "P", exemple: "4 + 107/1 000"}
    ]),
    D2,
    reserve("D3", "÷ 10, ÷ 100, ÷ 1 000", "45,2 ÷ 10", [
      {n: 1, titre: "÷ 10", palier: 2, type: "P", exemple: "45,2 ÷ 10"},
      {n: 2, titre: "÷ 100, ÷ 1 000", palier: 3, type: "P", exemple: "456 ÷ 100"},
      {n: 3, titre: "des zéros à écrire", palier: 3, type: "P", exemple: "0,6 ÷ 10"}
    ]),
    reserve("D4", "Ajouter ou retrancher des unités d’un rang", "4,45 + 0,3", [
      {n: 1, titre: "sans retenue", palier: 2, type: "P", exemple: "4,45 + 0,3"},
      {n: 2, titre: "millièmes, sans retenue", palier: 3, type: "P", exemple: "4,452 + 0,03"},
      {n: 3, titre: "avec retenue (ajouter)", palier: 3, type: "P", exemple: "4,45 + 0,8"}
    ]),
    reserve("D5", "Compléments à l’unité", "0,7 + ? = 1", [
      {n: 1, titre: "dixièmes, à l’entier suivant", palier: 3, type: "P", exemple: "0,7 + ? = 1"},
      {n: 2, titre: "centièmes", palier: 4, type: "P", exemple: "0,35 + ? = 1"}
    ]),
    reserve("D6", "Additionner deux décimaux", "4,5 + 1,2", [
      {n: 1, titre: "sans retenue", palier: 3, type: "P", exemple: "4,5 + 1,2"},
      {n: 2, titre: "avec retenue (moins de 10, un chiffre après la virgule)", palier: 3, type: "P", exemple: "2,7 + 3,7"},
      {n: 3, titre: "chiffres après la virgule différents", palier: 4, type: "P", exemple: "2,57 + 5,8"}
    ]),
    reserve("D7", "Soustraire deux décimaux", "5,8 − 2,3", [
      {n: 1, titre: "sans retenue", palier: 3, type: "P", exemple: "5,8 − 2,3"},
      {n: 2, titre: "avec retenue", palier: 4, type: "P", exemple: "3,4 − 0,8"},
      {n: 3, titre: "chiffres après la virgule différents", palier: 4, type: "P", exemple: "9 − 1,9"}
    ]),
    reserve("D8", "Doubles et moitiés de décimaux", "moitié de 9", [
      {n: 1, titre: "moitié des impairs jusqu’à 15", palier: 3, type: "F", exemple: "moitié de 9"},
      {n: 2, titre: "un chiffre après la virgule", palier: 3, type: "P", exemple: "double de 13,6"},
      {n: 3, titre: "deux chiffres après la virgule", palier: 3, type: "P", exemple: "2 × 4,35"}
    ]),
    reserve("D9", "Décimal × 5, × 50", "3,4 × 5", [
      {n: 1, titre: "× 5 (trois chiffres au plus)", palier: 3, type: "P", exemple: "3,4 × 5"},
      {n: 2, titre: "× 50 (nombre de moins de 20, au plus trois chiffres, chiffre le plus à droite pair)", palier: 3, type: "P", exemple: "50 × 12,4"}
    ]),
    reserve("F2", "Demis, quarts et unité", "1/2 + 1/2", [
      {n: 1, titre: "demis et quarts", palier: 2, type: "F", exemple: "1/2 + 1/2"},
      {n: 2, titre: "avec 3/4", palier: 3, type: "F", exemple: "3/4 + 1/4"}
    ]),
    reserve("F1", "Fractions usuelles et décimaux", "1/10 = ?", [
      {n: 1, titre: "1/10 et 1/100", palier: 2, type: "F", exemple: "1/10 = ?"},
      {n: 2, titre: "1/1 000, 1/2, 1/4, 3/4, 3/2, 4/2, 5/2 (dans les deux sens)", palier: 3, type: "F", exemple: "3/4 = ?"},
      {n: 3, titre: "cinquièmes", palier: 4, type: "F", exemple: "6/5 = ?"}
    ]),
    reserve("F3", "Fraction unitaire d’une quantité", "1/4 de 12 billes", [
      {n: 1, titre: "demi, quart, dixième", palier: 2, type: "P", exemple: "1/4 de 12 billes"},
      {n: 2, titre: "tiers, cinquième, sixième…", palier: 2, type: "P", exemple: "1/3 de 18 billes"},
      {n: 3, titre: "résultat non entier", palier: 2, type: "P", exemple: "1/4 de 10 m = 2,5 m"}
    ]),
    reserve("F4", "Fraction d’une quantité", "2/3 de 12 œufs", [
      {n: 1, titre: "résultat entier", palier: 3, type: "P", exemple: "2/3 de 12 œufs"},
      {n: 2, titre: "résultat décimal", palier: 4, type: "P", exemple: "3/4 de 10 m"}
    ]),
    reserve("F5", "Entier et fraction", "17/5 = 3 + ?/5", [
      {n: 1, titre: "décomposer", palier: 2, type: "P", exemple: "17/5 = 3 + ?/5"},
      {n: 2, titre: "décomposer et recomposer", palier: 2, type: "P", exemple: "2 + 2/3 = ?/3"},
      {n: 3, titre: "encadrer entre deux entiers", palier: 3, type: "P", exemple: "43/8 est entre 5 et ?"}
    ]),
    reserve("F6", "Fractions égales", "2/3 = ?/15", [
      {n: 1, titre: "en multipliant", palier: 2, type: "P", exemple: "2/3 = ?/15"},
      {n: 2, titre: "en divisant", palier: 3, type: "P", exemple: "12/16 = ?/4"},
      {n: 3, titre: "trou au dénominateur", palier: 3, type: "P", exemple: "4/7 = 28/?"}
    ]),
    reserve("F8", "Additionner, soustraire : même dénominateur", "3/7 + 3/7", [
      {n: 1, titre: "même dénominateur", palier: 2, type: "P", exemple: "3/7 + 3/7"},
      {n: 2, titre: "1 − a/b", palier: 2, type: "P", exemple: "1 − 2/3"},
      {n: 3, titre: "entier et fraction", palier: 3, type: "P", exemple: "3 + 2/5"}
    ]),
    reserve("F9", "Dénominateurs multiples", "3/2 + 7/4", [
      {n: 1, titre: "l’un est le double de l’autre", palier: 3, type: "P", exemple: "3/2 + 7/4"},
      {n: 2, titre: "multiple d’une table", palier: 3, type: "P", exemple: "4/7 − 2/21"}
    ]),
    reserve("F11", "Entier × fraction", "3 × 5/4", [
      {n: 1, titre: "addition répétée", palier: 3, type: "P", exemple: "3 × 5/4"},
      {n: 2, titre: "qui se simplifie", palier: 4, type: "P", exemple: "5 × 3/5"}
    ]),

    reserveSansPalier("D10", "× 0,1\u00a0; × 0,01\u00a0; × 0,001", "780 × 0,1", 3),
    reserveSansPalier("D11", "Produits liés aux tables", "0,6 × 7", 3),
    reserveSansPalier("D12", "Décimal × décimal", "0,4 × 0,3", 2),
    reserveSansPalier("D13", "× 0,5\u00a0; × 0,25\u00a0; × 1,5", "48 × 0,5", 3),
    reserveSansPalier("D14", "Diviser un décimal par un entier", "4,8 ÷ 4", 3),
    reserveSansPalier("D15", "Diviser par un décimal", "1,5 ÷ 0,3", 3),
    reserveSansPalier("F7", "Simplifier", "15/35", 3),
    reserveSansPalier("F10", "Dénominateurs quelconques", "2/5 + 1/4", 3),
    reserveSansPalier("F12", "Multiplier deux fractions", "2/3 × 5/7", 2),
    reserveSansPalier("F13", "Inverse et division", "5 ÷ 1/2", 3),
    reserveSansPalier("P1", "Pourcentage, fraction, décimal", "25 % = 1/?", 3),
    reserveSansPalier("P2", "50 %, 10 %, 1 %, 25 % d’un nombre", "10 % de 250", 3),
    reserveSansPalier("P3", "Pourcentages composés", "20 % de 120", 4),
    reserveSansPalier("P4", "× 1,1\u00a0; × 0,9\u00a0; × 1,2\u00a0; × 0,8", "800 × 1,1", 3),
    reserveSansPalier("R1", "Traverser zéro", "5 − 7", 2),
    reserveSansPalier("R2", "Additionner deux relatifs", "−3 + 7", 3),
    reserveSansPalier("R3", "Soustraire un relatif", "7 − (−5)", 3),
    reserveSansPalier("R4", "Sommes de plusieurs relatifs", "−3 + 7 − 5", 3),
    reserveSansPalier("R5", "Multiplier, diviser des relatifs", "−7 × 3", 4),
    reserveSansPalier("R6", "Somme ou produit\u00a0?", "−3 × (−5)", 2),
    reserveSansPalier("X1", "Carrés de 0 à 12", "7²", 3),
    reserveSansPalier("X2", "Puissances simples", "2³", 3),
    reserveSansPalier("X3", "Racines carrées", "√81", 2),
    reserveSansPalier("X4", "Puissances de 10", "10⁴", 3),
    reserveSansPalier("X5", "Exposants négatifs", "10⁻²", 4),
    reserveSansPalier("X6", "Notation scientifique", "4,58 × 10^?", 3),
    reserveSansPalier("X7", "Produits et quotients de puissances", "2³ × 2⁴", 3),
    reserveSansPalier("C2", "Priorités", "6 + 4 × 2", 4),
    reserveSansPalier("C5", "Factoriser pour calculer", "12 × 7 + 12 × 3", 3)
  ].map(fiche => Object.freeze(Object.assign({}, fiche, {
    niveaux: Object.freeze(fiche.niveaux.map(niveau => Object.freeze(Object.assign({}, niveau,
      niveau.imposes ? {imposes: Object.freeze(niveau.imposes.slice())} : {}))))
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
  // les textes ni les générateurs : les modules (ce qui est construit, le
  // palier et le type de chaque niveau) et l'ordre du parcours, compétence
  // par compétence.
  function carte() {
    return {
      modules: MODULES.map(fiche => ({
        id: fiche.id, niveaux: fiche.niveaux.length,
        paliers: fiche.niveaux.map(niveau => niveau.palier || 0),
        types: fiche.niveaux.map(niveau => niveau.type || "P"),
        construit: Boolean(fiche.construit)
      })),
      ordre: ORDRE.slice()
    };
  }

  // ------------------------------------------------------------------ les séries

  // La difficulté d'un calcul, pour le ranger du plus simple au plus dur
  // (0 quand le module n'en dit rien).
  function difficulte(calcul) {
    const fiche = calcul ? moduleDe(calcul.module) : null;
    return fiche && typeof fiche.difficulte === "function" ? fiche.difficulte(calcul) : 0;
  }

  // Une série d'un niveau. `genre` :
  //  - « valide » (mode professeur) : 12 calculs pour un fait, 10 pour une
  //    procédure, les imposés dedans, placés au hasard ;
  //  - « entraine » : jusqu'à 20 calculs sans imposé, rangés du plus simple
  //    au plus dur (`ordonne: false` les laisse mélangés), jamais ceux dont
  //    la clé est dans `exclure` (les calculs de « J'apprends »).
  // La même graine rend la même série.
  function genererSerie(cleNiveau, {graine = 1, genre = "entraine", total = null, ordonne = true, exclure = []} = {}) {
    const trouve = niveauDe(cleNiveau);
    if (!trouve || typeof trouve.niveau.composer !== "function") return [];
    const {niveau} = trouve;
    const rng = mulberry32(graine);
    const validation = genre === "valide";
    const nombre = total !== null ? total : validation ? TOTAUX[niveau.type] : TOTAUX.entraine;
    const imposes = validation ? niveau.imposes.slice(0, nombre) : [];
    // `exclure` : des clés ou des textes de calculs (ceux de « J'apprends »).
    const interdits = new Set(exclure);
    const garder = calcul => !interdits.has(calcul.cle) && !interdits.has(calcul.texte);
    const brut = niveau.composer(rng, nombre + interdits.size, imposes);
    // Les écritures du niveau, lues sur un grand tirage à part (un tirage
    // de 20 peut en manquer une).
    const formes = [...new Set(niveau.composer(mulberry32((graine ^ 0x9e3779b9) >>> 0), 60, []).map(calcul => calcul.forme))];
    const serie = melanger(rng, brut).filter(garder).slice(0, nombre);
    // Un vivier trop petit (A2-2 : 19 nombres), une écriture entièrement
    // exclue ou tombée hors des 20 premiers : on complète par d'autres
    // tirages, sans redonner un calcul déjà là, jusqu'au nombre voulu et à
    // toutes les écritures du niveau.
    const manque = () => serie.length < nombre || formes.some(forme => !serie.some(calcul => calcul.forme === forme));
    for (let essai = 0; essai < 4 && manque(); essai += 1) {
      const deja = new Set(serie.map(calcul => calcul.cle));
      melanger(rng, niveau.composer(rng, nombre, [])).filter(calcul => garder(calcul) && !deja.has(calcul.cle)).forEach(calcul => {
        if (serie.length < nombre) { serie.push(calcul); deja.add(calcul.cle); return; }
        if (serie.some(c => c.forme === calcul.forme)) return;
        // Une écriture manque encore : elle prend la place du dernier calcul
        // de l'écriture la plus présente.
        const comptes = serie.reduce((m, c) => m.set(c.forme, (m.get(c.forme) || 0) + 1), new Map());
        const pleine = [...comptes.entries()].sort((p, q) => q[1] - p[1])[0][0];
        serie.splice(serie.map(c => c.forme).lastIndexOf(pleine), 1, calcul);
        deja.add(calcul.cle);
      });
    }
    if (validation || !ordonne) return serie;
    return ordonnerSerie(serie);
  }

  // Du plus simple au plus dur, et les écritures nouvelles en fin de série,
  // annoncées : les 6 premiers calculs de la première écriture, puis 2 de
  // chaque autre écriture (« ? + 56 = 100 », puis « 100 − 34 »), puis le
  // reste par difficulté. L'élève rapide (5 justes de suite) voit ainsi
  // chaque écriture au moins une fois en une dizaine de calculs.
  const ORDRE_SERIE = Object.freeze({premiere: 6, nouvelles: 2});
  function ordonnerSerie(calculs) {
    const tries = calculs.map((calcul, rang) => ({calcul, rang})).sort((a, b) => difficulte(a.calcul) - difficulte(b.calcul) || a.rang - b.rang).map(({calcul}) => calcul);
    const formes = [...new Set(tries.map(calcul => calcul.forme))];
    if (formes.length < 2) return tries;
    const pris = new Set();
    const prendre = (forme, nombre) => tries.filter(calcul => calcul.forme === forme && !pris.has(calcul)).slice(0, nombre).map(calcul => { pris.add(calcul); return calcul; });
    const debut = prendre(formes[0], ORDRE_SERIE.premiere);
    const nouvelles = formes.slice(1).flatMap(forme => prendre(forme, ORDRE_SERIE.nouvelles));
    return [...debut, ...nouvelles, ...tries.filter(calcul => !pris.has(calcul))];
  }

  // Le test d'entrée en escalier (« Tu connais déjà ? ») : une marche par
  // niveau, trois calculs par marche, sans imposé — le plus simple, puis le
  // plus dur, puis celui du milieu qui départage. Chaque calcul porte son
  // niveau. Rend [{niveau, calculs}].
  function genererTest(id, {graine = 1} = {}) {
    const fiche = moduleDe(id);
    if (!fiche || !fiche.construit) return [];
    return fiche.niveaux.map(niveau => {
      const serie = genererSerie(`${id}-${niveau.n}`, {graine: (graine + niveau.n * 7919) >>> 0, genre: "entraine", total: 12, ordonne: false})
        .map((calcul, rang) => ({calcul, rang})).sort((a, b) => difficulte(a.calcul) - difficulte(b.calcul) || a.rang - b.rang).map(({calcul}) => calcul);
      const calculs = serie.length < 3 ? serie : [serie[0], serie[serie.length - 1], serie[Math.floor(serie.length / 2)]];
      return {niveau: niveau.n, calculs};
    });
  }

  // Un seul calcul d'un niveau (Mes calculs du jour en tirent un par
  // compétence), tiré au hasard dans le niveau — pas le plus simple.
  // `tour` (un entier, le jour) choisit l'écriture à tour de rôle : d'un
  // retour à l'autre, « 37 + ? = 100 », puis « ? + 37 = 100 », puis
  // « 100 − 37 »… (31/10).
  function genererUn(cleNiveau, graine, {tour = null} = {}) {
    const serie = genererSerie(cleNiveau, {graine, genre: "entraine", total: TOTAUX.P, ordonne: false});
    if (!serie.length) return null;
    if (!Number.isInteger(tour)) return serie[0];
    const formes = [...new Set(serie.map(calcul => calcul.forme))].sort();
    const voulue = formes[((tour % formes.length) + formes.length) % formes.length];
    return serie.find(calcul => calcul.forme === voulue) || serie[0];
  }

  // L'outil du début de l'entraînement, et ce qui revient après une erreur
  // (la droite dessinée avec ses sauts « + ? », le tableau avec ses « ? ») ;
  // null quand le module n'en a pas.
  function aideDe(calcul) {
    const fiche = calcul ? moduleDe(calcul.module) : null;
    return fiche && typeof fiche.aide === "function" ? fiche.aide(calcul) : null;
  }

  // L'outil à manipuler pour un calcul (les perles, le glisse-nombres), après
  // deux erreurs de suite à l'entraînement ; null quand il n'y en a pas
  // (compléments à 1 000 : au-delà des 100 perles).
  function manipulationDe(calcul) {
    const fiche = calcul ? moduleDe(calcul.module) : null;
    const manipulation = fiche && typeof fiche.manipulation === "function" ? fiche.manipulation(calcul) : null;
    return manipulation || null;
  }

  // Quand l'écriture change dans l'entraînement (« ? + 56 = 100 » après des
  // « 56 + ? = 100 ») : la famille d'écriture d'un calcul, et ce qu'on
  // annonce quand elle arrive.
  const ANNONCES = Object.freeze({
    "complement-gauche": "la case est devant",
    difference: "c’est une soustraction",
    somme: "c’est une addition",
    "ecart-trou": "on cherche ce qu’on a retiré",
    "produit-gauche": "les facteurs ont changé de place",
    "trou-facteur": "on cherche par combien on a multiplié",
    "trou-egal": "l’égalité est écrite à l’envers",
    "trou-nombre": "on cherche le nombre de départ",
    "trou-nombre-gauche": "on cherche le nombre de départ",
    division: "c’est une division",
    complement: "on cherche le nombre qui manque",
    "complement-egal": "l’égalité est écrite à l’envers",
    moitie: "on cherche la moitié",
    "trou-double": "on cherche le nombre qu’on a doublé",
    "double-fois": "le double s’écrit avec «\u00a0×\u00a0»"
  });
  function annonceDe(calcul) {
    return calcul && ANNONCES[calcul.forme] ? `Nouveau\u00a0: ${ANNONCES[calcul.forme]}.` : "Nouveau\u00a0: c’est écrit autrement.";
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
    // Le pas en gras : fixé par la cause, ou calculé (A4, A7 : le saut qui
    // passe la centaine).
    const gras = typeof cause.grasDe === "function" ? cause.grasDe(calcul) : cause.gras || 0;
    return {c: cause.c, nom: cause.nom, texte: cause.retour(calcul, reponse, ecrit), image: fiche.image(calcul, gras)};
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
    ORDRE,
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
    difficulte,
    genererSerie,
    genererTest,
    genererUn,
    aideDe,
    manipulationDe,
    annonceDe,
    diagnostiquer,
    imageDe,
    tableARevoir,
    a2Sauts
  });
});
