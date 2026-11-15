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

  // Les ceintures (lot 4, 14/11/2026, choix de Gwenaël) : une par palier
  // fini, comme au judo ; tout le monde part en ceinture blanche. Les
  // couleurs sont celles de maths&go (le dégradé du site : or #f9bf3b,
  // orange #f58220, bleu #0b67b2 ; le vert de l'appli #147447). Le nom est
  // toujours écrit à côté du dessin : imprimés en noir et blanc, la verte
  // et la bleue se ressemblent.
  const CEINTURES = Object.freeze([
    Object.freeze({n: 0, nom: "Ceinture blanche", court: "blanche", couleur: "#ffffff"}),
    Object.freeze({n: 1, nom: "Ceinture jaune", court: "jaune", couleur: "#f9bf3b"}),
    Object.freeze({n: 2, nom: "Ceinture orange", court: "orange", couleur: "#f58220"}),
    Object.freeze({n: 3, nom: "Ceinture verte", court: "verte", couleur: "#147447"}),
    Object.freeze({n: 4, nom: "Ceinture bleue", court: "bleue", couleur: "#0b67b2"})
  ]);

  // Le dessin d'une ceinture nouée (SVG en texte : la page, la tuile de Mon
  // espace et la page du professeur le posent tel quel). `barrettes` : 0 à
  // 3, des bandes blanches bordées d'encre sur le pan droit, comme les
  // barrettes du judo. `vide` : une ceinture pas encore gagnée, en
  // pointillés gris. `taille` : la largeur en pixels (hauteur 5/8).
  function formeCeinture(n, {barrettes = 0, vide = false, taille = 64, titre = ""} = {}) {
    const ceinture = CEINTURES[Math.max(0, Math.min(CEINTURES.length - 1, Math.floor(Number(n) || 0)))];
    const largeur = Math.max(8, Math.min(400, Math.round(Number(taille) || 64)));
    const nombre = vide ? 0 : Math.max(0, Math.min(3, Math.floor(Number(barrettes) || 0)));
    const racine = {"class": "ceinture", viewBox: "0 0 64 40", width: String(largeur), height: String(Math.round(largeur * 40 / 64)), focusable: "false"};
    if (titre) { racine.role = "img"; racine["aria-label"] = String(titre); } else racine["aria-hidden"] = "true";
    const groupe = {fill: vide ? "#ffffff" : ceinture.couleur, stroke: vide ? "#9fb4c4" : "#143451", "stroke-width": "1.7", "stroke-linejoin": "round"};
    if (vide) groupe["stroke-dasharray"] = "3 2.4";
    const pans = [
      ["path", {d: "M27 17L33 18.5L23.5 37.5L16.5 35.5Z"}], ["path", {d: "M31 18.5L37 17L47.5 35.5L40.5 37.5Z"}],
      ["rect", {x: "2", y: "9", width: "60", height: "9", rx: "2.2"}], ["rect", {x: "24.5", y: "5.5", width: "15", height: "15.5", rx: "3"}]
    ];
    const bandes = [];
    for (let k = 0; k < nombre; k += 1) {
      const t = .44 + k * .16;
      const cx = 34 + 10 * t;
      const cy = 18 + 18.5 * t;
      const [px, py] = [.889 * 4.6, -.457 * 4.6];
      const trait = (f, epaisseur, couleur) => ["path", {d: `M${(cx - px * f).toFixed(2)} ${(cy - py * f).toFixed(2)}L${(cx + px * f).toFixed(2)} ${(cy + py * f).toFixed(2)}`, stroke: couleur, "stroke-width": epaisseur}];
      bandes.push(trait(1, "3.6", "#143451"), trait(.82, "1.6", "#ffffff"));
    }
    return {racine, groupe, pans, bandes};
  }

  // Le dessin en texte SVG (la page de l'appli, les planches) : rien que des
  // nombres bornés et les couleurs ci-dessus ; le titre est échappé.
  function dessinCeinture(n, options = {}) {
    const {racine, groupe, pans, bandes} = formeCeinture(n, options);
    const echapper = valeur => String(valeur).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
    const attributs = objet => Object.keys(objet).map(cle => ` ${cle}="${echapper(objet[cle])}"`).join("");
    const element = ([nom, objet]) => `<${nom}${attributs(objet)}/>`;
    return `<svg${attributs(racine)}><g${attributs(groupe)}>${pans.map(element).join("")}</g>${bandes.map(element).join("")}</svg>`;
  }

  // Le même dessin en éléments (createElementNS, aucun HTML) : pour la page
  // du professeur et la tuile de Mon espace, où rien ne passe par innerHTML.
  function elementCeinture(doc, n, options = {}) {
    const {racine, groupe, pans, bandes} = formeCeinture(n, options);
    const NS = "http://www.w3.org/2000/svg";
    const creer = (nom, objet) => {
      const noeud = doc.createElementNS(NS, nom);
      Object.keys(objet).forEach(cle => noeud.setAttribute(cle, objet[cle]));
      return noeud;
    };
    const svg = creer("svg", racine);
    const g = creer("g", groupe);
    pans.forEach(([nom, objet]) => g.appendChild(creer(nom, objet)));
    svg.appendChild(g);
    bandes.forEach(([nom, objet]) => svg.appendChild(creer(nom, objet)));
    return svg;
  }

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

  const ESPACE_FINE = " ";

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

  // Niveau 4 : à 1\u00a0000 sur des dizaines entières, et à la centaine suivante.
  // Lot « couverture » (06/11/2026) : aussi à une centaine plus loin, depuis
  // des dizaines entières (180 + ? = 300, calcul de l'ancienne appli).
  function a2Niveau4(rng, total, imposes) {
    const [versMille, suivantes, loin] = repartir(total, [6, 2, 2]);
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
    // Les formes des calculs vers 1\u00a0000 : 4 compléments, 1 complément à
    // gauche, 2 différences (l'imposé « 650 + ? = 1\u00a0000 » est un complément).
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
    // Une centaine plus loin : de 110 à 880 (pas une centaine entière), vers
    // la 2e à la 4e centaine d'après, sans dépasser 1\u00a0000.
    const plusLoin = tirerDistincts(rng, loin, r => {
      let n = entierEntre(r, 11, 58) * 10;
      while (n % 100 === 0) n = entierEntre(r, 11, 58) * 10;
      return n;
    }, [...dejaLa, ...nombres]).map((n, i) => {
      const cible = centaineSuivante(n) + 100 * (1 + (n / 10) % 3);
      return i % 2 === 0 ? a2Complement(4, n, cible) : a2Difference(4, n, cible);
    });
    return [...tires, ...aSuivre, ...plusLoin, ...imposes];
  }

  // Niveau 5 (lot « couverture », CM1) : compléter un nombre quelconque —
  // les unités ne sont pas nulles — jusqu'à la centaine suivante
  // (266 + ? = 300), jusqu'à 1\u00a0000 (368 + ? = 1\u00a0000), jusqu'au
  // millier suivant (2\u00a0371 + ? = 3\u00a0000) ou jusqu'à une centaine plus
  // loin (748 + ? = 1\u00a0200). Programme de cycle 3 (« compléments à la
  // centaine »), progression de CM1 (273 → 300 ; 2\u00a0371 → 3\u00a0000),
  // égalités à trous de CM1 (748 + ? = 1\u00a0200). Sur la droite : la
  // dizaine, la centaine, puis le bout (trois sauts au plus).
  function a2Niveau5(rng, total, imposes) {
    const [suivantes, mille, milliers, loin] = repartir(total, [3, 3, 2, 2]);
    const dejaLa = new Set(imposes.map(c => c.donnees.a));
    const pris = new Set(imposes.map(c => c.cle));
    // Un nombre aux unités non nulles, à plus de 10 de la centaine suivante
    // (sinon c'est A2-1).
    const quelconque = (r, de, a) => {
      let n = entierEntre(r, de, a);
      while (n % 10 === 0 || centaineSuivante(n) - n <= 10 || dejaLa.has(n)) n = entierEntre(r, de, a);
      return n;
    };
    const liste = [];
    const ajouter = (nombre, tirer) => {
      let essais = 0;
      while (nombre > 0 && essais < 500) {
        essais += 1;
        const calcul = tirer(rng);
        if (pris.has(calcul.cle)) continue;
        pris.add(calcul.cle);
        dejaLa.add(calcul.donnees.a);
        liste.push(calcul);
        nombre -= 1;
      }
    };
    const imposesDe = test => imposes.filter(test).length;
    // Deux calculs sur dix s'écrivent « 300 − 266 = ? », un « ? + 266 = 300 »
    // (à leur place dans la série, plus bas).
    const forme = (r, a, cible) => a2Complement(5, a, cible);
    ajouter(suivantes - imposesDe(c => c.donnees.cible === centaineSuivante(c.donnees.a)), r => {
      const a = quelconque(r, 101, 889);
      return forme(r, a, centaineSuivante(a));
    });
    ajouter(mille - imposesDe(c => c.donnees.cible === 1000), r => forme(r, quelconque(r, 101, 889), 1000));
    ajouter(milliers - imposesDe(c => c.donnees.cible > 1000 && c.donnees.cible % 1000 === 0), r => {
      const millier = entierEntre(r, 1, 8) * 1000;
      const a = quelconque(r, millier + 101, millier + 889);
      return forme(r, a, millier + 1000);
    });
    ajouter(loin - imposesDe(c => c.donnees.cible % 1000 !== 0 && c.donnees.cible !== centaineSuivante(c.donnees.a)), r => {
      const a = quelconque(r, 101, 889);
      let cible = centaineSuivante(a) + 100 * entierEntre(r, 1, 5);
      if (cible % 1000 === 0) cible += 100;
      return forme(r, a, cible);
    });
    const ecrite = liste.map((c, i) => {
      const {a, cible} = c.donnees;
      return i % 10 === 1 || i % 10 === 6 ? a2Difference(5, a, cible) : i % 10 === 3 ? a2Gauche(5, a, cible) : c;
    });
    return [...ecrite, ...imposes];
  }

  // Les sauts d'un complément : jusqu'à la dizaine suivante (si les unités
  // ne sont pas nulles), jusqu'à la centaine suivante, puis jusqu'à la
  // cible ; on ne s'arrête qu'avant la cible. Un seul saut quand il n'y a
  // rien à passer (433 → 440 ; 230 → 300). Lot « couverture » : jusqu'à
  // trois sauts (748 → 750 → 800 → 1\u00a0200) ; pour les niveaux 1 à 4, les
  // mêmes sauts qu'avant (37 → 40 → 100 ; 730 → 800 → 1\u00a0000).
  // `paliers` : les arrêts ; `palier` : le premier (ou null).
  function a2Sauts(calcul) {
    const {a, cible} = calcul.donnees;
    const paliers = [];
    if (cible !== 10) {
      [10, 100].forEach(pas => {
        const depart = paliers.length ? paliers[paliers.length - 1] : a;
        if (depart % pas === 0) return;
        const arret = (Math.floor(depart / pas) + 1) * pas;
        if (arret < cible) paliers.push(arret);
      });
    }
    const points = [a, ...paliers, cible];
    return {palier: paliers.length ? paliers[0] : null, paliers, sauts: points.slice(1).map((x, i) => x - points[i])};
  }

  // Le rang perdu ou ajouté de trop dans une erreur de complément : 10 vers
  // 100 (et depuis un nombre aux unités non nulles), 100 vers 1\u00a0000
  // depuis des dizaines entières.
  const a2Rang = calcul => {
    const {a, cible} = calcul.donnees;
    if ([100, 1000, 10000].includes(cible)) return cible / 10;
    return a % 10 ? 10 : 100;
  };
  // Le chemin en mots : « 750, puis à 800, puis à 1 200 ».
  const a2Chemin = calcul => [...a2Sauts(calcul).paliers, calcul.donnees.cible].map(formaterNombre).join(", puis à ");

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
        const {palier} = a2Sauts(calcul);
        return palier !== null && memeNombre(reponse, calcul.reponse + a2Rang(calcul));
      },
      retour: (calcul, reponse) => {
        const {a} = calcul.donnees;
        return `${formaterNombre(a)} + ${formaterNombre(reponse)} = ${formaterNombre(a + reponse)}, c’est trop. Va d’abord à ${a2Chemin(calcul)}.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 4, nom: "arrêt au premier saut",
      test: (calcul, reponse) => a2Sauts(calcul).paliers.some(p => memeNombre(reponse, p - calcul.donnees.a)),
      retour: (calcul, reponse) => {
        const {a, cible} = calcul.donnees;
        const palier = formaterNombre(a + reponse);
        return `${formaterNombre(a)} + ${formaterNombre(reponse)} = ${palier}, tu n’es pas encore à ${formaterNombre(cible)}. Continue\u00a0: de ${palier} à ${formaterNombre(cible)}.`;
      },
      gras: 2
    }),
    Object.freeze({
      c: 2, nom: "une dizaine (centaine) perdue",
      test: (calcul, reponse) => {
        const {cible, suivante} = calcul.donnees;
        if (suivante || cible === 10) return false;
        return memeNombre(reponse, calcul.reponse - a2Rang(calcul)) && reponse > 0;
      },
      retour: (calcul, reponse) => {
        const {a, cible} = calcul.donnees;
        const {paliers} = a2Sauts(calcul);
        const depart = paliers.length ? paliers[paliers.length - 1] : a;
        return `${formaterNombre(a)} + ${formaterNombre(reponse)} = ${formaterNombre(a + reponse)}. Il manque ${formaterNombre(a2Rang(calcul))}\u00a0: de ${formaterNombre(depart)} à ${formaterNombre(cible)}, c’est + ${formaterNombre(cible - depart)}.`;
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
    const {paliers} = a2Sauts(calcul);
    const etape = (texte, reponse) => Object.freeze({texte, reponse});
    if (!paliers.length) return Object.freeze([etape(`${formaterNombre(a)} + ${CASE} = ${formaterNombre(cible)}`, cible - a)]);
    const points = [a, ...paliers, cible];
    return Object.freeze([
      ...points.slice(1).map((x, i) => etape(`${formaterNombre(points[i])} + ${CASE} = ${formaterNombre(x)}`, x - points[i])),
      etape(`${formaterNombre(a)} + ${CASE} = ${formaterNombre(cible)}`, cible - a)
    ]);
  }

  function a2Phrase(calcul) {
    const {a, cible} = calcul.donnees;
    const {paliers, sauts} = a2Sauts(calcul);
    if (!paliers.length) return `De ${formaterNombre(a)} à ${formaterNombre(cible)}, c’est + ${formaterNombre(cible - a)}.`;
    return `Regarde\u00a0: ${sauts.map(formaterNombre).join(" puis ")}, ça fait ${formaterNombre(cible - a)}.`;
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
          const place = nombres.findIndex(n => !a5Passage(n) && n < 1000);
          if (place >= 0) nombres[place] = p;
        });
        nombres = melanger(rng, nombres);
      }
      // Lot « couverture » : le champ du CE2 va jusqu'à 10 000 (4 510 + 19) :
      // un nombre de départ sur dix à 4 chiffres, aux niveaux 1 à 3.
      // (Au niveau 1, jamais à la place d'un passage de centaine.)
      if (niveau <= 3) {
        for (let bloc = 0; bloc * 10 + 3 < nombres.length; bloc += 1) {
          const j = nombres.findIndex((n, i) => i >= bloc * 10 + 3 && i < bloc * 10 + 10 && !(niveau === 1 && a5Passage(n)));
          if (j >= 0) nombres[j] = tirerDistincts(rng, 1, r => entierEntre(r, 1001, 9899), nombres)[0] || nombres[j];
        }
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

  // Lot 7-0 (14/11/2026, choix de Gwenaël : « le dessin à étapes ») : avec
  // la droite à plusieurs sauts, l'élève écrit d'abord OÙ IL ARRIVE APRÈS LE
  // PREMIER SAUT (la dizaine, la centaine…), puis le résultat — comme « Je
  // représente à étapes » des doubles. Avant, il voyait les sauts mais ne
  // tapait que le résultat : plus dur que J'écris, qui guide étape par
  // étape. Les sauts restent écrits (« + 1 », « + 3 ») ; les points
  // d'arrivée sont les « ? ».
  //  - un ajout ou un retrait (59 + 3 : + 1 puis + 2) : « 59 + 1 = □ » (60),
  //    puis « 59 + 3 = □ » (62) ; le point trouvé s'écrit en vert ;
  //  - un trou (436 + ? = 500 ; 61 − 59 ; 2 003 − ? = 1 999) : les points
  //    sont déjà écrits, les sauts disent « + ? » — le premier saut
  //    (« 436 + □ = 440 », 4), puis le résultat ; le saut trouvé s'écrit.
  // Rend {etapes [{texte, reponse}], dessins [3 dessins : rien, la première
  // case, tout], premier (la première case donnée, sans vert), revele (la
  // réponse donnée)}, ou null (pas de droite à sauts, un seul saut).
  function dessinAEtapes(image, texte, reponse) {
    if (!image || image.outil !== "droite-sauts" || !Array.isArray(image.sauts) || image.sauts.length < 2) return null;
    if (typeof texte !== "string" || !texte.includes(CASE) || !Number.isFinite(reponse) || !Number.isFinite(image.depart)) return null;
    const depart = image.depart;
    const n = image.sauts.length;
    const premier = image.sauts[0].val;
    const trou = image.sauts.some(saut => saut.masque);
    const arrivee = Number((depart + premier).toFixed(6));
    if (trou && !(premier > 0)) return null;
    const etape = trou
      ? {texte: `${formaterNombre(depart)} + ${CASE} = ${formaterNombre(arrivee)}`, reponse: premier}
      : {texte: `${formaterNombre(depart)} ${premier < 0 ? "−" : "+"} ${formaterNombre(Math.abs(premier))} = ${CASE}`, reponse: arrivee};
    const etapes = [etape, {texte, reponse}].map(e => Object.freeze(e));
    const avec = plus => Object.freeze(Object.assign({}, image, plus));
    const points = Array.from({length: n}, (_, i) => i + 1);
    const inconnues = Array.isArray(image.inconnues) ? image.inconnues : points;
    const dessins = trou
      ? [avec({}),
        avec({sauts: image.sauts.map((saut, i) => (i === 0 ? {val: saut.val} : saut))}),
        avec({sauts: image.sauts.map(saut => ({val: saut.val}))})]
      : [avec({}),
        avec({inconnues: inconnues.filter(i => i !== 1), acquis: [1]}),
        avec({inconnues: [], acquis: [1, n]})];
    const premierDonne = trou ? dessins[1] : avec({inconnues: inconnues.filter(i => i !== 1), acquis: []});
    const revele = trou ? dessins[2] : avec({inconnues: [], acquis: [n]});
    return Object.freeze({etapes: Object.freeze(etapes), dessins: Object.freeze(dessins), premier: premierDonne, revele});
  }

  // « Je représente » (on te montre) sur une droite à plusieurs sauts
  // devient « Je représente à étapes » (lot 7-0) : il se joue comme celui
  // des doubles (ses étapes, ses dessins), sous sa consigne.
  function representeAEtapes(apprends) {
    const represente = apprends && apprends.represente;
    // Avec un outil à manipuler, « On te montre » est le geste : le dessin
    // ne s'y joue pas (il vient avec les calculs qui changent).
    if (!represente || represente.etapes || apprends.manipule) return apprends;
    const etapes = dessinAEtapes(represente.image, represente.texte, represente.reponse);
    if (!etapes) return apprends;
    return Object.freeze(Object.assign({}, apprends, {
      represente: Object.freeze(Object.assign({}, represente, {etapes: etapes.etapes, dessins: etapes.dessins}))
    }));
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

  // Le tableau à flèches (M2, D2, D3) : l'étape écrit tout le nombre (modules
  // lot 5, décision du 04/11 : J'écris de D2 et D3 en une seule étape, tous
  // les chiffres glissent ensemble) ; un trou (35 × □ = 3 500) : l'étiquette
  // « × 100 ».
  function tableauDessins(aide, solution, etapes) {
    const rangs = Array.from({length: 13}, (_, i) => 6 - i);
    const morceaux = etapes.map(() => (aide.masque ? {etiquette: true} : {rangs}));
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
      // Relecture 1 : au-dessus du dessin, le calcul cherché et son détour.
      ecris: ecrisAvecDessins({
        consigne: `${formaterNombre(cE.donnees.n)} + ${a} = ${formaterNombre(cE.donnees.n)} + ${r} − ${d}`,
        etapes: a5Etapes(cE), reponse: cE.reponse,
        solution: Object.freeze({image: a5Image(cE), phrase: a5Phrase(cE)})
      }, droiteDessins({depart: cE.donnees.n, sauts: [r, -d], direct: a, trou: false, etapes: 3})),
      bilan,
      image: Object.freeze({outil: "droite-sauts", depart: premier.donnees.n, sauts: [{val: r}, {val: -d}], direct: a, acquis: [2]}),
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: premier, ecris: cE}),
      textes: Object.freeze([premier.texte, cR.texte, cE.texte])
    });
  }

  // Les trois temps d'un niveau d'A2, sur trois calculs différents : les
  // perles sur le premier (niveau 4 : pas de perles au-delà de 100), la
  // droite dessinée avec ses sauts « + ? » sur le deuxième, les étapes à
  // remplir sur le troisième.
  function a2Apprends({manipule, represente, ecris, consigne, consigneManipule, bilan, imageRetenir = null}) {
    const calculDe = ({a, cible}) => a2Complement(0, a, cible, cible === dizaineSuivante(a) || cible === centaineSuivante(a) ? {suivante: true} : {});
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
      // Relecture 1 : le complément cherché, avec son « ? » (jamais la
      // réponse) ; avec une seule étape, rien : c'est déjà la ligne écrite.
      ecris: ecrisAvecDessins(Object.assign({
        etapes: a2Etapes(cE), reponse: cE.reponse,
        solution: Object.freeze({image: a2Image(cE), phrase: a2Phrase(cE)})
      }, a2Etapes(cE).length > 1 ? {consigne: cE.texte.replace(CASE, "?")} : {}), a2Dessins(cE)),
      bilan,
      // Relecture 2 : A2-2 retient les paires de dizaines (comme A1-1).
      // Lot 3a : sinon, le calcul montré.
      image: Object.freeze(imageRetenir || a2Image(premier)),
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: premier, ecris: cE}),
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
  const PUISSANCES_CE2 = Object.freeze([10, 100]);
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
    // Lot 7e (programme du CE2 : × 10, × 100, résultats jusqu'à 10 000 ;
    // × 1 000 au CM1, niveau 2) : un nombre à 3 chiffres n'est multiplié
    // que par 10.
    return [...nombres.map((n, i) => produit("M2", 1, n, n >= 100 ? 10 : choisir(rng, PUISSANCES_CE2), aGauche[i])), ...imposes];
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
  // Les modules à virgule du glisse-nombres : D2 (× 10, × 100, × 1 000) et
  // D3 (÷ 10, ÷ 100, ÷ 1 000, modules lot 5).
  const AVEC_VIRGULE = new Set(["D2", "D3"]);
  function tableauDe(calcul) {
    const {n, p, m} = calcul.donnees;
    const virgule = AVEC_VIRGULE.has(calcul.module);
    if (calcul.forme === "division") return {outil: "tableau-fleches", depart: m, arrivee: n, p, operation: "÷", virgule};
    return {outil: "tableau-fleches", depart: n, arrivee: m, p, operation: "×", virgule};
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

  // Niveau 1 : × 10. 5 nombres à 1 décimale, 5 à 2 ; 2 sous 1 (0,6) ;
  // « 10 × n » sur 2 calculs. (Lot 7e : au CM1, deux chiffres après la
  // virgule au plus — programme du cycle 3 ; les millièmes au CM2.)
  function d2Niveau1(rng, total, imposes) {
    const parts = repartir(total, [5, 5]);
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
    // Les zéros à écrire : ceux d'un produit de D2 (3,6 × 100), ceux d'un
    // quotient sous 1 de D3 (0,6 ÷ 10 = 0,06).
    const zeros = calcul.module === "D2" && estProduit(calcul) ? Math.max(0, colonnesDe(p) - decimalesDe(n))
      : calcul.module === "D3" && n < 1 ? decimalesDe(n) - decimalesDe(calcul.donnees.m) : 0;
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
      return {outil: "tableau-fleches", depart: m, arrivee: n, p, operation: "÷", virgule: AVEC_VIRGULE.has(calcul.module), inconnue: true};
    }
    return Object.assign({}, image, {inconnue: true});
  }

  // Le glisse-nombres d'un calcul de M2 ou D2 : le nombre de départ dans la
  // bande, et le glissement attendu. Sur un trou de la puissance, on glisse
  // jusqu'à lire l'arrivée.
  function glisseManipulation(calcul) {
    const {n, p, m} = calcul.donnees;
    const colonnes = AVEC_VIRGULE.has(calcul.module) ? COLONNES_D2 : COLONNES_M2;
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
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: calcul, ecris: ecris.calcul}),
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
  // Lot « couverture » (06/11/2026) : la carte v3 — 125 compétences.
  // Paliers croissants, opérations alternées ; les fractions de CE1-CE2 au
  // palier 1, A2-5 et F9-1 au palier 2, A8-3 et F5-3 réunis à A8-2 et F5-2,
  // A9 et M9 en deux niveaux.
  const ORDRE = Object.freeze([
    // palier 1 : 40 compétences
    "A1-1", "A1-2", "A1-3", "A10-1", "A11-1", "M1-1", "A10-2", "A11-2", "A2-1", "A3-1",
    "M4-1", "A2-2", "M2-1", "A4-1", "A4-2", "A5-1", "A6-1", "M4-2", "A2-3", "A3-2",
    "F8-1", "A7-1", "M1-2", "A10-3", "A11-3", "F8-2", "A5-2", "A6-2", "M3-1", "A7-2",
    "M5-1", "A4-3", "M6-1", "A8-1", "F6-1", "A5-3", "M8-1", "M1-3", "M6-2", "M8-2",
    // palier 2 : 31 compétences (lot 7e-2 : F8-3 arrive du CM2)
    "A2-4", "A6-3", "D1-1", "M2-2", "F2-1", "A3-3", "D2-1", "D3-1", "M7-1", "A7-3",
    "F1-1", "A2-5", "M3-2", "D1-2", "F3-1", "A4-4", "M7-2", "D4-1", "F3-2", "C1-1",
    "A8-2", "F5-1", "M8-3", "C3-1", "M10-1", "F3-3", "C3-2", "F5-2", "F8-3", "M12-1",
    "F9-1",
    // palier 3 : 41 compétences
    "A5-4", "A6-4", "D2-2", "D3-2", "M3-3", "F2-2", "D8-1", "M13-1", "D1-3", "D2-3",
    "D3-3", "F1-2", "D6-1", "M7-3", "D4-2", "M11-1", "D5-1", "F4-1", "D6-2", "M13-2",
    "D8-2", "F6-2", "A3-4", "D4-3", "C1-2", "D7-1", "M10-2", "D9-1", "M11-2",
    "F6-3", "D8-3", "C3-3", "M12-2", "D9-2", "M13-3", "A9-1", "C1-3", "F11-1", "C4-1",
    "F9-2", "C4-2",
    // palier 4 : 13 compétences
    "D2-4", "D5-2", "M9-1", "F1-3", "D6-3", "M10-3", "A9-2", "D7-2", "M12-3", "F4-2",
    "M9-2", "D7-3", "F11-2"
  ]);

  const A2 = {
    id: "A2", nom: "Compléments à la dizaine, à 100, à 1\u00a0000", exemple: "37 + ? = 100",
    famille: "A", construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A2_ERREURS, image: a2Image, aide: a2Aide, manipulation: calcul => a2Perles(calcul), difficulte: a2Difficulte,
    niveaux: [
      {
        // Lot 7e-2 : une procédure (calcul mental CP, p. 4), plus une carte.
        n: 1, titre: "à la dizaine suivante", nom: "Compléments à la dizaine", palier: 1, type: "P",
        composer: a2Niveau1,
        imposes: [a2Complement(1, 433, 440, {suivante: true})],
        apprends: a2Apprends({
          manipule: {a: 67, cible: 70}, represente: {a: 48, cible: 50}, ecris: {a: 433, cible: 440},
          consigneManipule: "Finis la rangée d’un coup.",
          consigne: "Pour aller à la dizaine suivante, je complète les unités.",
          bilan: "Pour aller à la dizaine suivante, je complète les unités : 67 + 3 = 70."
        })
      },
      {
        // Lot 7e-2 : une procédure (choix de Gwenaël du 15/11 : aucun texte
        // ne liste les compléments à 100 ; on va à la dizaine, puis à 100).
        n: 2, titre: "à 100\u00a0: dizaines et nombres en 5", nom: "Compléments à 100\u00a0: dizaines", palier: 1, type: "P",
        composer: a2Niveau2,
        imposes: [a2Complement(2, 75, 100), a2Difference(2, 35, 100)],
        apprends: a2Apprends({
          manipule: {a: 40, cible: 100}, represente: {a: 65, cible: 100}, ecris: {a: 20, cible: 100},
          consigneManipule: "Pousse les rangées qui manquent, 10 perles d’un coup.",
          consigne: "Je vais à la dizaine, puis je compte les dizaines jusqu’à 100.",
          // Lot 7e-2 : les dizaines qui font 100 se retrouvent (4 + 6 = 10).
          // Une procédure : plus de liste des paires à apprendre ; le dessin
          // est celui de l'ancienne carte, 4 perles et 6 perles de 10.
          bilan: "Les dizaines qui font 100, je les retrouve avec ce qui fait 10 : 40 + 60 = 100.",
          imageRetenir: {outil: "paires", total: 100, perles: true, pas: 10, paires: [[40, 60]]}
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
          bilan: "Pour aller à 100, je vais d’abord à la dizaine, puis à 100 : 37 + 63 = 37 + 3 + 60 = 100."
        })
      },
      {
        n: 4, titre: "à 1\u00a0000 et à la centaine suivante", nom: "Compléments à 1\u00a0000", palier: 2, type: "P",
        composer: a2Niveau4,
        imposes: [a2Complement(4, 650, 1000), a2Complement(4, 230, 300, {suivante: true})],
        apprends: a2Apprends({
          manipule: null, represente: {a: 650, cible: 1000}, ecris: {a: 370, cible: 1000},
          consigne: "Je vais à la centaine, puis à 1\u00a0000.",
          bilan: "Je vais d’abord à la centaine d’après, puis jusqu’au nombre à atteindre : 650 + 350 = 650 + 50 + 300 = 1\u00a0000."
        })
      },
      {
        // Lot « couverture » (06/11/2026) : le niveau qui manquait (programme
        // de cycle 3, CM1). Les identifiants sont définitifs : il vient à la
        // fin du module, son palier le range au CM1.
        n: 5, titre: "de n’importe quel nombre jusqu’à une centaine, un millier", nom: "Compléter jusqu’à une centaine, un millier", palier: 2, type: "P",
        composer: a2Niveau5,
        imposes: [a2Complement(5, 266, 300), a2Complement(5, 748, 1200)],
        apprends: a2Apprends({
          manipule: null, represente: {a: 368, cible: 1000}, ecris: {a: 748, cible: 1200},
          consigne: "Je vais à la dizaine, puis à la centaine, puis jusqu’à 1\u00a0000.",
          bilan: "Je vais à la dizaine, puis à la centaine, puis jusqu’à 1\u00a0000 : 368 + 632 = 368 + 2 + 30 + 600 = 1\u00a0000."
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
        n: 1, titre: "ajouter 9", palier: 1, type: "P",
        composer: a5Niveau(1, [9]),
        imposes: [a5Somme(1, 31, 9), a5Somme(1, 94, 9)],
        apprends: a5Apprends(47, 65, 28, 9, "+ 9, c’est + 10 puis − 1 : 47 + 9 = 47 + 10 − 1 = 56.")
      },
      {
        n: 2, titre: "ajouter 19, 29, 39", palier: 1, type: "P",
        composer: a5Niveau(2, [19, 29, 39]),
        imposes: [a5Somme(2, 31, 19), a5Somme(2, 285, 19)],
        apprends: a5Apprends(47, 38, 26, 19, "Pour ajouter 19, 29 ou 39, j’ajoute la dizaine d’après, puis je retranche 1 : 47 + 19 = 47 + 20 − 1 = 66.")
      },
      {
        n: 3, titre: "ajouter 8, 18, 28, 38", palier: 1, type: "P",
        composer: a5Niveau(3, [8, 18, 28, 38]),
        imposes: [a5Somme(3, 53, 38), a5Somme(3, 147, 18)],
        apprends: a5Apprends(53, 47, 65, 38, "Pour ajouter 8, 18, 28 ou 38, j’ajoute la dizaine d’après, puis je retranche 2 : 53 + 38 = 53 + 40 − 2 = 91.")
      },
      {
        n: 4, titre: "ajouter 48, 49… 98, 99", palier: 3, type: "P",
        composer: a5Niveau(4, [48, 49, 58, 59, 68, 69, 78, 79, 88, 89, 98, 99]),
        imposes: [a5Somme(4, 152, 98), a5Somme(4, 126, 99)],
        apprends: a5Apprends(23, 126, 347, 99, "Pour ajouter 99, j’ajoute 100, puis je retranche 1 (pour 98, je retranche 2) : 126 + 99 = 126 + 100 − 1 = 225.")
      }
    ]
  };

  // Une étape de J'écris. (Lot « relier » : `montre` disait la partie du
  // tableau qu'une étape remplissait, « entiers » ou « decimaux » ; depuis
  // les modules lot 5, J'écris de D2 et D3 se fait en une étape.)
  const etapeDe = (texte, reponse) => ({texte, reponse});

  const M2 = {
    id: "M2", nom: "× 10, × 100, × 1\u00a0000 (entiers)", exemple: "27 × 100",
    famille: "M", construit: true,
    aide_entraine: "tableau-fleches",
    erreurs: M2_ERREURS, image: tableauDe, aide: glisseAide, manipulation: glisseManipulation, difficulte: glisseDifficulte,
    niveaux: [
      {
        n: 1, titre: "multiplier par 10, 100", nom: "× 10, × 100", palier: 1, type: "P",
        composer: m2Niveau1,
        imposes: [produit("M2", 1, 38, 10), produit("M2", 1, 9, 100, true)],
        apprends: glisseApprends({
          // Lot 3a (décision 6) : la leçon sur × 10 ; × 100, × 1 000 viennent
          // à l'entraînement.
          calcul: produit("M2", 1, 45, 10), exemple: "45 × 10", colonnes: COLONNES_M2,
          represente: produit("M2", 1, 62, 10),
          ecris: {calcul: produit("M2", 1, 38, 10), etapes: [etapeDe(`38 × 10 = 38 dizaines = ${CASE}`, 380)]},
          consigne: "Chaque chiffre vaut 10 fois plus.",
          refus: "Chaque chiffre doit valoir 10 fois plus\u00a0: 1 colonne.",
          trace: ["45 × 10 = …", "45 × 10 = 450"],
          bilan: "Quand je multiplie par 10, chaque chiffre prend une valeur 10 fois plus grande\u00a0: 45 × 10 = 450."
        })
      },
      {
        n: 2, titre: "× 1 000, nombres en 0, nombre manquant, divisions", nom: "× 1\u00a0000, trous, divisions", palier: 2, type: "P",
        composer: m2Niveau2,
        imposes: [produit("M2", 2, 30, 100), trouFacteur("M2", 2, 35, 100), division("M2", 2, 48, 10)],
        apprends: glisseApprends({
          calcul: division("M2", 2, 48, 10), exemple: "480 ÷ 10", colonnes: COLONNES_M2,
          represente: produit("M2", 2, 30, 100),
          ecris: {calcul: division("M2", 2, 35, 100), etapes: [etapeDe(`3${ESPACE_FINE}500 ÷ 100 = ${CASE}`, 35)]},
          consigne: "Chaque chiffre vaut 10 fois moins.", consigneTableau: "Chaque chiffre vaut 100 fois plus.",
          refus: "Chaque chiffre doit valoir 10 fois moins\u00a0: 1 colonne.",
          trace: ["480 ÷ 10 = …", "480 ÷ 10 = 48"],
          bilan: "Quand je divise par 10, chaque chiffre prend une valeur 10 fois plus petite : 480 ÷ 10 = 48."
        })
      }
    ]
  };
  // Les modules à décimales ont la touche « , » au-dessus du pavé.
  const D2 = {
    id: "D2", nom: "× 10, × 100, × 1\u00a0000 avec virgule", exemple: "7,54 × 100",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "tableau-fleches",
    erreurs: D2_ERREURS, image: tableauDe, aide: glisseAide, manipulation: glisseManipulation, difficulte: glisseDifficulte,
    niveaux: [
      {
        n: 1, titre: "décimal × 10", nom: "Décimal × 10", palier: 2, type: "P",
        composer: d2Niveau1,
        imposes: [produit("D2", 1, 0.6, 10), produit("D2", 1, 2.5, 10)],
        apprends: glisseApprends({
          calcul: produit("D2", 1, 2.5, 10), exemple: "2,5 × 10", colonnes: COLONNES_D2,
          represente: produit("D2", 1, 0.6, 10),
          ecris: {calcul: produit("D2", 1, 72.41, 10), etapes: [etapeDe(`72,41 × 10 = ${CASE}`, 724.1)]},
          consigne: "Chaque chiffre vaut 10 fois plus.",
          refus: "Chaque chiffre doit valoir 10 fois plus\u00a0: 1 colonne.",
          trace: ["2,5 × 10 = …", "2,5 × 10 = 25"],
          bilan: "Chaque chiffre prend une valeur 10 fois plus grande, la virgule ne bouge pas : 2,5 × 10 = 25."
        })
      },
      {
        n: 2, titre: "× 100, × 1\u00a0000 sans zéro à écrire", nom: "Décimal × 100, × 1\u00a0000", palier: 3, type: "P",
        composer: d2Niveau2,
        imposes: [produit("D2", 2, 7.54, 100), produit("D2", 2, 4.107, 1000)],
        apprends: glisseApprends({
          calcul: produit("D2", 2, 7.54, 100), exemple: "7,54 × 100", colonnes: COLONNES_D2,
          represente: produit("D2", 2, 4.107, 1000),
          ecris: {calcul: produit("D2", 2, 3.24, 100), etapes: [etapeDe(`3,24 × 100 = ${CASE}`, 324)]},
          consigne: "Chaque chiffre vaut 100 fois plus.", consigneTableau: "Chaque chiffre vaut 1\u00a0000 fois plus.",
          refus: "Chaque chiffre doit valoir 100 fois plus\u00a0: 2 colonnes.",
          trace: ["7,54 × 100 = …", "7,54 × 100 = 754"],
          bilan: "Quand je multiplie par 100, chaque chiffre prend une valeur 100 fois plus grande : 7,54 × 100 = 754."
        })
      },
      {
        n: 3, titre: "des zéros à écrire", nom: "Décimal\u00a0: zéros à écrire", palier: 3, type: "P",
        composer: d2Niveau3,
        imposes: [produit("D2", 3, 3.6, 100), produit("D2", 3, 72.4, 100), produit("D2", 3, 0.2, 100)],
        apprends: glisseApprends({
          calcul: produit("D2", 3, 3.6, 100), exemple: "3,6 × 100", colonnes: COLONNES_D2,
          represente: produit("D2", 3, 72.4, 100),
          // (Lot 3b : J'écris × 100, comme la leçon ; × 1 000 est annoncé.)
          ecris: {calcul: produit("D2", 3, 4.5, 100), etapes: [etapeDe(`4,5 × 100 = ${CASE}`, 450)]},
          consigne: "Chaque chiffre vaut 100 fois plus.",
          refus: "Chaque chiffre doit valoir 100 fois plus\u00a0: 2 colonnes.",
          trace: ["3,6 × 100 = …", "3,6 × 100 = 360"],
          // Lot 7e : pas un zéro dans toute case vide, seulement ceux qui
          // gardent la place des chiffres.
          bilan: "J’écris un zéro dans chaque colonne vide avant la virgule\u00a0: 3,6 × 100 = 360."
        })
      },
      {
        n: 4, titre: "le nombre manquant", nom: "Décimal\u00a0: trous", palier: 4, type: "P",
        composer: d2Niveau4,
        imposes: [trouFacteur("D2", 4, 3.6, 100), trouNombre("D2", 4, 0.45, 100), trouEgal("D2", 4, 1.2, 1000)],
        apprends: glisseApprends({
          calcul: trouFacteur("D2", 4, 0.45, 100), exemple: "0,45 × ? = 45", colonnes: COLONNES_D2,
          represente: trouEgal("D2", 4, 1.2, 1000),
          ecris: {calcul: trouFacteur("D2", 4, 3.6, 100), etapes: [etapeDe(`3,6 × ${CASE} = 360`, 100)]},
          consigne: "Glisse jusqu’à lire 45.", consigneTableau: "Je compte les colonnes.",
          refus: null,
          trace: ["0,45 × … = 45", "0,45 × 100 = 45"],
          bilan: "Pour trouver par combien on a multiplié, je compte les colonnes : 0,45 × 100 = 45."
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
    // Lot « couverture » : la case devant (« □ + 5 = 12 », « 12 = □ + 5 ») ;
    // sur la droite, on part du nombre donné (5) et on va jusqu'à 12.
    // (rangé avec « 6 + □ = 13 » : on cherche le nombre qui manque)
    if (forme === "complement-gauche") return Object.freeze(Object.assign({}, fabriquer(module, niveau, forme, [TROU, "+", n, "=", m], d, {n, d, m}), {forme: "complement"}));
    // « 12 = □ + 5 » : rangé avec « 13 = 6 + □ » (l'égalité à l'envers).
    if (forme === "complement-gauche-egal") return Object.freeze(Object.assign({}, fabriquer(module, niveau, forme, [m, "=", TROU, "+", n], d, {n, d, m}), {forme: "complement-egal"}));
    const calcul = fabriquer(module, niveau, forme, [m, "=", n, "+", TROU], d, {n, d, m});
    return Object.freeze(Object.assign({}, calcul, {cle: `${calcul.cle}-x`}));
  }

  // Un trou : on cherche le saut (6 + □ = 13), ou l'écart entre deux nombres
  // proches (A8 : 73 − 68 = □, 4 000 − □ = 3 999).
  const FORMES_TROU = new Set(["complement", "complement-egal", "complement-gauche", "complement-gauche-egal", "ecart", "ecart-trou"]);
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
    // « d'un coup » seulement à partir de 2 perles (relecture 1 : « Retire
    // 1 perle d'un coup » n'a pas de sens). Un trou garde sa phrase : elle
    // ne doit pas dire combien de perles manquent.
    const coup = n => (Math.abs(n) > 1 ? " d’un coup" : "");
    let consigne;
    if (trou) consigne = palier === null ? "Finis la rangée d’un coup." : "Finis la rangée d’un coup, puis pousse les perles qui manquent.";
    else if (d > 0) consigne = palier === null ? `Pousse ${d} perle${d > 1 ? "s" : ""}${coup(d)}.` : `Finis la rangée${coup(sauts[0])}, puis pousse le reste.`;
    else consigne = palier === null ? `Retire ${-d} perle${d < -1 ? "s" : ""}${coup(d)}.` : `Vide la rangée${coup(sauts[0])}, puis retire le reste.`;
    return Object.freeze({
      outil: "perles", depart: n,
      // Lot 3b (idée de Gwenaël) : passer 10 dans « Sommes jusqu'à 20 » — la
      // rangée finie s'entoure, « 10 », le reste se lit dessous.
      entourerDix: calcul.module === "A1" && d > 0 && palier === 10,
      texte: trou ? calcul.texte.replace(CASE, "?") : `${n} ${op} ${Math.abs(d)}`,
      gestes: Object.freeze(sauts.slice()), consigne, traces: Object.freeze(traces)
    });
  }

  // Les trois temps de J'apprends d'un niveau d'A1, A10, A11, sur trois
  // calculs différents : les perles (jusqu'à 100), la droite avec ses « ? »,
  // les étapes à remplir.
  // `autre` (lot « couverture », 06/11/2026) : une deuxième façon de voir,
  // écrite sous le dessin d'« À retenir » — {phrase, calcul}.
  const autreDe = autre => (autre ? {autre: Object.freeze(Object.assign({}, autre))} : {});

  function plusApprends({manipule, represente, ecris, etapes, consigne, consigneEcris = null, bilan, autre = null}) {
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
      ecris: ecrisAvecDessins(Object.assign({
        etapes: Object.freeze(etapes.map(([texte, reponse]) => Object.freeze({texte, reponse}))),
        reponse: ecris.reponse,
        solution: Object.freeze({image: plusImage(ecris), phrase: plusPhrase(ecris)})
      }, consigneEcris ? {consigne: consigneEcris} : {}), plusDessins(ecris, etapes.length)),
      bilan,
      ...autreDe(autre),
      image: Object.freeze(plusImage(premier)),
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: premier, ecris: ecris}),
      textes: Object.freeze([premier.texte, represente.texte, ecris.texte])
    });
  }

  // Du plus simple au plus dur : la forme, puis le passage (dizaine, puis
  // centaine, puis millier), la taille du saut, celle du nombre de départ.
  const PLUS_FORMES = Object.freeze({somme: 0, difference: 0, complement: 1, "complement-egal": 2, "complement-gauche": 2, "complement-gauche-egal": 2});
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
  // Lot « couverture » (relecture Codex du 06/11) : la table avec 0 (0 + 7)
  // et avec 10 (6 + 10), de temps en temps.
  const A1_ZERO = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => [0, y]));
  const A1_DIX = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => [x, 10]));
  const A1_COMPLEMENTS_10 = Object.freeze(Array.from({length: 9}, (_, i) => [i + 1, 9 - i]));
  // A1-2 : un chiffre + un chiffre, au-delà de 10.
  const A1_SOMMES_20 = Object.freeze(paires((x, y) => x >= 2 && x <= 9 && y >= 2 && x + y >= 11));
  // A1-3 : les différences (en passant 10, et sous 10), les trous qui passent 10.
  const A1_DIFFERENCES_PASSAGE = Object.freeze(paires((x, y) => x >= 11 && x <= 18 && x - y < 10, 2).map(([x, y]) => [x, -y]));
  const A1_DIFFERENCES_SOUS_10 = Object.freeze(paires((x, y) => x >= 5 && x <= 10 && y >= 2 && x - y >= 1, 2).map(([x, y]) => [x, -y]));
  const A1_TROUS_20 = Object.freeze(paires((x, y) => x >= 2 && x <= 9 && x + y >= 11, 2));

  function a1Niveau3(rng, total, imposes) {
    // 3 différences sur 4 passent 10.
    // Lot « couverture » : la case devant, une fois sur six (□ + 5 = 12 ;
    // 12 = □ + 5).
    const [differences, trous, egaux, devant, devantEgal] = repartir(total, [6, 3, 2, 1, 1]);
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
      ...prendre("complement-gauche", A1_TROUS_20, devant),
      ...prendre("complement-gauche-egal", A1_TROUS_20, devantEgal),
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
    // (Lot « couverture » : 29 + 1 = 30 compris.)
    const u = entierEntre(rng, 1, 9);
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

  // Relecture 2 (08/11/2026, choix de Gwenaël sur la planche) : A1-1 ne
  // parle que des compléments à 10. Je représente et J'écris montrent le
  // schéma en barres (10 en haut ; 4 et ce qui manque, collés dessous) ;
  // l'aide de l'entraînement aussi, pour les compléments du niveau 1 (les
  // sommes gardent la droite). « À retenir » : les cinq paires, chacune en
  // rangée du boulier (5 rouges, 5 blanches) coupée, son calcul à côté.
  const a1Barres = calcul => Object.freeze({outil: "deux-barres", sorte: "tout",
    haut: Object.freeze([calcul.donnees.m]), bas: Object.freeze([calcul.donnees.n, calcul.donnees.d]), cherche: Object.freeze(["bas", 1])});
  const a1EnBarres = calcul => calcul.niveau === 1 && estTrou(calcul);
  // Lot 3b (décision 4 du lot 3, idée de Gwenaël du 13/11/2026) : les
  // presque-doubles de « Sommes jusqu'à 20 » (7 + 8 : les deux nombres se
  // suivent) sont une sorte à part, avec leur dessin sur le rekenrek : 7
  // perles sur une rangée, 7 sur la suivante (le double, 14 se voit), puis 1
  // perle de plus, sur la rangée du plus grand nombre.
  const presqueDouble = calcul => calcul.module === "A1" && calcul.forme === "somme"
    && Math.abs(calcul.donnees.n - calcul.donnees.d) === 1 && calcul.donnees.m > 10;
  const presqueDoubleImage = (calcul, revele) => {
    const {n, d, m} = calcul.donnees;
    return Object.freeze({outil: "presque-double", a: Math.min(n, d), plus: n > d ? 0 : 1, total: m, texte: `${n} + ${d}`, revele});
  };
  // (Choix de Gwenaël sur la planche du 13/11 : 8 en haut, 7 en dessous,
  // déjà poussés ; l'élève y repère 7 + 7 + 1.)
  function presqueDoublePerles(calcul) {
    const {n, d, m} = calcul.donnees;
    const a = Math.min(n, d);
    return Object.freeze({
      outil: "perles", depart: m, rangees: Object.freeze([n, d]),
      texte: `${n} + ${d}`, gestes: Object.freeze([]),
      consigne: `${n} en haut, ${d} en dessous\u00a0: repère le double.`,
      traces: Object.freeze([Object.freeze({apres: 1, attente: `${a} + ${a} + 1 = …`, texte: `${n} + ${d} = ${a} + ${a} + 1 = ${m}`})])
    });
  }
  function a1Image(calcul, gras) {
    if (presqueDouble(calcul)) return presqueDoubleImage(calcul, true);
    return a1EnBarres(calcul) ? a1Barres(calcul) : plusImage(calcul, gras);
  }
  function a1Aide(calcul) {
    if (presqueDouble(calcul)) return presqueDoubleImage(calcul, false);
    return a1EnBarres(calcul) ? Object.freeze(Object.assign({}, a1Barres(calcul), {masque: true})) : plusAide(calcul);
  }
  const a1Perles = calcul => (presqueDouble(calcul) ? presqueDoublePerles(calcul) : plusPerles(calcul));
  const PAIRES_DIX = Object.freeze([[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]].map(p => Object.freeze(p)));
  function a1Niveau1Apprends(apprends) {
    const barresDe = (n, d) => Object.freeze({outil: "deux-barres", sorte: "tout", haut: Object.freeze([n + d]), bas: Object.freeze([n, d]), cherche: Object.freeze(["bas", 1])});
    const represente = barresDe(4, 6);
    const ecris = barresDe(8, 2);
    // J'écris : un dessin par étape (lot « relier ») ; la case « ? » se
    // remplit dès la première égalité juste (8 + 2 = 10), et le reste.
    const relier = dessinsDe([{}, {}], 2, (vus, revele = false) => (revele
      ? ecris
      : Object.freeze(Object.assign({}, ecris, {masque: true, trouves: vus.length, fini: vus.length >= 1}))));
    return Object.freeze(Object.assign({}, apprends, {
      represente: Object.freeze(Object.assign({}, apprends.represente, {
        outil: "deux-barres",
        image: Object.freeze(Object.assign({}, represente, {masque: true})),
        solution: Object.freeze({image: represente, phrase: "4 + 6 = 10."})
      })),
      ecris: Object.freeze(Object.assign({}, apprends.ecris, {
        dessins: relier.dessins,
        solution: Object.freeze(Object.assign({}, apprends.ecris.solution, {image: relier.revele, phrase: "8 + 2 = 10."}))
      })),
      image: Object.freeze({outil: "paires", total: 10, perles: true, paires: PAIRES_DIX})
    }));
  }

  const A1 = {
    id: "A1", nom: "Sommes et différences jusqu’à 20", exemple: "6 + 4",
    famille: "A", construit: true,
    aide_entraine: "droite-sauts",
    erreurs: A1_ERREURS, image: a1Image, aide: a1Aide, manipulation: a1Perles, difficulte: plusDifficulte,
    niveaux: [
      {
        n: 1, titre: "compléments à 10, sommes jusqu’à 10", nom: "Sommes jusqu’à 10", palier: 1, type: "F",
        composer: composerViviers("A1", 1, [
          {forme: "somme", liste: A1_SOMMES_10},
          {forme: "complement", liste: A1_COMPLEMENTS_10},
          {forme: "complement-egal", liste: A1_COMPLEMENTS_10},
          {forme: "somme", liste: A1_ZERO}
        ], [6, 4, 2, 1]),
        imposes: [lignePlus("A1", 1, "complement", 3, 7), lignePlus("A1", 1, "complement-egal", 7, 3)],
        apprends: a1Niveau1Apprends(plusApprends({
          manipule: lignePlus("A1", 0, "complement", 3, 7),
          represente: lignePlus("A1", 0, "complement", 4, 6),
          ecris: lignePlus("A1", 0, "complement-egal", 8, 2),
          etapes: etapesDe(["8 + ? = 10", 2], ["10 = 8 + ?", 2]),
          consigneEcris: "10 = 8 + ?",
          consigne: "En haut, 10. En bas, 4 et ce qui manque.",
          bilan: "Pour faire 10, je connais ces paires par cœur : 3 + 7 = 10."
        }))
      },
      {
        n: 2, titre: "sommes de 11 à 20 (passer par 10)", nom: "Sommes jusqu’à 20", palier: 1, type: "F",
        composer: composerViviers("A1", 2, [{forme: "somme", liste: A1_SOMMES_20}, {forme: "somme", liste: A1_DIX}], [9, 1]),
        imposes: [ligne("A1", 2, 9, 6), ligne("A1", 2, 5, 8)],
        apprends: plusApprends({
          // Lot 3b : la leçon passe 10 sur 8 + 5 (8 + 7 est un presque-double,
          // une autre sorte, annoncée à l'entraînement).
          manipule: ligne("A1", 0, 8, 5),
          represente: ligne("A1", 0, 9, 4),
          ecris: ligne("A1", 0, 7, 5),
          etapes: etapesDe(["7 + 3 = ?", 10], ["10 + 2 = ?", 12], ["7 + 5 = ?", 12]),
          consigneEcris: "7 + 5 = 7 + 3 + 2",
          consigne: "Je vais à 10, puis j’ajoute le reste.",
          bilan: "Pour dépasser 10, je vais d’abord à 10, puis j’ajoute le reste : 8 + 5 = 8 + 2 + 3 = 13.",
          // Décision du 06/11 (audit de couverture) : les presque-doubles,
          // deuxième façon de faire quand les nombres se suivent.
          // (Lot 3b : sur le calcul du dessin des presque-doubles, 7 + 8.)
          autre: {phrase: "Quand les deux nombres se suivent, je peux aussi passer par le double :", calcul: "7 + 8 = 7 + 7 + 1 = 15"}
        })
      },
      {
        // Lot 7e-2 : une procédure (calcul mental CP, p. 3 : les égalités
        // avec « − » ne sont pas des faits mémorisés), plus une carte.
        n: 3, titre: "différences et nombre manquant", nom: "Différences et trous jusqu’à 20", palier: 1, type: "P",
        composer: a1Niveau3,
        imposes: [ligne("A1", 3, 14, -6), lignePlus("A1", 3, "complement", 7, 5)],
        apprends: plusApprends({
          manipule: ligne("A1", 0, 15, -7),
          represente: ligne("A1", 0, 13, -5),
          ecris: ligne("A1", 0, 14, -6),
          etapes: etapesDe(["14 − 4 = ?", 10], ["10 − 2 = ?", 8], ["14 − 6 = ?", 8]),
          consigneEcris: "14 − 6 = 14 − 4 − 2",
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
          consigneEcris: "254 + 3 = 250 + 4 + 3",
          consigne: "J’avance de 5 : seul le chiffre des unités change.",
          // Lot 7e : le niveau arrive aussi pile sur la dizaine (79 + 1 = 80).
          bilan: "Sans passer la dizaine, seul le chiffre des unités change (pile sur la dizaine, 10 unités font 1 dizaine) : 32 + 4 = 36."
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
          consigneEcris: "236 + 7 = 236 + 4 + 3",
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
          consigneEcris: "395 + 8 = 395 + 5 + 3",
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
          consigneEcris: "486 − 3 = 480 + 6 − 3",
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
          // Relecture 2 (08/11/2026) : J'écris garde la méthode de la leçon
          // (reculer jusqu'à la dizaine, puis retirer le reste) ; 50 − 6
          // reste dans l'entraînement.
          ecris: ligne("A11", 0, 532, -7),
          etapes: etapesDe(["532 − 2 = ?", 530], ["530 − 5 = ?", 525], ["532 − 7 = ?", 525]),
          consigneEcris: "532 − 7 = 532 − 2 − 5",
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
          consigneEcris: `1${ESPACE_FINE}002 − 7 = 1${ESPACE_FINE}002 − 2 − 5`,
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
  function cheminApprends({manipule, represente, ecris, etapes, consigne, consigneEcris = null, bilan, autre = null}) {
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
      ...autreDe(autre),
      image: Object.freeze(cheminImage(premier)),
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: premier, ecris: ecris}),
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
        // (A3, lot « couverture » : 95 − 90 = 5 est permis, programme de CP.)
        if (m < (module === "A3" && n < 100 ? 1 : 11) || [d, d * 10, d / 10, dizainesDe(d)].some(x => Math.abs(x) === m)) continue;
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
    // (Lot « couverture » : un calcul sur vingt part d'un nombre à un
    // chiffre, 5 + 90 = 95, programme de CP.)
    const n = sorte === 0 ? (rang % 20 === 0 ? entierEntre(rng, 1, 9) : entierEntre(rng, 11, 99)) : entierEntre(rng, 101, 999);
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
  // A3-3 : passer le millier (lot 3a, décision 7 de Gwenaël, 13/11/2026),
  // quatre sortes à parts égales : + dizaines (950 + 70, 1 985 + 30),
  // + centaines (2 657 + 500), − dizaines (1 030 − 50), − centaines
  // (1 200 − 400). Toujours au moins un millier dans le calcul, jamais
  // au-delà de 9 999.
  const a3Niveau3 = cheminNiveau("A3", 3, (rng, rang) => {
    const sorte = rang % 4;
    const plus = sorte < 2;
    const u = sorte % 2 === 0 ? 10 : 100;
    const millier = entierEntre(rng, 1, 9) * 1000;
    // Le reste sous le saut : la moitié du temps rond (950), sinon des
    // unités (1 985) ou des dizaines et unités (2 657).
    const reste = rng() < .5 ? 0 : entierEntre(rng, 1, u - 1);
    const n = plus ? millier - u * entierEntre(rng, 1, 9) + reste : millier + u * entierEntre(rng, 0, 8) + reste;
    const d = (plus ? 1 : -1) * u * entierEntre(rng, 1, 9);
    const m = n + d;
    // (Partir pile d'un millier, 1 000 − 100, ce n'est pas le passer.)
    if (n < 100 || m < 100 || m >= 10000 || n % 1000 === 0 || Math.floor(n / 1000) === Math.floor(m / 1000)) return null;
    return franchit(n, d, 1000) ? [n, d] : null;
  });
  // A3-4 : les grands nombres, à 4 ou 5 chiffres. La moitié ajoute ou
  // retire des milliers (21 462 + 3 000 ; 47 530 + 6 000, en passant la
  // dizaine de mille) ; l'autre moitié des centaines ou des dizaines, sans
  // passage (1 462 + 300 ; 6 780 − 50). Un sur trois en retirant.
  // (Lot « couverture » : les centaines et les dizaines sur des nombres à 4
  // chiffres sont dans A3-3 ; ici, sur des nombres à 5 chiffres.)
  // Lot 3a (décision 7) : toujours SANS passage — « je repère le chiffre
  // qui change » (21 462 + 3 000 ; 51 503 − 200). Passer le millier, c'est
  // le niveau d'avant.
  const a3Niveau4 = cheminNiveau("A3", 4, (rng, rang) => {
    const u = rang % 2 === 0 ? 1000 : rang % 4 === 1 ? 100 : 10;
    const n = entierEntre(rng, 10001, 99999);
    const d = (rang % 3 === 2 ? -1 : 1) * u * entierEntre(rng, 1, 9);
    const m = n + d;
    if (m < 10000 || m >= 100000) return null;
    return franchit(n, d, 10 * u) ? null : [n, d];
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
          manipule: chemin("A3", 46, 30),
          represente: chemin("A3", 354, 500),
          ecris: chemin("A3", 234, 60),
          etapes: [["3 + 6 = ?", 9], ["234 + 60 = ?", 294]],
          consigneEcris: "Dans 234, le chiffre des dizaines est 3.",
          consigne: "J’avance de 5 centaines : seul le chiffre des centaines change.",
          bilan: "Quand j’ajoute des dizaines sans passer la centaine, seul le chiffre des dizaines change : 46 + 30 = 76."
        })
      },
      {
        n: 2, titre: "passage de la centaine", nom: "Dizaines entières en passant la centaine", palier: 1, type: "P",
        composer: a3Niveau2,
        imposes: [ligneChemin("A3", 2, 792, 10), ligneChemin("A3", 2, 534, -70)],
        apprends: cheminApprends({
          manipule: null,
          represente: chemin("A3", 746, 80),
          ecris: chemin("A3", 768, 50),
          etapes: [["768 + 40 = ?", 808], ["808 + 10 = ?", 818], ["768 + 50 = ?", 818]],
          consigneEcris: "768 + 50 = 768 + 40 + 10",
          // Lot 7e : 746 + 60 arrive à 806, pas à une centaine ronde.
          consigne: "J’ajoute les dizaines qui mènent à la centaine, puis le reste.",
          bilan: "Pour passer la centaine, j’ajoute d’abord les dizaines qui y mènent, puis le reste ; les unités ne bougent pas : 746 + 80 = 746 + 60 + 20 = 826."
          // (Lot 3, décision 4 : la ligne « 74 dizaines + 8 dizaines » est
          // retirée, le même calcul vu autrement.)
        })
      },
      {
        // Lot 7e : le nom suit les calculs (depuis le lot 3a, on passe toujours le millier).
        n: 3, titre: "passage du millier", nom: "Dizaines, centaines en passant le millier", palier: 2, type: "P",
        composer: a3Niveau3,
        imposes: [ligneChemin("A3", 3, 1030, -50), ligneChemin("A3", 3, 2657, 500), ligneChemin("A3", 3, 3970, 60)],
        apprends: cheminApprends({
          manipule: null,
          represente: chemin("A3", 950, 70),
          ecris: chemin("A3", 980, 60),
          etapes: [["980 + 20 = ?", 1000], [`1${ESPACE_FINE}000 + 40 = ?`, 1040], ["980 + 60 = ?", 1040]],
          consigneEcris: "980 + 60 = 980 + 20 + 40",
          consigne: "Je vais au millier, puis j’ajoute le reste.",
          bilan: `Pour passer le millier, je vais d’abord au millier, puis j’ajoute le reste : 950 + 70 = 950 + 50 + 20 = 1${ESPACE_FINE}020.`
        })
      },
      {
        n: 4, titre: "milliers dans les grands nombres", nom: "Milliers dans les grands nombres", palier: 3, type: "P",
        composer: a3Niveau4,
        imposes: [ligneChemin("A3", 4, 31462, 4000), ligneChemin("A3", 4, 16780, -50)],
        apprends: cheminApprends({
          manipule: null,
          represente: chemin("A3", 47530, 2000),
          ecris: chemin("A3", 21462, 3000),
          etapes: [["1 + 3 = ?", 4], [`21${ESPACE_FINE}462 + 3${ESPACE_FINE}000 = ?`, 24462]],
          consigneEcris: `Dans 21${ESPACE_FINE}462, le chiffre des milliers est 1.`,
          consigne: "J’avance de 2 milliers : seul le chiffre des milliers change.",
          bilan: `Dans un grand nombre, je repère le chiffre qui change : 47${ESPACE_FINE}530 + 2${ESPACE_FINE}000 = 49${ESPACE_FINE}530.`
        })
      }
    ]
  }, commun);

  const A4 = Object.assign({
    id: "A4", nom: "Additionner deux nombres", exemple: "42 + 35",
    erreurs: A4_ERREURS,
    niveaux: [
      {
        n: 1, titre: "deux chiffres, sans passer la dizaine", nom: "Additionner sans passer la dizaine", palier: 1, type: "P",
        composer: a4Niveau1,
        imposes: [ligneChemin("A4", 1, 53, 24), ligneChemin("A4", 1, 26, 42)],
        apprends: cheminApprends({
          manipule: chemin("A4", 42, 35),
          represente: chemin("A4", 51, 27),
          ecris: chemin("A4", 61, 28),
          etapes: [["61 + 20 = ?", 81], ["81 + 8 = ?", 89], ["61 + 28 = ?", 89]],
          consigneEcris: "61 + 28 = 61 + 20 + 8",
          consigne: "Je garde 51 : j’ajoute les dizaines, puis les unités.",
          bilan: "J’ajoute les dizaines, puis les unités : 42 + 35 = 42 + 30 + 5 = 77."
        })
      },
      {
        n: 2, titre: "deux chiffres, en passant la dizaine", nom: "Additionner en passant la dizaine", palier: 1, type: "P",
        composer: a4Niveau2,
        imposes: [ligneChemin("A4", 2, 36, 47), ligneChemin("A4", 2, 28, 56)],
        apprends: cheminApprends({
          manipule: chemin("A4", 47, 28),
          represente: chemin("A4", 36, 57),
          ecris: chemin("A4", 58, 34),
          etapes: [["58 + 30 = ?", 88], ["88 + 4 = ?", 92], ["58 + 34 = ?", 92]],
          consigneEcris: "58 + 34 = 58 + 30 + 4",
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
          consigneEcris: "87 + 36 = 87 + 30 + 6",
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
          consigneEcris: "347 + 28 = 347 + 20 + 8",
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
        n: 1, titre: "sans passer la dizaine", nom: "Soustraire sans passer la dizaine", palier: 1, type: "P",
        composer: a7Niveau1,
        imposes: [ligneChemin("A7", 1, 576, -34), ligneChemin("A7", 1, 95, -42)],
        apprends: cheminApprends({
          manipule: chemin("A7", 78, -35),
          represente: chemin("A7", 486, -53),
          ecris: chemin("A7", 89, -46),
          etapes: [["89 − 40 = ?", 49], ["49 − 6 = ?", 43], ["89 − 46 = ?", 43]],
          consigneEcris: "89 − 46 = 89 − 40 − 6",
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
          consigneEcris: "74 − 38 = 74 − 30 − 8",
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
          consigneEcris: "615 − 38 = 615 − 30 − 8",
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
        // Lot « couverture » : un sur dix à 4 chiffres aux niveaux 2 et 3
        // (4 510 − 38, champ du CE2).
        if ((niveau === 2 || niveau === 3) && rang % 10 === 6) n = entierEntre(rng, 1001, 9999);
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
      // Relecture 1 : au-dessus du dessin, le calcul cherché et son détour.
      ecris: ecrisAvecDessins({
        consigne: `${formaterNombre(cE.donnees.n)} − ${a} = ${formaterNombre(cE.donnees.n)} − ${r} + ${d}`,
        etapes: a6Etapes(cE), reponse: cE.reponse,
        solution: Object.freeze({image: a6Image(cE), phrase: a6Phrase(cE)})
      }, droiteDessins({depart: cE.donnees.n, sauts: [-r, d], direct: -a, trou: false, etapes: a6Etapes(cE).length})),
      bilan,
      image: Object.freeze({outil: "droite-sauts", depart: premier.donnees.n, sauts: [{val: -r}, {val: d}], direct: -a, acquis: [2]}),
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: premier, ecris: cE}),
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
        n: 1, titre: "retirer 9", palier: 1, type: "P",
        composer: a6Niveau(1, [9]),
        imposes: [a6Difference(1, 105, 9), a6Difference(1, 31, 9)],
        apprends: a6Apprends(63, 85, 142, 9, "− 9, c’est − 10 puis + 1 : 63 − 9 = 63 − 10 + 1 = 54.")
      },
      {
        n: 2, titre: "retirer 19, 29, 39", palier: 1, type: "P",
        composer: a6Niveau(2, [19, 29, 39]),
        imposes: [a6Difference(2, 143, 29), a6Difference(2, 86, 39)],
        apprends: a6Apprends(72, 154, 86, 29, "Pour retrancher 19, 29 ou 39, je retranche la dizaine d’après, puis j’ajoute 1 : 72 − 29 = 72 − 30 + 1 = 43.")
      },
      {
        n: 3, titre: "retirer 8, 18, 28, 38", palier: 2, type: "P",
        composer: a6Niveau(3, [8, 18, 28, 38]),
        imposes: [a6Difference(3, 71, 18), a6Difference(3, 250, 38)],
        apprends: a6Apprends(73, 145, 92, 18, "Pour retrancher 8, 18, 28 ou 38, je retranche la dizaine d’après, puis j’ajoute 2 : 73 − 18 = 73 − 20 + 2 = 55.")
      },
      {
        n: 4, titre: "retirer 48, 49… 98, 99", palier: 3, type: "P",
        composer: a6Niveau(4, [48, 49, 58, 59, 68, 69, 78, 79, 88, 89, 98, 99]),
        imposes: [a6Difference(4, 210, 98), a6Difference(4, 1040, 99)],
        apprends: a6Apprends(250, 432, 710, 99, "Pour retrancher 99, je retranche 100, puis j’ajoute 1 (pour 98, j’ajoute 2) : 432 − 99 = 432 − 100 + 1 = 333.")
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
    // Relecture 2b (11/11/2026, remarque 54) : « proches » = un écart de 5
    // au plus (21 − 12, écart 9, n'est pas proche).
    const grand = petit + entierEntre(rng, 2, 5);
    return grand <= 99 && grand % 10 !== 0 && Math.floor(grand / 10) !== Math.floor(petit / 10) ? [petit, grand, "ecart"] : null;
  });
  // A8-2 : de part et d'autre d'une centaine (402 − 397 ; 103 − 97) ou,
  // 4 fois sur 10, d'un millier (1 003 − 996 ; « 4 000 − □ = 3 999 »,
  // exemple officiel de CM1). Lot « couverture » (décision du 06/11) : l'ancien
  // niveau 3 (le millier) est dans celui-ci, même geste, même classe.
  const a8Niveau2 = a8Niveau(2, (rng, rang) => {
    if (rang % 5 < 3) {
      const centaine = entierEntre(rng, 1, 9) * 100;
      const petit = centaine - entierEntre(rng, 1, 9);
      const grand = petit + entierEntre(rng, 2, 9);
      return grand > centaine && grand < 1000 ? [petit, grand, "ecart"] : null;
    }
    const millier = entierEntre(rng, 1, 9) * 1000;
    const petit = millier - entierEntre(rng, 1, 9);
    const grand = millier + entierEntre(rng, 0, 9);
    return grand - petit <= 12 ? [petit, grand, rang % 5 === 4 ? "ecart-trou" : "ecart"] : null;
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
      // Relecture 1 : au-dessus du dessin, l'écart cherché, avec son « ? ».
      ecris: ecrisAvecDessins({
        consigne: ecris.texte.replace(CASE, "?"),
        etapes: Object.freeze(etapes.map(([texte, reponse]) => Object.freeze({texte: texte.replace("?", CASE), reponse}))),
        reponse: ecris.reponse,
        solution: Object.freeze({image: plusImage(ecris), phrase: plusPhrase(ecris)})
      }, plusDessins(ecris, etapes.length)),
      bilan,
      image: Object.freeze(plusImage(premier)),
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: premier, ecris: ecris}),
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
        imposes: [ligneEcart(1, "ecart", 86, 91), ligneEcart(1, "ecart", 58, 62)],
        apprends: a8Apprends({
          manipule: ecart(68, 73),
          represente: ecart(47, 52),
          ecris: ecart(76, 81),
          etapes: [["76 + ? = 80", 4], ["80 + ? = 81", 1], ["81 − 76 = ?", 5]],
          bilan: "Quand les nombres sont proches, je pars du petit et j’avance jusqu’au grand : 73 − 68 = 2 + 3 = 5."
        })
      },
      {
        n: 2, titre: "de part et d’autre d’une centaine, d’un millier", nom: "Écart de part et d’autre d’une centaine, d’un millier", palier: 2, type: "P",
        composer: a8Niveau2,
        imposes: [ligneEcart(2, "ecart", 296, 305), ligneEcart(2, "ecart-trou", 3999, 4000)],
        apprends: a8Apprends({
          manipule: null,
          represente: ecart(397, 402),
          ecris: ecart(596, 604),
          etapes: [["596 + ? = 600", 4], ["600 + ? = 604", 4], ["604 − 596 = ?", 8]],
          bilan: "De part et d’autre d’une centaine ou d’un millier, j’avance du petit au grand : 402 − 397 = 3 + 2 = 5."
        })
      }
      // (Lot « couverture », 06/11/2026 : l'ancien niveau 3, le millier, est
      // dans le niveau 2. Les identifiants restent : A8-3 n'existe plus.)
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

  // (« double de □ = 12 » cherche la moitié de 12 : lot « couverture ».)
  const M1_MOITIES = Object.freeze(["moitie", "trou-double", "division", "double-de-trou"]);
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
    // Lot « couverture » : les écritures officielles du CP, « double de □ = 12 »
    // et « moitié de □ = 8 ».
    // (rangé avec « 2 × □ = 12 » : on cherche le nombre qu'on a doublé)
    if (forme === "double-de-trou") return Object.freeze(Object.assign({}, fabriquer("M1", niveau, forme, ["double de", TROU, "=", n], r, donnees), {forme: "trou-double"}));
    if (forme === "moitie-de-trou") {
      const trou = fabriquer("M1", niveau, forme, ["moitié de", TROU, "=", n], r, donnees);
      return Object.freeze(Object.assign({}, trou, {cle: `${trou.cle}-q`}));
    }
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

  // Le double sur le boulier (lot 3a, 13/11/2026, idée et choix de
  // Gwenaël : « les deux 17 déjà poussés ») : le nombre, et encore le nombre
  // en dessous, rangée par rangée — double de 17 : 10, 7, puis 10, 7. Rien
  // à pousser : on lit les rangées. Dans la leçon, les égalités sont
  // écrites dessous (10 + 10, 7 + 7, puis 20 + 14, comme le schéma en
  // barres) ; à l'entraînement, rien n'est écrit, l'élève lit le boulier.
  // Seulement le double, jusqu'à 50 (100 perles) ; la moitié garde le
  // schéma en barres.
  function m1Perles(calcul) {
    if (calcul.forme !== "double") return null;
    const {n, r} = calcul.donnees;
    if (n > 50) return null;
    const k = Math.floor(n / 10);
    const u = n % 10;
    const t = 10 * k;
    const moitie = [...Array.from({length: k}, () => 10), ...(u ? [u] : [])];
    const fait = (debut, fin) => Object.freeze({apres: 0, attente: `${debut} = …`, texte: `${debut} = ${fin}`});
    const traces = k && u
      ? [fait(`${t} + ${t}`, 2 * t), fait(`${u} + ${u}`, 2 * u), fait(`double de ${n} = ${2 * t} + ${2 * u}`, r)]
      : [fait(`double de ${n} = ${n} + ${n}`, r)];
    return Object.freeze({
      outil: "perles", depart: r, rangees: Object.freeze([...moitie, ...moitie]), texte: `double de ${n}`,
      gestes: Object.freeze([]), consigne: `${n}, et encore ${n} en dessous.`, traces: Object.freeze(traces)
    });
  }

  // Du plus simple au plus dur : le double, puis la moitié, puis les autres
  // écritures ; un morceau de plus ; un morceau impair (moitié de 30) ; la
  // taille.
  const M1_FORMES = Object.freeze({double: 0, moitie: 1, "trou-double": 2, "double-fois": 2, division: 2, "double-de-trou": 2, "moitie-de-trou": 2});
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
      moitie: [2, ...entre(4, 40, 2), 50, 60, 70, 80, 90, 100],
      "trou-double": [...entre(12, 40, 2), 50, 60, 70, 80, 90, 100],
      "double-de-trou": [...entre(4, 20, 2), 40, 60, 80, 100],
      "moitie-de-trou": [...entre(2, 10), 20, 30, 40, 50]
    }),
    2: Object.freeze({
      double: [25, 35, 45, 75, 60, 70, 80, 90, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900],
      moitie: [120, 140, 160, 180, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000, 3000, 5000],
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
  // Relecture 2 (08/11/2026, remarque de Gwenaël sur M1-1) : le double et
  // la moitié suivent le même chemin. « Je représente » a aussi ses étapes
  // (`etapesRepresente`) : le schéma en barres au-dessus se remplit à chaque
  // égalité, comme dans J'écris (double de 17 : 10 + 10, 7 + 7, 20 + 14).
  function m1Apprends({manipule = false, represente, ecris, consigne, consigneEcris, etapes, etapesRepresente = null, bilan, autre = null}) {
    const enEtapes = liste => Object.freeze(liste.map(([texte, reponse]) => Object.freeze({texte: texte.replace("?", CASE), reponse})));
    const representeSimple = Object.freeze({
      outil: "barres", consigne,
      texte: represente.texte, reponse: represente.reponse,
      image: Object.freeze(m1Aide(represente)),
      solution: Object.freeze({image: m1Image(represente), phrase: m1Phrase(represente)})
    });
    return Object.freeze({
      exemple: Object.freeze({texte: represente.texte.replace(` = ${CASE}`, "").replace(CASE, "?"), reponse: represente.reponse}),
      // Lot 3a : le boulier (M1-1), sur le calcul du schéma.
      manipule: manipule ? m1Perles(represente) : null,
      represente: etapesRepresente
        ? ecrisAvecDessins(Object.assign({}, representeSimple, {etapes: enEtapes(etapesRepresente)}), barresDessins(m1Image(represente), etapesRepresente.length))
        : representeSimple,
      ecris: ecrisAvecDessins({
        consigne: consigneEcris,
        etapes: enEtapes(etapes),
        reponse: ecris.reponse,
        solution: Object.freeze({image: m1Image(ecris), phrase: m1Phrase(ecris)})
      }, barresDessins(m1Image(ecris), etapes.length)),
      bilan,
      ...autreDe(autre),
      // Lot 3a : À retenir dessine le calcul montré.
      image: Object.freeze(m1Image(represente)),
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: represente, ecris: ecris}),
      textes: Object.freeze([represente.texte, represente.texte, ecris.texte])
    });
  }

  const M1 = {
    id: "M1", nom: "Doubles et moitiés", exemple: "double de 17",
    famille: "M", construit: true,
    aide_entraine: "barres",
    erreurs: M1_ERREURS, image: m1Image, aide: m1Aide,
    // Lot 7e-2 (choix de Gwenaël) : au premier calcul de moitié, le dessin
    // de l'annonce — 46 = 40 + 6, chaque morceau coupé en deux (20 et 3) ;
    // l'élève les réunit (20 + 3 = 23).
    aideNouveau: calcul => (estMoitie(calcul) && morceauxDe(calcul.donnees.n).length > 1
      ? Object.assign(m1Aide(calcul), {trouves: morceauxDe(calcul.donnees.n).map((_, i) => i), fini: false}) : null),
    // Lot 3a : le boulier pour le double, au niveau 1 seulement.
    manipulation: calcul => (calcul.niveau === 1 ? m1Perles(calcul) : null), difficulte: m1Difficulte,
    niveaux: [
      {
        n: 1, titre: "doubles de 1 à 20, moitiés des pairs jusqu’à 40, dizaines", nom: "Doubles et moitiés jusqu’à 40", palier: 1, type: "F",
        composer: m1Niveau(1, [4, 4, 2, 1, 1]),
        imposes: [m1Calcul(1, "moitie", 60), m1Calcul(1, "trou-double", 70)],
        apprends: m1Apprends({
          manipule: true,
          represente: m1Calcul(0, "double", 17),
          ecris: m1Calcul(0, "double", 14),
          consigne: "double de 17 = 17 + 17",
          etapesRepresente: [["10 + 10 = ?", 20], ["7 + 7 = ?", 14], ["double de 17 = ?", 34]],
          consigneEcris: "double de 14 = 10 + 10 + 4 + 4",
          etapes: [["10 + 10 = ?", 20], ["4 + 4 = ?", 8], ["double de 14 = ?", 28]],
          bilan: "Le double, c’est le nombre et encore le nombre : double de 17 = 17 + 17 = 34.",
          // Décision 5 du lot 3 : la leçon sur le double ; la moitié arrive
          // à l'entraînement (« Nouveau : on cherche la moitié »).
          autre: {phrase: "La moitié, c’est le nombre qu’on double :", calcul: "moitié de 34 = 17"}
        })
      },
      {
        n: 2, titre: "nombres usuels (25, 75, 150, 600, 1 200…)", nom: "Doubles et moitiés des nombres usuels", palier: 1, type: "F",
        composer: m1Niveau(2, [5, 5, 2]),
        imposes: [m1Calcul(2, "moitie", 1200), m1Calcul(2, "double-fois", 250)],
        apprends: m1Apprends({
          represente: m1Calcul(0, "double", 75),
          ecris: m1Calcul(0, "double", 250),
          consigne: "double de 75 = 2 × 75",
          etapesRepresente: [["2 × 70 = ?", 140], ["2 × 5 = ?", 10], ["double de 75 = ?", 150]],
          consigneEcris: "double de 250 = 2 × 250",
          etapes: [["2 × 200 = ?", 400], ["2 × 50 = ?", 100], ["double de 250 = ?", 500]],
          bilan: "Ces doubles-là, je les sais par cœur : double de 75 = 150.",
          autre: {phrase: "La moitié, c’est le nombre qu’on double :", calcul: "moitié de 150 = 75"}
        })
      },
      {
        n: 3, titre: "n’importe quel nombre (46, 136, 470…)", nom: "Doubles et moitiés en découpant", palier: 1, type: "P",
        composer: m1Niveau(3, [4, 4, 2]),
        imposes: [m1Calcul(3, "moitie", 470), m1Calcul(3, "double", 136), m1Calcul(3, "division", 92)],
        apprends: m1Apprends({
          represente: m1Calcul(0, "double", 470),
          ecris: m1Calcul(0, "double", 36),
          consigne: "double de 470 = 2 × 470",
          etapesRepresente: [["2 × 400 = ?", 800], ["2 × 70 = ?", 140], ["double de 470 = ?", 940]],
          consigneEcris: "double de 36 = 2 × 30 + 2 × 6",
          etapes: [["2 × 30 = ?", 60], ["2 × 6 = ?", 12], ["double de 36 = ?", 72]],
          bilan: "Pour le double, je double chaque morceau : double de 470 = 2 × 400 + 2 × 70 = 940.",
          // Lot 7e-2 (choix de Gwenaël, calcul mental CP p. 5 et CE1 p. 9) :
          // la moitié se découpe aussi (46 = 40 + 6) ; annoncée avec son
          // dessin au premier calcul de moitié (NOUVEAUTES).
          autre: {phrase: "Pour la moitié, je coupe aussi en morceaux :", calcul: "moitié de 46 = 20 + 3 = 23"}
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
  // (Lot 3a : « = □ » s'efface seulement à la fin — « 144 + 237 = □ + 239 »
  // devenait « 144 + 237 + 239 ».)
  const exempleDe = calcul => Object.freeze({texte: (calcul.texte.endsWith(` = ${CASE}`) ? calcul.texte.slice(0, -` = ${CASE}`.length) : calcul.texte).replace(CASE, "?"), reponse: calcul.reponse});

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
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: represente, ecris: ecris}),
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
    // Lot « couverture » : la case à la place du premier facteur (42 = □ × 6).
    // (rangé avec « 42 = 6 × □ » : l'égalité à l'envers)
    if (forme === "trou-egal-gauche") return Object.freeze(Object.assign({}, fabriquer(module, niveau, forme, [p, "=", TROU, "×", a], b, donnees), {forme: "trou-egal"}));
    const egal = fabriquer(module, niveau, "trou-egal", [p, "=", a, "×", TROU], b, donnees);
    return Object.freeze(Object.assign({}, egal, {cle: `${egal.cle}-x`}));
  }

  // Les erreurs connues des faits (M4, M5). (Lot « couverture » : aucune
  // avec un facteur 1 — « 60 = 1 × □ » : chaque phrase dirait la réponse.)
  const sansUn = test => (calcul, reponse) => ![0, 1].includes(calcul.donnees.a) && ![0, 1].includes(calcul.donnees.b) && test(calcul, reponse);
  const FAITS_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "un rang de la table à côté",
      test: sansUn(sauf((calcul, reponse) => {
        if (calcul.forme !== "produit") return false;
        const {a, b, p, table} = calcul.donnees;
        return (calcul.module === "M5" ? [table] : [a, b]).some(x => memeNombre(reponse, p + x) || memeNombre(reponse, p - x));
      })),
      retour: (calcul, reponse) => {
        const {a, b, p, table} = calcul.donnees;
        const x = (calcul.module === "M5" ? [table] : [a, b]).find(y => memeNombre(reponse, p + y) || memeNombre(reponse, p - y));
        return fr(`${f(reponse)}, c’est ${f(x)} × ${f(reponse / x)}. Ici, c’est ${f(x)} × ${f(p / x)} : ${calcul.module === "M4" ? "compte les sauts sur la bande" : "compte les parts"}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "à 1 près",
      test: sansUn(sauf((calcul, reponse) => calcul.forme !== "produit" && Number.isInteger(reponse) && Math.abs(reponse - calcul.reponse) === 1)),
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
      test: sansUn(sauf((calcul, reponse) => calcul.forme === "produit" && memeNombre(reponse, calcul.donnees.a + calcul.donnees.b))),
      retour: (calcul, reponse) => {
        const {a, b} = calcul.donnees;
        return fr(`${f(reponse)}, c’est ${f(a)} + ${f(b)}. Ici, on multiplie : ${f(b)} fois ${f(a)}.`);
      },
      gras: 0
    })
  ]);

  // Du plus simple au plus dur : le produit, puis le nombre manquant, puis
  // l'égalité à l'envers, puis la division ; puis la taille du produit.
  const FAITS_FORMES = Object.freeze({produit: 0, "trou-facteur": 1, "trou-egal": 2, "trou-egal-gauche": 2, division: 3});
  const faitDifficulte = calcul => FAITS_FORMES[calcul.forme] * 1000 + calcul.donnees.p;

  // ---- M4 : la bande de la table, le rectangle de points
  //
  // Décision du 01/11 (planche « choix-6 ») : un produit se lit sur la bande
  // de la table (8 × 7 : on compte de 7 en 7 jusqu'à « 8 × 7 » ; voir plus
  // bas, lot 2b du 12/11). Une division
  // ou un nombre manquant se lit sur le rectangle de points : 56 ÷ 7, « dans
  // 56, combien de fois 7 ? », 56 points rangés par 7.
  //
  // Lot 2b (12/11/2026, demande de Gwenaël) : 8 × 7, c'est « 8 fois 7 » —
  // on compte de 7 en 7 jusqu'à 8 × 7, comme la bande de Défi tables
  // (n × table). La bande d'un produit a × b est donc celle de b, et on y
  // cherche le rang a (avant : celle de la petite table, quel que soit son
  // côté : 7 × 8 se comptait de 7 en 7).
  function m4Image(calcul) {
    const {a, b, p} = calcul.donnees;
    // × 1 (lot « couverture ») : une colonne de points — la bande de la
    // table écrirait la réponse (« 4 × 1 », « + 1 »).
    if (calcul.forme === "produit" && (a === 1 || b === 1)) return {outil: "points", rangees: p, parRangee: 1};
    return calcul.forme === "produit"
      ? {outil: "bande", table: b, cherche: a}
      : {outil: "points", rangees: p / a, parRangee: a};
  }
  const m4Aide = calcul => Object.assign(m4Image(calcul), {masque: true});
  function m4Phrase(calcul) {
    const {a, b, p} = calcul.donnees;
    if (calcul.forme !== "produit") return fr(`Regarde : dans ${f(p)}, il y a ${f(p / a)} fois ${f(a)}.`);
    return fr(`Regarde : ${f(a)} × ${f(b)} = ${f(p)}.`);
  }

  // M4-1 : au moins un facteur de 2 à 5, l'autre de 2 à 10. M4-2 : les deux
  // de 6 à 10, au moins un de 6 à 9 (le reste des tables) : les deux niveaux
  // n'ont aucun calcul commun.
  function m4Vivier(niveau) {
    const paires = [];
    for (let a = 2; a <= 10; a += 1) for (let b = 2; b <= 10; b += 1) {
      const petit = Math.min(a, b);
      // (Lot « couverture » : 10 × 10 au niveau 2, table de 10 du CE1.)
      const ok = niveau === 1 ? petit <= 5 : petit >= 6;
      if (ok) paires.push([a, b]);
    }
    // Relecture 2b (11/11/2026, remarque 47) : au niveau 2, × 10 est rare
    // (9 paires sur 25 avant : trois × 10 dans les quatre premiers calculs)
    // — les tables de 6 à 9 d'abord. On garde 10 × 10, 7 × 10 et 10 × 8 ;
    // pour ÷ et le nombre manquant, aucun, sauf « 70 = 7 × □ » (un imposé).
    const avecDix = ([a, b]) => a === 10 || b === 10;
    const dixGardes = niveau === 2 ? [[10, 10], [7, 10], [10, 8]] : null;
    const garder = (liste, gardes) => (niveau === 2 ? liste.filter(paire => !avecDix(paire) || gardes.some(([x, y]) => x === paire[0] && y === paire[1])) : liste);
    const pairesProduit = garder(paires, dixGardes || []);
    const pairesAutres = garder(paires.filter(([a]) => a <= 9), []);
    const pairesEgal = garder(paires.filter(([a]) => a <= 9), [[7, 10]]);
    // La table d'un produit : niveau 1, le facteur de 2 à 5 (le plus grand
    // des deux s'ils le sont tous les deux) ; niveau 2, le facteur de 6 à 9.
    const tableDe = (a, b) => {
      const candidates = [a, b].filter(x => (niveau === 1 ? x <= 5 : x <= 9));
      return candidates.length ? Math.max(...candidates) : 10;
    };
    return Object.freeze({
      produit: pairesProduit.map(([a, b]) => faitCalcul("M4", niveau, "produit", a, b, tableDe(a, b))),
      division: pairesAutres.map(([a, b]) => faitCalcul("M4", niveau, "division", a, b)),
      "trou-facteur": pairesAutres.map(([a, b]) => faitCalcul("M4", niveau, "trou-facteur", a, b)),
      "trou-egal": pairesEgal.map(([a, b]) => faitCalcul("M4", niveau, "trou-egal", a, b)),
      "trou-egal-gauche": pairesAutres.map(([a, b]) => faitCalcul("M4", niveau, "trou-egal-gauche", a, b)),
      // Lot « couverture » (relecture Codex) : la table avec 1 (CE1), au
      // niveau 1, de temps en temps. (Pas × 0 : aucune réponse de l'appli
      // n'est 0.)
      // (La bande de la table de 1 : celle de 7 dirait « + 7 », la réponse.)
      ...(niveau === 1 ? {unZero: [1].flatMap(u => [faitCalcul("M4", 1, "produit", 1, 1, 1), ...entre(2, 10).flatMap(x => [faitCalcul("M4", 1, "produit", x, u, u), faitCalcul("M4", 1, "produit", u, x, u)])])} : {})
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
    // (Relecture 2b : un × 10 du niveau 2 passe après les tables de 6 à 9.)
    erreurs: FAITS_ERREURS, image: m4Image, aide: m4Aide, phrase: m4Phrase, manipulation: () => null,
    difficulte: calcul => faitDifficulte(calcul) + (M4.tardif(calcul) ? 500 : 0),
    tardif: calcul => calcul.niveau === 2 && (calcul.donnees.a === 10 || calcul.donnees.b === 10)
  };
  M4.niveaux = [
    {
      n: 1, titre: "tables de 2 à 5 : ×, ÷, nombre manquant", nom: "Tables de 2 à 5 dans tous les sens", palier: 1, type: "F",
      composer: vivierNiveau(M4_VIVIERS[1], [4, 3, 2, 1, 1, 1]),
      imposes: [m4Fait(1, "trou-facteur", 3, 8), m4Fait(1, "trou-egal", 4, 3)],
      apprends: apprendsSansManip({
        fiche: M4,
        represente: faitCalcul("M4", 0, "produit", 7, 4, 4),
        ecris: faitCalcul("M4", 0, "division", 5, 4),
        consigne: "Je compte de 4 en 4 jusqu’à « 7 × 4 ».",
        consigneEcris: "20 ÷ 5 : combien de fois 5 dans 20 ?",
        etapes: [["5 × ? = 20", 4], ["20 ÷ 5 = ?", 4]],
        dessins: (calcul, n) => finiDessins(m4Image(calcul), n),
        retenir: {outil: "points", rangees: 7, parRangee: 4, colonnes: true},
        // Lot 3a : le calcul montré, une égalité par ligne.
        bilan: "7 × 4 = 4 × 7 = 28. Dans 28, il y a 7 fois 4 : 28 ÷ 4 = 7. Il y a aussi 4 fois 7 : 28 ÷ 7 = 4."
      })
    },
    {
      n: 2, titre: "toutes les tables : ×, ÷, nombre manquant", nom: "Toutes les tables dans tous les sens", palier: 1, type: "F",
      composer: vivierNiveau(M4_VIVIERS[2], [5, 3, 2, 1, 1]),
      imposes: [m4Fait(2, "division", 7, 8), m4Fait(2, "trou-facteur", 6, 9), m4Fait(2, "trou-egal", 7, 10)],
      apprends: apprendsSansManip({
        fiche: M4,
        represente: faitCalcul("M4", 0, "produit", 8, 7, 7),
        ecris: faitCalcul("M4", 0, "division", 6, 9),
        consigne: "Je compte de 7 en 7 jusqu’à « 8 × 7 ».",
        consigneEcris: "54 ÷ 6 : combien de fois 6 dans 54 ?",
        etapes: [["6 × ? = 54", 9], ["54 ÷ 6 = ?", 9]],
        dessins: (calcul, n) => finiDessins(m4Image(calcul), n),
        retenir: {outil: "points", rangees: 8, parRangee: 7, colonnes: true},
        bilan: "8 × 7 = 7 × 8 = 56. Dans 56, il y a 8 fois 7 : 56 ÷ 7 = 8. Il y a aussi 7 fois 8 : 56 ÷ 8 = 7."
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
  // `aLaFin` (lot 3a, M5-1 : 6 × 25 = 4 × 25 + 2 × 25) : la réponse
  // n'apparaît qu'à la dernière étape, pas dès la première.
  function partsDessins(image, etapes, aLaFin = false) {
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: vus.length > 0, fini: aLaFin ? vus.length >= etapes : vus.length > 0})));
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
    // (Lot « couverture » : plus de 100 ÷ 10 — chaque part vaut 10, et la
    // réponse aussi : le dessin la donnerait.)
    [[100, [2, 4, 5, 20, 50]], [60, [2, 3, 4, 5, 6, 10, 12, 15, 20, 30]]].forEach(([n, diviseurs]) => diviseurs.forEach(d => {
      v.division.push(faitCalcul("M5", 1, "division", d, n / d, n));
      if (d <= 12) {
        v["trou-egal"].push(faitCalcul("M5", 1, "trou-egal", d, n / d, n));
        v["trou-facteur"].push(faitCalcul("M5", 1, "trou-facteur", d, n / d, n));
      }
    }));
    [3, 6, 8].forEach(k => v["trou-facteur"].push(faitCalcul("M5", 1, "trou-facteur", k, 25, 25)));
    // (Lot 3a, décision 12 : plus de « × 1 », 1 × 25 ni 60 = 1 × □.)
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
        ecris: faitCalcul("M5", 0, "produit", 6, 25, 25),
        consigne: "100, c’est 4 fois 25.",
        consigneEcris: "6 × 25 = 4 × 25 + 2 × 25",
        // (4 × 25 = 100 est sur le dessin : on ne le redemande pas.)
        etapes: [["2 × 25 = ?", 50], ["6 × 25 = ?", 150]],
        dessins: (calcul, n) => partsDessins(m5Image(calcul), n, true),
        bilan: "100 = 4 × 25. 3 × 25 = 75."
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
      n: 1, titre: "× 4\u00a0: le double du double", nom: "× 4 : le double du double", palier: 1, type: "P",
      composer: vivierNiveau(M6_VIVIERS[1], [7, 3]),
      imposes: [m6Calcul(1, 4, 38, true), m6Calcul(1, 4, 47)],
      apprends: apprendsSansManip({
        fiche: M6,
        represente: m6Calcul(0, 4, 23),
        ecris: m6Calcul(0, 4, 37, true),
        consigne: "Je double 23, puis je double encore.",
        consigneEcris: "4 × 37 = 2 × 2 × 37",
        // Lot 7e-2 (choix de Gwenaël, livret CE2 p. 20 ; calcul mental CE2,
        // p. 11) : les doubles successifs, chacun sur le résultat d'avant.
        etapes: [["2 × 37 = ?", 74], ["2 × 74 = ?", 148]],
        dessins: (calcul, n) => barresFoisDessins(m6Image(calcul), n),
        bilan: "× 4, c’est le double du double : 2 × 23 = 46. 23 × 4 = 2 × 46 = 92."
      })
    },
    {
      n: 2, titre: "× 8\u00a0: doubler trois fois", nom: "× 8 : doubler trois fois", palier: 1, type: "P",
      composer: vivierNiveau(M6_VIVIERS[2], [7, 3]),
      imposes: [m6Calcul(2, 8, 26, true), m6Calcul(2, 8, 17)],
      apprends: apprendsSansManip({
        fiche: M6,
        represente: m6Calcul(0, 8, 15),
        ecris: m6Calcul(0, 8, 27, true),
        consigne: "Je double 15, puis encore, puis encore.",
        consigneEcris: "8 × 27 = 2 × 2 × 2 × 27",
        etapes: [["2 × 27 = ?", 54], ["2 × 54 = ?", 108], ["2 × 108 = ?", 216]],
        dessins: (calcul, n) => barresFoisDessins(m6Image(calcul), n),
        bilan: "× 8, c’est doubler trois fois : 2 × 15 = 30. 2 × 30 = 60. 15 × 8 = 2 × 60 = 120."
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
        consigneEcris: "6 × 14 = 10 × 6 + 4 × 6",
        etapes: [["10 × 6 = ?", 60], ["4 × 6 = ?", 24], ["6 × 14 = ?", 84]],
        dessins: (calcul, n) => rectangleDessins(m8Image(calcul), n),
        bilan: "13 fois 7, c’est 10 fois 7 plus 3 fois 7 : 13 × 7 = 70 + 21 = 91."
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
        // (Relecture 2b, remarque 68 : plus de « Je coupe », l'égalité.)
        consigne: "23 × 7 = 20 × 7 + 3 × 7",
        consigneEcris: "6 × 47 = 40 × 6 + 7 × 6",
        etapes: [["40 × 6 = ?", 240], ["7 × 6 = ?", 42], ["6 × 47 = ?", 282]],
        dessins: (calcul, n) => rectangleDessins(m8Image(calcul), n),
        bilan: "23 fois 7, c’est 20 fois 7 plus 3 fois 7 : 23 × 7 = 20 × 7 + 3 × 7 = 140 + 21 = 161."
      })
    },
    {
      n: 3, titre: "× 11, × 12, × 21, × 31 (et nombre manquant)", nom: "× 11, × 12, × 21, × 31", palier: 2, type: "P",
      composer: vivierNiveau(M8_VIVIERS[3], [4, 4, 2]),
      imposes: [m8Calcul(3, 42, 12), m8Trou(3, 35, 21)],
      apprends: apprendsSansManip({
        fiche: M8,
        represente: m8Calcul(0, 43, 21),
        ecris: m8Calcul(0, 35, 12),
        consigne: "21 fois 43, c’est 20 fois 43 plus 1 fois 43.",
        consigneEcris: "12 × 35 = 10 × 35 + 2 × 35",
        etapes: [["10 × 35 = ?", 350], ["2 × 35 = ?", 70], ["12 × 35 = ?", 420]],
        dessins: (calcul, n) => rectangleDessins(m8Image(calcul), n),
        bilan: "21 fois 43, c’est 20 fois 43 plus 1 fois 43 : 21 × 43 = 860 + 43 = 903."
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
  // « 200 × □ = 1 400 » (lot « couverture ») : la réponse est le chiffre
  // c2 ; la table se lit à l'envers.
  function m3Trou(niveau, x, c) {
    const calcul = m3Calcul(niveau, x, c);
    const {r} = calcul.donnees;
    return Object.freeze(Object.assign({}, fabriquer("M3", niveau, "trou-facteur", [x, "×", TROU, "=", r], c, calcul.donnees)));
  }
  const m3Rangs = calcul => colonnesDe(calcul.donnees.p);
  const m3Image = calcul => ({outil: "tableau-fleches", depart: calcul.donnees.t, arrivee: calcul.donnees.r, p: calcul.donnees.p, operation: "×"});
  // Le trou : le nombre du bas est donné (1 400), celui du haut (14) est à
  // trouver.
  const m3Aide = calcul => Object.assign(m3Image(calcul), calcul.forme === "trou-facteur" ? {haut: "cherche"} : {inconnue: true});
  function m3Phrase(calcul) {
    const {c1, c2, t, p, r} = calcul.donnees;
    if (calcul.forme === "trou-facteur") return fr(`Regarde : ${f(r)} = ${t} × ${f(p)}, et ${c1} × ${c2} = ${t}.`);
    return fr(`Regarde : ${c1} × ${c2} = ${t}, et ${t} × ${f(p)} = ${f(r)}.`);
  }
  // Le glisse-nombres, après la table : le résultat de la table glisse de
  // autant de colonnes qu'il y a de zéros.
  // Relecture 2b (11/11/2026, remarque 46, vu en jouant M3-3) : le
  // glisse-nombres ne glisse que de 3 colonnes (× 1 000) et n'a que six
  // colonnes ; « 4 000 × 70 » (× 10 000) était refusé sans fin, l'élève
  // restait bloqué. Au-delà, pas de geste : l'outil de l'entraînement est
  // l'image (le tableau à flèches), comme pour un trou.
  const GLISSE_MAX = 3;
  function m3Manipulation(calcul) {
    if (calcul.forme === "trou-facteur") return null;
    const {c1, c2, t, p, r} = calcul.donnees;
    const k = m3Rangs(calcul);
    if (k > GLISSE_MAX || r >= 1000000) return null;
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
    return m3Rangs(calcul) * 1000 + (calcul.forme === "produit-gauche" ? 200 : calcul.forme === "trou-facteur" ? 5000 : 0) + t;
  }
  // (« 200 × □ = 1 400 », lot « couverture » : aucune de ces causes n'a de
  // sens pour un trou.)
  const sansTrou = test => (calcul, reponse) => calcul.forme !== "trou-facteur" && test(calcul, reponse);
  const M3_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "un rang de trop ou de moins",
      test: sansTrou(sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.r * 10) || memeNombre(reponse, calcul.donnees.r / 10))),
      retour: (calcul, reponse) => {
        const {x, y, c1, c2, t, p, r} = calcul.donnees;
        return fr(`${f(reponse)} : un rang de ${reponse > r ? "trop" : "moins"}. ${f(x)} × ${f(y)} = ${c1} × ${c2} × ${f(p)} : chaque chiffre de ${t} vaut ${f(p)} fois plus.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "la table fausse",
      test: sansTrou(sauf((calcul, reponse) => {
        const {c1, c2, t, p} = calcul.donnees;
        const q = reponse / p;
        return Number.isInteger(q) && q !== t && [c1, c2].includes(Math.abs(q - t));
      })),
      retour: calcul => {
        const {c1, c2} = calcul.donnees;
        return fr(`La table d’abord : combien font ${c1} × ${c2} ?`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "additionné au lieu de multiplier",
      test: sansTrou(sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.x + calcul.donnees.y))),
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
      [[10, 10], [10, 100], [100, 10], [10, 1000], [1000, 10], [100, 100], [100, 1000], [1000, 100]].forEach(([q1, q2]) =>
        chiffres29.forEach(a => chiffres29.forEach(c => ajouter(a * q1, c * q2))));
      // Lot « couverture » : des milliers entre eux (9 000 × 7 000, CM2).
      chiffres29.forEach(a => chiffres29.forEach(c => ajouter(a * 1000, c * 1000)));
      // « Combien de fois 200 dans 1 400 ? » : 200 × □ = 1 400 (niveau
      // attendu en fin de 6e, Éduscol).
      const trous = [];
      [10, 100].forEach(q => chiffres29.forEach(a => chiffres29.forEach(c => trous.push(m3Trou(3, a * q, c)))));
      // Relecture 2b (11/11/2026, remarque 46) : pas de produit d'un
      // million ou plus — le glisse-nombres n'a que six colonnes, l'élève
      // restait bloqué (500 × 7 000, 9 000 × 2 000…).
      const tient = c => c.reponse < 1000000;
      return Object.freeze({produit: [...v.produit, ...v["produit-gauche"]].filter(tient), "trou-facteur": trous.filter(tient)});
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
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: manipule, ecris: ecris}),
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
          bilan: "Je fais la table, puis chaque chiffre vaut 10 fois plus : 9 × 40 = 9 × 4 × 10 = 360."
        })
      },
      {
        n: 2, titre: "un chiffre × centaines, milliers", nom: "Un chiffre × centaines, milliers", palier: 2, type: "P",
        composer: vivierNiveau(M3_VIVIERS[2], [7, 3]),
        imposes: [m3Calcul(2, 9, 400), m3Calcul(2, 6, 3000)],
        apprends: m3Apprends({
          manipule: m3Calcul(0, 6, 300),
          represente: m3Calcul(0, 7, 400),
          ecris: m3Calcul(0, 4, 700),
          consigne: "7 × 400 = 7 × 4 × 100",
          consigneEcris: "4 × 700 = 4 × 7 × 100",
          etapes: [["4 × 7 = ?", 28], ["4 × 700 = ?", 2800]],
          bilan: `Je fais la table, puis chaque chiffre vaut 100 fois plus : 6 × 300 = 6 × 3 × 100 = 1${ESPACE_FINE}800.`
        })
      },
      {
        n: 3, titre: "dizaines, centaines, milliers entre eux", nom: "Dizaines, centaines, milliers entre eux", palier: 3, type: "P",
        composer: vivierNiveau(M3_VIVIERS[3], [8, 2]),
        imposes: [m3Calcul(3, 90, 20), m3Calcul(3, 900, 700), m3Calcul(3, 3000, 20)],
        apprends: m3Apprends({
          manipule: m3Calcul(0, 90, 20),
          represente: m3Calcul(0, 400, 30),
          ecris: m3Calcul(0, 30, 80),
          consigne: `400 × 30 = 4 × 3 × 1${ESPACE_FINE}000`,
          consigneEcris: "30 × 80 = 3 × 8 × 100",
          etapes: [["3 × 8 = ?", 24], ["30 × 80 = ?", 2400]],
          bilan: `Je fais la table, puis chaque chiffre vaut 100 fois plus : 90 × 20 = 9 × 2 × 100 = 1${ESPACE_FINE}800.`
        })
      }
    ]
  };

  // ======================================== modules lot 4 (04/11/2026) :
  // M7, M10, M12, C1, C3, le palier 2 sur les entiers. Décisions de Gwenaël
  // (questions à choix, planches « choix-1 » à « choix-5 ») :
  //  - M7 : le glisse-nombres (× 10, × 100), puis le nombre dix fois, coupé
  //    en deux : × 5, c'est la moitié de × 10 ;
  //  - M10 : l'arc entre les facteurs qui font 10 (ou 100), sans manipulation ;
  //  - M12 : la barre coupée en deux morceaux (96 = 80 | 16), chacun partagé ;
  //  - C1 : je touche d'abord ce que je calcule en premier (la parenthèse se
  //    referme sur son nombre), puis l'escalier d'accolades ;
  //  - C3 : deux barres de la même longueur, COLLÉES (comme les rangées de M1
  //    et de M6), le bout retiré hachuré gris, son nombre posé dessus, sans
  //    « − » (comme le retrait de SPLAT! Enquête).

  // Une clé faite à la main (C1, C3 : deux écritures peuvent avoir les mêmes
  // nombres) : le module, le niveau, un numéro d'écriture, puis les nombres.
  const avecCle = (calcul, cle) => Object.freeze(Object.assign({}, calcul, {cle}));
  const sansEspace = texte => String(texte).replace(/[  ]/g, " ");

  // ------------------------------------------------- M7 : × 5, × 50
  //
  // « 46 × 5 » ou « 5 × 46 » : n, fois (5 ou 50), p (10 ou 100 : × 5 est la
  // moitié de × 10, × 50 la moitié de × 100), dix (n × p), r.
  function m7Calcul(niveau, n, fois, gauche = false) {
    const p = fois * 2;
    const r = n * fois;
    const donnees = {n, fois, p, dix: n * p, r, somme: n + fois, plus: r * 10, moins: r / 10};
    return gauche
      ? fabriquer("M7", niveau, "produit-gauche", [fois, "×", n, "=", TROU], r, donnees)
      : fabriquer("M7", niveau, "produit", [n, "×", fois, "=", TROU], r, donnees);
  }
  const m7Image = calcul => ({outil: "dix-fois", n: calcul.donnees.n, p: calcul.donnees.p});
  const m7Aide = calcul => Object.assign(m7Image(calcul), {masque: true});
  function m7Phrase(calcul) {
    const {n, p, dix, r} = calcul.donnees;
    return fr(`Regarde : ${f(n)} × ${f(p)} = ${f(dix)}, et la moitié de ${f(dix)}, c’est ${f(r)}.`);
  }
  // Le glisse-nombres : × 10 (× 100 pour × 50), d'abord.
  function m7Manipulation(calcul) {
    const {n, fois, p, dix} = calcul.donnees;
    const k = colonnesDe(p);
    return Object.freeze({
      outil: "glisse", depart: n, colonnes: COLONNES_M2, decalage: k,
      texte: calcul.texte.replace(` = ${CASE}`, ""),
      consigne: fr(`${f(n)} × ${fois} : d’abord ${f(n)} × ${f(p)}. Glisse ${f(n)} : chaque chiffre vaut ${f(p)} fois plus.`),
      refus: fr(`Chaque chiffre doit valoir ${f(p)} fois plus : ${pluriel(k, "colonne")}.`),
      traces: Object.freeze([Object.freeze({apres: 1, attente: `${f(n)} × ${f(p)} = …`, texte: `${f(n)} × ${f(p)} = ${f(dix)}`})])
    });
  }
  // Du plus simple au plus dur : les facteurs à leur place, puis un nombre
  // impair (sa moitié finit par 5), puis la taille.
  function m7Difficulte(calcul) {
    const {n} = calcul.donnees;
    return (calcul.forme === "produit-gauche" ? 1000 : 0) + (n % 2 ? 500 : 0) + n;
  }
  const M7_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "× 10 sans prendre la moitié",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.dix)),
      retour: (calcul, reponse) => {
        const {n, fois, p} = calcul.donnees;
        return fr(`${f(reponse)}, c’est ${f(n)} × ${f(p)}. ${f(n)} × ${fois}, c’est la moitié de ${f(reponse)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "un rang de trop ou de moins",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.plus) || memeNombre(reponse, calcul.donnees.moins)),
      retour: (calcul, reponse) => {
        const {n, fois, p, dix, r} = calcul.donnees;
        return fr(`${f(reponse)} : un rang de ${reponse > r ? "trop" : "moins"}. ${f(n)} × ${fois}, c’est la moitié de ${f(n)} × ${f(p)} = ${f(dix)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "additionné au lieu de multiplier",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.somme)),
      retour: (calcul, reponse) => {
        const {n, fois, p} = calcul.donnees;
        return fr(`${f(reponse)}, c’est ${f(n)} + ${fois}. Ici, on multiplie : ${f(n)} × ${f(p)}, puis la moitié.`);
      },
      gras: 0
    })
  ]);
  // Les nombres : jamais une dizaine entière (40 × 5 : M3), jamais 25
  // (5 × 25 : M5). M7-1 : pairs de 12 à 98 ; M7-2 : tous les autres jusqu'à
  // 199 (les impairs, et les pairs à trois chiffres) ; M7-3 : × 50, de 11 à
  // 99.
  const m7Nombres = niveau => {
    const garder = n => n % 10 !== 0 && n !== 25;
    if (niveau === 1) return entre(12, 98).filter(n => garder(n) && n % 2 === 0);
    if (niveau === 2) return entre(11, 199).filter(n => garder(n) && (n % 2 === 1 || n > 100));
    return entre(11, 99).filter(garder);
  };
  function m7Vivier(niveau) {
    const fois = niveau === 3 ? 50 : 5;
    const nombres = m7Nombres(niveau);
    return Object.freeze({
      produit: nombres.map(n => m7Calcul(niveau, n, fois)),
      "produit-gauche": nombres.map(n => m7Calcul(niveau, n, fois, true))
    });
  }
  const M7_VIVIERS = Object.freeze({1: m7Vivier(1), 2: m7Vivier(2), 3: m7Vivier(3)});
  // Le dessin de J'écris : « 58 × 10 = 580 » écrit le haut, la dernière
  // égalité l'accolade de la moitié.
  function dixFoisDessins(image, etapes) {
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: vus.length > 0, fini: vus.length >= etapes})));
    return dessinsDe(Array.from({length: etapes}, () => ({})), etapes, dessin);
  }
  // J'apprends d'M7 : le glisse-nombres (× 10) sur le premier calcul, le
  // nombre dix fois sur le deuxième, les étapes sur le troisième.
  function m7Apprends({manipule, represente, ecris, consigne, consigneEcris, etapes, bilan}) {
    const glisse = m7Manipulation(manipule);
    return Object.freeze({
      exemple: exempleDe(manipule),
      manipule: Object.freeze({outil: "glisse", depart: glisse.depart, colonnes: glisse.colonnes, decalage: glisse.decalage, consigne: glisse.consigne, refus: glisse.refus, traces: glisse.traces}),
      represente: Object.freeze({
        outil: "dix-fois", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(m7Aide(represente)),
        solution: Object.freeze({image: m7Image(represente), phrase: m7Phrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        consigne: fr(consigneEcris),
        etapes: etapesEcris(etapes), reponse: ecris.reponse,
        solution: Object.freeze({image: m7Image(ecris), phrase: m7Phrase(ecris)})
      }, dixFoisDessins(m7Image(ecris), etapes.length)),
      bilan: frBilan(bilan),
      image: Object.freeze(m7Image(manipule || represente)),  // lot 3a : le calcul montré
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: manipule, ecris: ecris}),
      textes: Object.freeze([manipule.texte, represente.texte, ecris.texte])
    });
  }

  const M7 = {
    id: "M7", nom: "× 5, × 50", exemple: "46 × 5",
    famille: "M", construit: true,
    aide_entraine: "dix-fois",
    erreurs: M7_ERREURS, image: m7Image, aide: m7Aide, phrase: m7Phrase, manipulation: m7Manipulation, difficulte: m7Difficulte,
    niveaux: [
      {
        n: 1, titre: "× 5, nombre pair", nom: "× 5 d’un nombre pair", palier: 2, type: "P",
        composer: vivierNiveau(M7_VIVIERS[1], [7, 3]),
        imposes: [m7Calcul(1, 52, 5), m7Calcul(1, 36, 5, true)],
        apprends: m7Apprends({
          manipule: m7Calcul(0, 46, 5),
          represente: m7Calcul(0, 34, 5),
          ecris: m7Calcul(0, 58, 5, true),
          consigne: "34 × 5, c’est la moitié de 34 × 10.",
          consigneEcris: "5 × 58 = 58 × 10 ÷ 2",
          // Lot 7e-2 (choix de Gwenaël, calcul mental CM1) : la moitié
          // s'écrit sur le résultat de × 10.
          etapes: [["58 × 10 = ?", 580], ["580 ÷ 2 = ?", 290]],
          bilan: "× 5, c’est × 10 puis la moitié : 46 × 10 = 460. 46 × 5 = 460 ÷ 2 = 230."
        })
      },
      {
        n: 2, titre: "× 5, tout nombre jusqu’à 200", nom: "× 5 de tout nombre jusqu’à 200", palier: 2, type: "P",
        composer: vivierNiveau(M7_VIVIERS[2], [7, 3]),
        imposes: [m7Calcul(2, 47, 5), m7Calcul(2, 126, 5, true)],
        apprends: m7Apprends({
          manipule: m7Calcul(0, 37, 5),
          represente: m7Calcul(0, 143, 5),
          ecris: m7Calcul(0, 89, 5, true),
          consigne: "143 × 5, c’est la moitié de 143 × 10.",
          consigneEcris: "5 × 89 = 89 × 10 ÷ 2",
          etapes: [["89 × 10 = ?", 890], ["890 ÷ 2 = ?", 445]],
          bilan: "× 5, c’est × 10 puis la moitié : 37 × 10 = 370. 37 × 5 = 370 ÷ 2 = 185."
        })
      },
      {
        n: 3, titre: "multiplier par 50", nom: "× 50", palier: 3, type: "P",
        composer: vivierNiveau(M7_VIVIERS[3], [7, 3]),
        imposes: [m7Calcul(3, 36, 50), m7Calcul(3, 43, 50, true)],
        apprends: m7Apprends({
          manipule: m7Calcul(0, 24, 50),
          represente: m7Calcul(0, 18, 50),
          ecris: m7Calcul(0, 37, 50, true),
          consigne: "18 × 50, c’est la moitié de 18 × 100.",
          consigneEcris: "50 × 37 = 37 × 100 ÷ 2",
          etapes: [["37 × 100 = ?", 3700], [`3${ESPACE_FINE}700 ÷ 2 = ?`, 1850]],
          bilan: `× 50, c’est × 100 puis la moitié : 24 × 100 = 2${ESPACE_FINE}400. 24 × 50 = 2${ESPACE_FINE}400 ÷ 2 = 1${ESPACE_FINE}200.`
        })
      }
    ]
  };

  // ------------------------------------------------- M10 : regrouper les facteurs
  //
  // On change l'ordre des facteurs pour mettre ensemble ceux qui font 10 ou
  // 100. Données : facteurs (dans l'ordre du texte), paire (les deux qu'on
  // regroupe, dans le dessin), groupe (leur produit), reste (l'autre), et
  // l'image (« avant » : le calcul écrit d'abord quand on a coupé un nombre,
  // 16 × 25 = 4 × 4 × 25). Pour les erreurs : les produits de deux des trois
  // facteurs, la somme des facteurs écrits, le double (moitié-double).
  function m10Fabriquer(niveau, forme, morceaux, reponse, image, ecrits) {
    const r = image.reste * image.groupe;
    const [x, y, z] = image.facteurs;
    const donnees = {
      r, reste: image.reste, groupe: image.groupe, somme: ecrits.reduce((s, v) => s + v, 0),
      plus: r * 10, moins: r / 10, xy: x * y, xz: x * z, yz: y * z, ecrits: ecrits.length
    };
    const calcul = fabriquer("M10", niveau, forme, morceaux, reponse, donnees);
    return Object.freeze(Object.assign({}, calcul, {image: Object.freeze(Object.assign({}, image, {facteurs: Object.freeze(image.facteurs.slice())}))}));
  }
  // « 5 × 43 × 2 » (la paire aux deux bouts), « 43 × 2 × 5 »…
  function m10Trois(niveau, a, paire, ordre) {
    const [u, v] = paire;
    const facteurs = ordre === 0 ? [u, a, v] : [v, a, u];
    const groupe = u * v;
    return m10Fabriquer(niveau, "regrouper", [facteurs[0], "×", facteurs[1], "×", facteurs[2], "=", TROU], a * groupe,
      {facteurs, paire: [0, 2], groupe, reste: a, groupeConnu: true}, facteurs);
  }
  // « 2 × 137 × 5 = 137 × □ » : on cherche le groupe (10, 100).
  function m10Trou(niveau, a, paire) {
    const [u, v] = paire;
    const groupe = u * v;
    return m10Fabriquer(niveau, "trou-regroupe", [v, "×", a, "×", u, "=", a, "×", TROU], groupe,
      {facteurs: [v, a, u], paire: [0, 2], groupe, reste: a, groupeConnu: true}, [v, a, u]);
  }
  // « 23 × 20 » : 20 = 2 × 10 (M10-1) ; « 25 × 120 » : 120 = 4 × 30 (M10-2).
  function m10Couper(niveau, a, b, gauche) {
    let image;
    if (niveau === 1) {
      // 23 × 20 = 23 × 2 × 10 : 23 × 2 = 46, puis 46 × 10.
      image = {avant: `${f(a)} × ${f(b)}`, facteurs: [a, 2, b / 2], paire: [0, 1], groupe: a * 2, reste: b / 2, groupeDevant: true, groupeConnu: false};
    } else {
      // 25 × 120 = 25 × 4 × 30 : 25 × 4 = 100, puis 30 × 100.
      image = {avant: `${f(a)} × ${f(b)}`, facteurs: [a, 4, b / 4], paire: [0, 1], groupe: a * 4, reste: b / 4, groupeConnu: true};
    }
    const morceaux = gauche ? [b, "×", a, "=", TROU] : [a, "×", b, "=", TROU];
    return m10Fabriquer(niveau, gauche ? "couper-gauche" : "couper", morceaux, a * b, image, [a, b]);
  }
  // M10-3 : « 16 × 25 » = 4 × 4 × 25 ; « 24 × 5 = □ × 10 » : la moitié
  // d'un côté, le double de l'autre.
  function m10Quart(niveau, a, gauche) {
    const q = a / 4;
    const image = {avant: `${f(a)} × 25`, facteurs: [q, 4, 25], paire: [1, 2], groupe: 100, reste: q, groupeConnu: true};
    return m10Fabriquer(niveau, gauche ? "produit-gauche" : "produit", gauche ? [25, "×", a, "=", TROU] : [a, "×", 25, "=", TROU], a * 25, image, [a, 25]);
  }
  function m10MoitieDouble(niveau, a) {
    const image = {avant: `${f(a)} × 5`, facteurs: [a / 2, 2, 5], paire: [1, 2], groupe: 10, reste: a / 2, groupeConnu: true};
    const calcul = m10Fabriquer(niveau, "moitie-double", [a, "×", 5, "=", TROU, "×", 10], a / 2, image, [a, 5]);
    // M10-1 (lot « couverture ») : rangé avec « 2 × 137 × 5 = 137 × □ »
    // (la case dans un produit), avec son annonce.
    const rangee = niveau === 1 ? {forme: "trou-regroupe", annonce: "la moitié d’un côté, le double de l’autre"} : {};
    return Object.freeze(Object.assign({}, calcul, rangee, {donnees: Object.freeze(Object.assign({}, calcul.donnees, {a, double: 2 * a}))}));
  }
  const m10Image = calcul => Object.assign({outil: "facteurs"}, calcul.image);
  // Le trou (« = 137 × □ », « = □ × 10 ») n'a pas d'aide : le dessin
  // écrirait la réponse. La correction, elle, montre tout.
  const estMoitieDouble = calcul => calcul.donnees.double !== undefined;
  const m10Aide = calcul => (["trou-regroupe", "moitie-double"].includes(calcul.forme) ? null : Object.assign(m10Image(calcul), {masque: true}));
  function m10Phrase(calcul) {
    const {facteurs, paire, groupe, reste} = calcul.image;
    const [i, j] = paire;
    const r = groupe * reste;
    if (estMoitieDouble(calcul)) return fr(`Regarde : ${f(calcul.donnees.a)} × 5 = ${f(reste)} × 2 × 5 = ${f(reste)} × 10.`);
    return fr(`Regarde : ${f(facteurs[i])} × ${f(facteurs[j])} = ${f(groupe)}, et ${f(reste)} × ${f(groupe)} = ${f(r)}.`);
  }
  const M10_FORMES = Object.freeze({regrouper: 0, couper: 1, "couper-gauche": 2, produit: 0, "produit-gauche": 1, "trou-regroupe": 3, "moitie-double": 3});
  const m10Difficulte = calcul => M10_FORMES[calcul.forme] * 1000 + Math.min(calcul.donnees.reste, 999);
  const M10_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "un facteur oublié",
      test: sauf((calcul, reponse) => calcul.forme === "regrouper" && ["xy", "xz", "yz"].some(k => memeNombre(reponse, calcul.donnees[k]))),
      retour: (calcul, reponse) => {
        const [x, y, z] = calcul.image.facteurs;
        const [u, v, w] = memeNombre(reponse, x * y) ? [x, y, z] : memeNombre(reponse, x * z) ? [x, z, y] : [y, z, x];
        return fr(`${f(reponse)}, c’est ${f(u)} × ${f(v)}. Il reste × ${f(w)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "un rang de trop ou de moins",
      test: sauf((calcul, reponse) => !["trou-regroupe", "moitie-double"].includes(calcul.forme) && (memeNombre(reponse, calcul.donnees.plus) || memeNombre(reponse, calcul.donnees.moins))),
      retour: (calcul, reponse) => {
        const {facteurs, paire, groupe, reste, groupeDevant} = calcul.image;
        const [i, j] = paire;
        const [g, d] = groupeDevant ? [groupe, reste] : [reste, groupe];
        return fr(`${f(reponse)} : un rang de ${reponse > calcul.reponse ? "trop" : "moins"}. ${f(facteurs[i])} × ${f(facteurs[j])} = ${f(groupe)}, puis ${f(g)} × ${f(d)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "additionné au lieu de multiplier",
      test: sauf((calcul, reponse) => !estMoitieDouble(calcul) && memeNombre(reponse, calcul.forme === "trou-regroupe" ? calcul.image.facteurs[0] + calcul.image.facteurs[2] : calcul.donnees.somme)),
      retour: (calcul, reponse) => {
        const {facteurs} = calcul.image;
        if (calcul.forme === "trou-regroupe") return fr(`${f(reponse)}, c’est ${f(facteurs[0])} + ${f(facteurs[2])}. Ici, on multiplie : ${f(facteurs[0])} × ${f(facteurs[2])}.`);
        const ecrits = calcul.texte.replace(` = ${CASE}`, "").split(" × ");
        return fr(`${f(reponse)}, c’est ${ecrits.join(" + ")}. Ici, on multiplie.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 4, nom: "le double au lieu de la moitié",
      test: sauf((calcul, reponse) => estMoitieDouble(calcul) && memeNombre(reponse, calcul.donnees.double)),
      retour: (calcul, reponse) => {
        const {a} = calcul.donnees;
        return fr(`${f(reponse)}, c’est le double de ${f(a)}. × 10, c’est 2 fois plus que × 5 : de l’autre côté, il faut 2 fois moins que ${f(a)}.`);
      },
      gras: 0
    })
  ]);
  // Les nombres qu'on garde entiers : jamais une dizaine entière.
  const m10Nombres = (de, a) => entre(de, a).filter(n => n % 10 !== 0);
  function m10Vivier(niveau) {
    if (niveau === 3) {
      // × 25 seul : un multiple de 4 (16 = 4 × 4) ; les dizaines (40 × 25)
      // sont au niveau 2 ; 25 × 4 à 25 × 8 sont dans M5.
      const quarts = entre(12, 96).filter(n => n % 4 === 0 && n % 10 !== 0);
      // (Lot « couverture » : la moitié-double, « 24 × 5 = □ × 10 », est un
      // exemple officiel de CM1 : elle est partie dans M10-1.)
      return Object.freeze({
        produit: quarts.map(a => m10Quart(3, a)),
        "produit-gauche": quarts.map(a => m10Quart(3, a, true))
      });
    }
    const paire = niveau === 1 ? [5, 2] : [4, 25];
    // Lot « couverture » : « 24 × 5 = □ × 10 » est un exemple officiel de
    // CM1 : au niveau 1 aussi (il reste au niveau 3).
    const moitieDouble = niveau === 1 ? {"moitie-double": entre(12, 98).filter(n => n % 2 === 0 && n % 10 !== 0).map(a => m10MoitieDouble(1, a))} : {};
    const nombres = niveau === 1 ? m10Nombres(11, 199) : m10Nombres(11, 99);
    // Les nombres à couper : 20 (M10-1 : 23 × 20), 40, 80, 120, 160, 200,
    // 400, 800 (M10-2 : 25 × 120 = 25 × 4 × 30).
    const coupes = gauche => (niveau === 1
      ? m10Nombres(11, 49).map(a => m10Couper(1, a, 20, gauche))
      : [40, 80, 120, 160, 240, 400, 800, 1200].map(b => m10Couper(2, 25, b, gauche)));
    return Object.freeze({
      regrouper: nombres.flatMap(a => [m10Trois(niveau, a, paire, 0), m10Trois(niveau, a, paire, 1)]),
      "trou-regroupe": nombres.map(a => m10Trou(niveau, a, paire)),
      couper: coupes(false),
      "couper-gauche": coupes(true),
      ...moitieDouble
    });
  }
  const M10_VIVIERS = Object.freeze({1: m10Vivier(1), 2: m10Vivier(2), 3: m10Vivier(3)});
  // Le dessin de J'écris : la paire regroupée (« 5 × 2 = 10 »), puis
  // l'accolade.
  function facteursDessins(image, etapes) {
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: vus.length > 0, fini: vus.length >= etapes})));
    return dessinsDe(Array.from({length: etapes}, () => ({})), etapes, dessin);
  }

  const M10 = {
    id: "M10", nom: "Regrouper les facteurs", exemple: "5 × 43 × 2",
    famille: "M", construit: true,
    aide_entraine: "facteurs",
    erreurs: M10_ERREURS, image: m10Image, aide: m10Aide, phrase: m10Phrase, manipulation: () => null, difficulte: m10Difficulte
  };
  // Les calculs de J'apprends : au niveau 0, hors de tout vivier.
  M10.niveaux = [
    {
      n: 1, titre: "avec 2 et 5", nom: "Regrouper 2 et 5", palier: 2, type: "P",
      composer: vivierNiveau(M10_VIVIERS[1], [4, 2, 2, 1, 1]),
      imposes: [m10Trois(1, 64, [5, 2], 1), m10Trou(1, 137, [5, 2]), m10Couper(1, 23, 20), m10MoitieDouble(1, 24)],
      apprends: apprendsSansManip({
        fiche: M10,
        represente: m10Trois(0, 43, [5, 2], 0),
        ecris: m10Trois(0, 38, [5, 2], 1),
        consigne: "5 × 2 = 10 : je les calcule ensemble.",
        consigneEcris: "2 × 38 × 5 = 2 × 5 × 38",
        etapes: [["2 × 5 = ?", 10], ["38 × 10 = ?", 380]],
        dessins: (calcul, n) => facteursDessins(m10Image(calcul), n),
        bilan: "5 × 2 = 10 : je les calcule ensemble. 5 × 43 × 2 = 43 × 10 = 430."
      })
    },
    {
      n: 2, titre: "avec 4 et 25", nom: "Regrouper 4 et 25", palier: 3, type: "P",
      composer: vivierNiveau(M10_VIVIERS[2], [4, 2, 2, 2]),
      imposes: [m10Trois(2, 37, [4, 25], 0), m10Couper(2, 25, 400)],
      apprends: apprendsSansManip({
        fiche: M10,
        represente: m10Trois(0, 37, [4, 25], 0),
        ecris: m10Trois(0, 18, [4, 25], 1),
        consigne: "4 × 25 = 100 : je les calcule ensemble.",
        consigneEcris: "25 × 18 × 4 = 25 × 4 × 18",
        etapes: [["25 × 4 = ?", 100], ["18 × 100 = ?", 1800]],
        dessins: (calcul, n) => facteursDessins(m10Image(calcul), n),
        bilan: `4 × 25 = 100 : je les calcule ensemble. 4 × 37 × 25 = 37 × 100 = 3${ESPACE_FINE}700.`
      })
    },
    {
      n: 3, titre: "multiplier par 25", nom: "× 25 seul", palier: 4, type: "P",
      composer: vivierNiveau(M10_VIVIERS[3], [5, 5]),
      imposes: [m10Quart(3, 36), m10Quart(3, 52, true)],
      apprends: apprendsSansManip({
        fiche: M10,
        represente: m10Quart(0, 16),
        ecris: m10Quart(0, 28, true),
        consigne: "16, c’est 4 × 4. Et 4 × 25 = 100.",
        consigneEcris: "25 × 28 = 7 × 4 × 25",
        etapes: [["4 × 25 = ?", 100], ["7 × 100 = ?", 700]],
        dessins: (calcul, n) => facteursDessins(m10Image(calcul), n),
        bilan: "16, c’est 4 × 4 : 16 × 25 = 4 × 4 × 25 = 4 × 100 = 400."
      })
    }
  ];

  // ------------------------------------------------- M12 : diviser en décomposant
  //
  // « 96 ÷ 8 » : n, d, q ; morceaux de n, chacun divisible par d : les
  // dizaines du quotient et ses unités (96 = 80 + 16 ; 130 = 100 + 30 ;
  // 536 = 480 + 56). Un seul morceau quand le quotient est une dizaine ou
  // une centaine entière (240 ÷ 6 : 24 dizaines).
  function m12Calcul(niveau, forme, n, d) {
    const q = n / d;
    const morceaux = q % 10 && q > 10 ? [d * (q - q % 10), d * (q % 10)] : [n];
    // La table cachée d'un niveau 1 : 240 = 24 dizaines, 3 600 = 36 centaines.
    let t = n;
    let unite = 1;
    while (t % 10 === 0 && (t / 10) % d === 0 && t / 10 >= d) { t /= 10; unite *= 10; }
    const donnees = {n, d, q, t, unite, m1: morceaux[0] / d, m2: morceaux.length > 1 ? morceaux[1] / d : 0, fois: n * d, plus: q * 10, moins: q / 10};
    const calcul = forme === "trou-facteur"
      ? fabriquer("M12", niveau, forme, [d, "×", TROU, "=", n], q, donnees)
      : fabriquer("M12", niveau, "division", [n, "÷", d, "=", TROU], q, donnees);
    return Object.freeze(Object.assign({}, calcul, {morceaux: Object.freeze(morceaux)}));
  }
  const m12Image = calcul => ({outil: "partage", n: calcul.donnees.n, d: calcul.donnees.d, morceaux: calcul.morceaux.slice()});
  const m12Aide = calcul => Object.assign(m12Image(calcul), {masque: true});
  function m12Phrase(calcul) {
    const {n, d, q, t} = calcul.donnees;
    if (calcul.morceaux.length === 1) return fr(`Regarde : ${f(t)} ÷ ${d} = ${f(t / d)}, donc ${f(n)} ÷ ${d} = ${f(q)}.`);
    const [a, b] = calcul.morceaux;
    return fr(`Regarde : ${f(a)} ÷ ${d} = ${f(a / d)} et ${f(b)} ÷ ${d} = ${f(b / d)}, ça fait ${f(q)}.`);
  }
  const m12Difficulte = calcul => (calcul.forme === "trou-facteur" ? 5000 : 0) + Math.min(calcul.donnees.n / (calcul.morceaux.length === 1 ? calcul.donnees.unite : 1), 4999);
  const M12_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "un rang de trop ou de moins",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.plus) || memeNombre(reponse, calcul.donnees.moins)),
      retour: (calcul, reponse) => {
        const {n, d} = calcul.donnees;
        return fr(`${f(reponse)} : un rang de ${reponse > calcul.reponse ? "trop" : "moins"}. Vérifie : ${d} × ${f(reponse)} = ${f(d * reponse)}, pas ${f(n)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "un morceau oublié",
      test: sauf((calcul, reponse) => calcul.morceaux.length > 1 && (memeNombre(reponse, calcul.donnees.m1) || memeNombre(reponse, calcul.donnees.m2))),
      retour: (calcul, reponse) => {
        const {d, m1} = calcul.donnees;
        const [a, b] = calcul.morceaux;
        const [fait, reste] = memeNombre(reponse, m1) ? [a, b] : [b, a];
        return fr(`${f(reponse)}, c’est ${f(fait)} ÷ ${d}. Il reste ${f(reste)} ÷ ${d}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "multiplié au lieu de diviser",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.fois)),
      retour: (calcul, reponse) => {
        const {n, d} = calcul.donnees;
        return fr(`${f(reponse)}, c’est ${f(n)} × ${d}. Ici, on partage ${f(n)} en ${d} parts égales.`);
      },
      gras: 0
    })
  ]);
  // Les diviseurs : de 3 à 9 (÷ 2, c'est la moitié : M1). Jamais 60 ni 100
  // (60 ÷ 4, 100 ÷ 5 : les repères de M5).
  const M12_DIVISEURS = Object.freeze(entre(3, 9));
  const m12Garde = n => n !== 60 && n !== 100;
  // Lot 7b (rapport de Codex du 14/11 : M13 ne reprend aucun calcul de M12)
  // — la règle commune aux deux modules : ÷ 4 ou ÷ 8 d'un nombre qui finit
  // par 0, quand le quotient est entier, plus grand que 10 (pas un fait des
  // tables) et ne finit pas par 0 (120 ÷ 4 = 30 : 12 dizaines ÷ 4, M12-1),
  // c'est la moitié de la moitié : M13 (140 ÷ 4, 360 ÷ 8). Tout le reste
  // reste à M12 (96 ÷ 8, 84 ÷ 4, 536 ÷ 8).
  const m13Prend = (n, d) => (d === 4 || d === 8) && n % 10 === 0 && n % d === 0 && n / d > 10 && (n / d) % 10 !== 0;
  function m12Vivier(niveau) {
    const paires = [];
    if (niveau === 1) {
      // 240 ÷ 6, 3 600 ÷ 9 : la table (24 ÷ 6), en dizaines ou en centaines.
      M12_DIVISEURS.forEach(d => entre(2, 9).forEach(c => [10, 100].forEach(u => paires.push([d * c * u, d]))));
    } else {
      // Un quotient à deux chiffres (ou plus), qui n'est pas une dizaine
      // entière : jusqu'à 199 au niveau 2 (96 ÷ 8, 130 ÷ 5), de 200 à 999
      // au niveau 3 (536 ÷ 8, 525 ÷ 5).
      const [de, a] = niveau === 2 ? [20, 199] : [200, 999];
      M12_DIVISEURS.forEach(d => entre(11, Math.floor(a / d)).filter(q => q % 10 !== 0 && d * q >= de).forEach(q => paires.push([d * q, d])));
    }
    // Le quotient n'est jamais un des morceaux écrits sur la barre (45 ÷ 3 :
    // 30 | 15, et 15 est la réponse).
    const gardees = paires.filter(([n, d]) => m12Garde(n) && !m13Prend(n, d) && !m12Calcul(niveau, "division", n, d).morceaux.includes(n / d));
    return Object.freeze({
      division: gardees.map(([n, d]) => m12Calcul(niveau, "division", n, d)),
      "trou-facteur": gardees.map(([n, d]) => m12Calcul(niveau, "trou-facteur", n, d))
    });
  }
  const M12_VIVIERS = Object.freeze({1: m12Vivier(1), 2: m12Vivier(2), 3: m12Vivier(3)});
  // Le dessin de J'écris : chaque morceau partagé (80 ÷ 8 = 10), puis la
  // dernière égalité. Un seul morceau : la dernière égalité l'écrit.
  function partageDessins(image, etapes) {
    const deux = image.morceaux.length > 1;
    const morceaux = deux ? [{m: 0}, {m: 1}, {fini: true}] : Array.from({length: etapes - 1}, () => ({})).concat([{fini: true}]);
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: vus.filter(v => v.m !== undefined).map(v => v.m), fini: vus.some(v => v.fini)})));
    return dessinsDe(morceaux, etapes, dessin);
  }

  const M12 = {
    id: "M12", nom: "Diviser en décomposant", exemple: "240 ÷ 6",
    famille: "M", construit: true,
    aide_entraine: "partage",
    erreurs: M12_ERREURS, image: m12Image, aide: m12Aide, phrase: m12Phrase, manipulation: () => null, difficulte: m12Difficulte
  };
  M12.niveaux = [
    {
      n: 1, titre: "dizaines, centaines entières ÷ un chiffre", nom: "Dizaines, centaines entières ÷ un chiffre", palier: 2, type: "P",
      composer: vivierNiveau(M12_VIVIERS[1], [8, 2]),
      imposes: [m12Calcul(1, "division", 420, 7), m12Calcul(1, "trou-facteur", 320, 8)],
      apprends: apprendsSansManip({
        fiche: M12,
        represente: m12Calcul(0, "division", 240, 6),
        ecris: m12Calcul(0, "division", 350, 7),
        consigne: "240, c’est 24 dizaines.",
        consigneEcris: "350 ÷ 7 = 35 ÷ 7 × 10",
        etapes: [["35 ÷ 7 = ?", 5], ["350 ÷ 7 = ?", 50]],
        dessins: (calcul, n) => partageDessins(m12Image(calcul), n),
        bilan: "240, c’est 24 dizaines : 240 ÷ 6 = 24 ÷ 6 × 10 = 40."
      })
    },
    {
      n: 2, titre: "quotient à deux chiffres", nom: "Quotient à deux chiffres", palier: 3, type: "P",
      composer: vivierNiveau(M12_VIVIERS[2], [8, 2]),
      imposes: [m12Calcul(2, "division", 84, 4), m12Calcul(2, "trou-facteur", 98, 7)],
      apprends: apprendsSansManip({
        fiche: M12,
        represente: m12Calcul(0, "division", 96, 8),
        ecris: m12Calcul(0, "division", 135, 5),
        consigne: "96, c’est 80 et 16. Je partage chacun en 8.",
        consigneEcris: "135 ÷ 5 = 100 ÷ 5 + 35 ÷ 5",
        etapes: [["100 ÷ 5 = ?", 20], ["35 ÷ 5 = ?", 7], ["135 ÷ 5 = ?", 27]],
        dessins: (calcul, n) => partageDessins(m12Image(calcul), n),
        bilan: "96 ÷ 8 = 80 ÷ 8 + 16 ÷ 8 = 10 + 2 = 12."
      })
    },
    {
      n: 3, titre: "dividende à trois chiffres", nom: "Dividende à trois chiffres", palier: 4, type: "P",
      composer: vivierNiveau(M12_VIVIERS[3], [8, 2]),
      imposes: [m12Calcul(3, "division", 768, 8), m12Calcul(3, "division", 455, 5)],
      apprends: apprendsSansManip({
        fiche: M12,
        represente: m12Calcul(0, "division", 536, 8),
        ecris: m12Calcul(0, "division", 525, 5),
        consigne: "536, c’est 480 et 56.",
        consigneEcris: "525 ÷ 5 = 500 ÷ 5 + 25 ÷ 5",
        etapes: [["500 ÷ 5 = ?", 100], ["25 ÷ 5 = ?", 5], ["525 ÷ 5 = ?", 105]],
        dessins: (calcul, n) => partageDessins(m12Image(calcul), n),
        bilan: "536 ÷ 8 = 480 ÷ 8 + 56 ÷ 8 = 60 + 7 = 67."
      })
    }
  ];

  // ------------------------------------------------- C1 : parenthèses
  //
  // Un calcul est un arbre : un nombre, ou {op, g, d, par} (par : entre
  // parenthèses). L'escalier (planche « choix-4 ») : à chaque ligne, les
  // parenthèses les plus à l'intérieur (ou, quand il n'en reste plus, le
  // dernier calcul) ; leur nombre prend leur place à la ligne suivante.
  const OPERATIONS = Object.freeze({"+": (a, b) => a + b, "−": (a, b) => a - b, "×": (a, b) => a * b});
  const op = (signe, g, d, par = false) => Object.freeze({op: signe, g, d, par});
  const valeurDe = arbre => (typeof arbre === "number" ? arbre : OPERATIONS[arbre.op](valeurDe(arbre.g), valeurDe(arbre.d)));
  function jetonsDe(arbre) {
    if (typeof arbre === "number") return [f(arbre)];
    const dedans = [...jetonsDe(arbre.g), arbre.op, ...jetonsDe(arbre.d)];
    return arbre.par ? ["(", ...dedans, ")"] : dedans;
  }
  // « 3 × (10 − 6) » : pas d'espace après « ( » ni avant « ) ».
  const ecrireJetons = jetons => jetons.join(" ").replace(/\( /g, "(").replace(/ \)/g, ")");
  const nombresDe = arbre => (typeof arbre === "number" ? [arbre] : [...nombresDe(arbre.g), ...nombresDe(arbre.d)]);
  // De gauche à droite, sans les parenthèses (3 × (10 − 6) → 3 × 10 − 6 = 24).
  function gaucheADroite(arbre) {
    const jetons = jetonsDe(arbre).filter(t => t !== "(" && t !== ")");
    let v = Number(sansEspace(jetons[0]).replace(/ /g, ""));
    for (let k = 1; k < jetons.length; k += 2) v = OPERATIONS[jetons[k]](v, Number(sansEspace(jetons[k + 1]).replace(/ /g, "")));
    return v;
  }
  const aDesParentheses = arbre => typeof arbre !== "number" && !arbre.feuille && (arbre.par || aDesParentheses(arbre.g) || aDesParentheses(arbre.d));
  // Les lignes de l'escalier : {jetons, sous: [[début, fin]], valeurs,
  // nouveaux (les places des nombres venus d'une accolade), origines
  // ([ligne, accolade] de chacun)}.
  function escalierDe(arbre) {
    const lignes = [];
    let courant = arbre;
    let venus = new Map();
    while (typeof courant !== "number") {
      // Les cibles : les parenthèses sans parenthèse dedans ; sinon le tout.
      const cibles = [];
      const chercher = noeud => {
        if (typeof noeud === "number" || noeud.feuille) return;
        if (noeud.par && !aDesParentheses(noeud.g) && !aDesParentheses(noeud.d)) { cibles.push(noeud); return; }
        chercher(noeud.g); chercher(noeud.d);
      };
      chercher(courant);
      if (!cibles.length) cibles.push(courant);
      // Les jetons, et la place de chaque cible et de chaque nombre venu.
      const jetons = [];
      const places = new Map();
      const nouveaux = [];
      const origines = [];
      const ecrire = noeud => {
        const debut = jetons.length;
        if (typeof noeud === "number" || noeud.feuille) {
          const valeur = typeof noeud === "number" ? noeud : noeud.valeur;
          if (noeud.feuille) { nouveaux.push(jetons.length); origines.push(noeud.origine); }
          jetons.push(f(valeur));
        } else {
          if (noeud.par) jetons.push("(");
          ecrire(noeud.g); jetons.push(noeud.op); ecrire(noeud.d);
          if (noeud.par) jetons.push(")");
        }
        places.set(noeud, [debut, jetons.length - 1]);
      };
      ecrire(courant);
      const i = lignes.length;
      lignes.push({jetons, sous: cibles.map(c => places.get(c)), valeurs: cibles.map(valeurAvecFeuilles), nouveaux, origines});
      const remplacer = noeud => {
        const k = cibles.indexOf(noeud);
        if (k >= 0) return {feuille: true, valeur: valeurAvecFeuilles(noeud), origine: [i, k]};
        if (typeof noeud === "number" || noeud.feuille) return noeud;
        return {op: noeud.op, g: remplacer(noeud.g), d: remplacer(noeud.d), par: noeud.par};
      };
      courant = remplacer(courant);
      if (courant.feuille) break;
    }
    return lignes.map(l => Object.freeze({jetons: Object.freeze(l.jetons), sous: Object.freeze(l.sous.map(s => Object.freeze(s))), valeurs: Object.freeze(l.valeurs), nouveaux: Object.freeze(l.nouveaux), origines: Object.freeze(l.origines.map(o => Object.freeze(o)))}));
  }
  function valeurAvecFeuilles(noeud) {
    if (typeof noeud === "number") return noeud;
    if (noeud.feuille) return noeud.valeur;
    return OPERATIONS[noeud.op](valeurAvecFeuilles(noeud.g), valeurAvecFeuilles(noeud.d));
  }
  // Le texte d'une accolade (« 10 − 6 ») : ses jetons, sans les parenthèses
  // du bord.
  function texteAccolade(ligne, k) {
    const [a, b] = ligne.sous[k];
    let jetons = ligne.jetons.slice(a, b + 1);
    if (jetons[0] === "(" && jetons[jetons.length - 1] === ")") jetons = jetons.slice(1, -1);
    return ecrireJetons(jetons);
  }
  // Les écritures, et leur numéro dans la clé (deux écritures peuvent avoir
  // les mêmes nombres : 3 × (10 − 6) et (3 × 10) − 6).
  const C1_CODES = Object.freeze({"fois-par": 1, "par-fois": 2, "moins-par": 3, "fois-paires": 4, "moins-paires": 5, "moins-emboite": 6, "fois-emboite": 7});
  function c1Calcul(niveau, forme, arbre) {
    const r = valeurDe(arbre);
    const lignes = escalierDe(arbre);
    const derniere = lignes[lignes.length - 1];
    const dernierOp = derniere.jetons[1];
    const [g, d] = [derniere.jetons[0], derniere.jetons[2]].map(t => Number(sansEspace(t).replace(/ /g, "")));
    const parentheses = lignes.slice(0, -1).flatMap(l => l.valeurs);
    const donnees = {r, gauche: gaucheADroite(arbre), somme: dernierOp === "×" ? g + d : -1, p1: parentheses[0], p2: parentheses.length > 1 ? parentheses[1] : -1, p3: parentheses.length > 2 ? parentheses[2] : -1};
    const texte = `${ecrireJetons(jetonsDe(arbre))} = ${CASE}`;
    return Object.freeze({
      texte, reponse: r, forme, module: "C1", niveau,
      cle: `C1-${niveau}-${C1_CODES[forme]}-${nombresDe(arbre).map(cleNombre).join("-")}`,
      donnees: Object.freeze(donnees),
      lignes
    });
  }
  const c1Image = calcul => ({outil: "parentheses", lignes: calcul.lignes});
  const c1Aide = calcul => Object.assign(c1Image(calcul), {masque: true});
  function c1Phrase(calcul) {
    const morceaux = calcul.lignes.map(l => ecrireJetons(l.jetons));
    return fr(`Regarde : ${[...morceaux, f(calcul.reponse)].join(" = ")}.`);
  }
  // Toucher ce qu'on calcule en premier (Je manipule, et l'entraînement après
  // deux erreurs) : les lignes de l'escalier.
  function c1Manipulation(calcul) {
    return Object.freeze({
      outil: "toucher", lignes: calcul.lignes,
      texte: calcul.texte.replace(` = ${CASE}`, ""),
      consigne: "Touche le calcul à faire en premier.",
      refus: null,
      traces: Object.freeze([])
    });
  }
  // Du plus simple au plus dur : l'écriture, puis la taille du résultat.
  const C1_RANGS = Object.freeze({"fois-par": 0, "par-fois": 1, "moins-par": 2, "fois-paires": 0, "moins-paires": 1, "moins-emboite": 0, "fois-emboite": 1});
  const c1Difficulte = calcul => C1_RANGS[calcul.forme] * 1000 + Math.min(calcul.reponse, 999);
  const C1_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "calculé de gauche à droite",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.gauche)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : tu as calculé de gauche à droite. Les parenthèses d’abord : ${texteAccolade(calcul.lignes[0], 0)}.`),
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "la parenthèse seulement",
      test: sauf((calcul, reponse) => ["p1", "p2", "p3"].some(k => calcul.donnees[k] >= 0 && memeNombre(reponse, calcul.donnees[k]))),
      retour: (calcul, reponse) => {
        let texte = "";
        calcul.lignes.slice(0, -1).forEach(l => l.valeurs.forEach((v, k) => { if (!texte && memeNombre(v, reponse)) texte = texteAccolade(l, k); }));
        return fr(`${f(reponse)}, c’est ${texte}. La parenthèse est faite : il reste à finir le calcul.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "additionné au lieu de multiplier",
      test: sauf((calcul, reponse) => calcul.donnees.somme >= 0 && memeNombre(reponse, calcul.donnees.somme)),
      retour: (calcul, reponse) => {
        const derniere = calcul.lignes[calcul.lignes.length - 1];
        const [g, , d] = derniere.jetons;
        return fr(`${f(reponse)}, c’est ${g} + ${d}. Ici, on multiplie : ${g} × ${d}.`);
      },
      gras: 0
    })
  ]);
  // Les viviers. Niveau 1 (une paire) : a × (b ± c), (b ± c) × a,
  // a − (b ± c). Niveau 2 (deux paires) : (a ± b) × (c ± d),
  // (a × b) − (c + d). Niveau 3 (emboîtées) : a − (b × (c − d)),
  // a × (b − (c + d)). Des petits nombres : c'est l'ordre qu'on apprend.
  function c1Vivier(niveau) {
    const v = {};
    const ajouter = (forme, arbre) => {
      const r = valeurDe(arbre);
      // Le résultat n'est pas un des nombres écrits (5 × (12 − 10) = 10).
      // Ni un des nombres d'une parenthèse : 4 × (10 − (5 + 3)) = 8.
      if (!(r > 0) || !Number.isInteger(r) || nombresDe(arbre).includes(r)) return;
      const calcul = c1Calcul(niveau, forme, arbre);
      if ([calcul.donnees.p1, calcul.donnees.p2, calcul.donnees.p3].includes(r)) return;
      (v[forme] = v[forme] || []).push(calcul);
    };
    // Une parenthèse de deux nombres, qui vaut de 2 à 9 : (b + c) avec b de
    // 2 à 9, (b − c) avec b de 10 à 18.
    const petites = [];
    for (let b = 2; b <= 9; b += 1) for (let c = 2; c <= 9; c += 1) if (b + c <= 9) petites.push(op("+", b, c, true));
    for (let b = 10; b <= 18; b += 1) for (let c = 2; c <= 9; c += 1) if (b - c >= 2 && b - c <= 9) petites.push(op("−", b, c, true));
    if (niveau === 1) {
      for (let a = 2; a <= 9; a += 1) petites.forEach(p => {
        ajouter("fois-par", op("×", a, p));
        ajouter("par-fois", op("×", p, a));
      });
      for (let a = 20; a <= 60; a += 5) petites.forEach(p => { if (valeurDe(p) < a - 1) ajouter("moins-par", op("−", a, p)); });
    } else if (niveau === 2) {
      // Deux parenthèses de 2 à 9, un produit jusqu'à 60.
      const paires = petites.filter((_, i) => i % 3 === 0);
      paires.forEach(p => paires.forEach(q => { if (p !== q && valeurDe(p) * valeurDe(q) <= 60) ajouter("fois-paires", op("×", p, q)); }));
      for (let a = 2; a <= 9; a += 1) for (let b = 3; b <= 9; b += 1) petites.filter((_, i) => i % 2 === 0).forEach(q => {
        if (q.op === "+" && a * b - valeurDe(q) >= 2) ajouter("moins-paires", op("−", op("×", a, b, true), q));
      });
    } else {
      for (let b = 2; b <= 6; b += 1) petites.filter(p => p.op === "−" && valeurDe(p) <= 6).forEach(p => [30, 40, 50, 60].forEach(a => {
        if (a - b * valeurDe(p) >= 2) ajouter("moins-emboite", op("−", a, op("×", b, p, true)));
      }));
      for (let a = 2; a <= 9; a += 1) petites.filter(p => p.op === "+" && valeurDe(p) <= 8).forEach(p => [10, 12, 15, 20].forEach(b => {
        const dedans = b - valeurDe(p);
        if (dedans >= 2 && dedans <= 9) ajouter("fois-emboite", op("×", a, op("−", b, p, true)));
      }));
    }
    return Object.freeze(Object.fromEntries(Object.entries(v).map(([k, l]) => [k, Object.freeze(l)])));
  }
  const C1_VIVIERS = Object.freeze({1: c1Vivier(1), 2: c1Vivier(2), 3: c1Vivier(3)});
  // Le dessin de J'écris : une accolade par étape, dans l'ordre.
  function escalierDessins(image, etapes) {
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: vus.length, fini: vus.length >= etapes})));
    return dessinsDe(Array.from({length: etapes}, () => ({})), etapes, dessin);
  }
  // Les étapes de J'écris : une accolade, une égalité.
  const c1Etapes = calcul => calcul.lignes.flatMap(l => l.valeurs.map((v, k) => [`${texteAccolade(l, k)} = ?`, v]));
  // J'apprends de C1 : toucher sur le premier calcul, l'escalier sur le
  // deuxième, les étapes sur le troisième.
  function c1Apprends({manipule, represente, ecris, consigne, consigneEcris, bilan}) {
    const m = c1Manipulation(manipule);
    const etapes = c1Etapes(ecris);
    return Object.freeze({
      exemple: exempleDe(manipule),
      manipule: Object.freeze({outil: "toucher", lignes: m.lignes, consigne: m.consigne, refus: null, traces: m.traces}),
      represente: Object.freeze({
        outil: "parentheses", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(c1Aide(represente)),
        solution: Object.freeze({image: c1Image(represente), phrase: c1Phrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        consigne: fr(consigneEcris),
        etapes: etapesEcris(etapes), reponse: ecris.reponse,
        solution: Object.freeze({image: c1Image(ecris), phrase: c1Phrase(ecris)})
      }, escalierDessins(c1Image(ecris), etapes.length)),
      bilan: frBilan(bilan),
      image: Object.freeze(c1Image(manipule || represente)),  // lot 3a : le calcul montré
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: manipule, ecris: ecris}),
      textes: Object.freeze([manipule.texte, represente.texte, ecris.texte])
    });
  }
  const C1 = {
    id: "C1", nom: "Parenthèses", exemple: "3 × (10 − 6)",
    famille: "C", construit: true,
    aide_entraine: "parentheses",
    erreurs: C1_ERREURS, image: c1Image, aide: c1Aide, phrase: c1Phrase, manipulation: c1Manipulation, difficulte: c1Difficulte,
    niveaux: [
      {
        n: 1, titre: "une paire de parenthèses", nom: "Une paire de parenthèses", palier: 2, type: "P",
        composer: vivierNiveau(C1_VIVIERS[1], [4, 3, 3]),
        imposes: [c1Calcul(1, "fois-par", op("×", 6, op("−", 13, 5, true))), c1Calcul(1, "moins-par", op("−", 45, op("+", 2, 7, true)))],
        apprends: c1Apprends({
          manipule: c1Calcul(0, "fois-par", op("×", 3, op("−", 10, 6, true))),
          represente: c1Calcul(0, "moins-par", op("−", 20, op("+", 6, 3, true))),
          ecris: c1Calcul(0, "fois-par", op("×", 5, op("−", 12, 4, true))),
          consigne: "Je calcule d’abord ce qui est entre parenthèses.",
          consigneEcris: "D’abord la parenthèse.",
          bilan: "Je calcule d’abord ce qui est entre parenthèses : 3 × (10 − 6) = 3 × 4 = 12."
        })
      },
      {
        n: 2, titre: "deux paires de parenthèses", nom: "Deux paires de parenthèses", palier: 3, type: "P",
        composer: vivierNiveau(C1_VIVIERS[2], [5, 5]),
        imposes: [c1Calcul(2, "fois-paires", op("×", op("−", 9, 4, true), op("+", 3, 5, true))), c1Calcul(2, "moins-paires", op("−", op("×", 6, 7, true), op("+", 2, 5, true)))],
        apprends: c1Apprends({
          manipule: c1Calcul(0, "fois-paires", op("×", op("+", 4, 2, true), op("−", 12, 5, true))),
          represente: c1Calcul(0, "moins-paires", op("−", op("×", 2, 9, true), op("+", 3, 4, true))),
          ecris: c1Calcul(0, "fois-paires", op("×", op("+", 5, 3, true), op("−", 10, 4, true))),
          consigne: "Chaque parenthèse d’abord.",
          consigneEcris: "Chaque parenthèse d’abord.",
          bilan: "Chaque parenthèse d’abord : (4 + 2) × (12 − 5) = 6 × 7 = 42."
        })
      },
      {
        n: 3, titre: "parenthèses emboîtées", nom: "Parenthèses emboîtées", palier: 3, type: "P",
        composer: vivierNiveau(C1_VIVIERS[3], [5, 5]),
        imposes: [c1Calcul(3, "moins-emboite", op("−", 40, op("×", 5, op("−", 11, 6, true), true))), c1Calcul(3, "fois-emboite", op("×", 3, op("−", 15, op("+", 2, 6, true), true)))],
        apprends: c1Apprends({
          manipule: c1Calcul(0, "moins-emboite", op("−", 37, op("×", 3, op("−", 14, 6, true), true))),
          represente: c1Calcul(0, "moins-emboite", op("−", 50, op("×", 4, op("−", 9, 2, true), true))),
          ecris: c1Calcul(0, "fois-emboite", op("×", 6, op("−", 20, op("+", 8, 5, true), true))),
          consigne: "La parenthèse la plus à l’intérieur d’abord.",
          consigneEcris: "La parenthèse la plus à l’intérieur d’abord.",
          bilan: "La parenthèse la plus à l’intérieur d’abord : 37 − (3 × (14 − 6)) = 37 − (3 × 8) = 37 − 24 = 13."
        })
      }
    ]
  };

  // ------------------------------------------------- C3 : égalités à trou
  //
  // Niveau 1 : « 347 = 20 + □ », « 5 760 − □ = 5 360 », « □ − 400 = 5 360 »
  // (une barre et ses deux morceaux). Niveaux 2 et 3 : garder l'égalité,
  // « 144 + 7 = 142 + □ », « 142 − 14 = □ − 17 » (deux barres de la même
  // longueur). Données pour le dessin (sorte, haut, bas, cherche) et pour les
  // erreurs (envers : le décalage dans le mauvais sens ; cote : la valeur
  // d'un côté ; operation : la mauvaise opération).
  const C3_CODES = Object.freeze({egal: 1, retire: 2, depart: 3, "egalite-somme": 4, "egalite-difference": 5, "egalite-somme-grande": 6, "egalite-difference-grande": 7, "retire-produit": 8, "difference-quotient": 9});
  function c3Fabriquer(niveau, forme, morceaux, reponse, image, donnees) {
    const calcul = fabriquer("C3", niveau, forme, morceaux, reponse, donnees);
    return Object.freeze(Object.assign({}, avecCle(calcul, calcul.cle.replace(/^C3-(\d+)-/, `C3-$1-${C3_CODES[forme]}-`)), {
      image: Object.freeze({sorte: image.sorte, haut: Object.freeze(image.haut), bas: Object.freeze(image.bas), cherche: Object.freeze(image.cherche)})
    }));
  }
  const c3Egal = (niveau, n, a) => c3Fabriquer(niveau, "egal", [n, "=", a, "+", TROU], n - a,
    {sorte: "tout", haut: [n], bas: [a, n - a], cherche: ["bas", 1]}, {n, a, operation: n + a, envers: -1, cote: -1});
  const c3Retire = (niveau, n, m) => c3Fabriquer(niveau, "retire", [n, "−", TROU, "=", m], n - m,
    {sorte: "tout", haut: [n], bas: [m, n - m], cherche: ["bas", 1]}, {n, m, operation: n + m, envers: -1, cote: -1});
  const c3Depart = (niveau, a, m) => c3Fabriquer(niveau, "depart", [TROU, "−", a, "=", m], m + a,
    {sorte: "tout", haut: [m + a], bas: [m, a], cherche: ["haut", 0]}, {a, m, operation: m - a, envers: -1, cote: -1});
  // « 144 + 7 = 142 + □ » (niveau 2) ; « 144 + 237 = □ + 239 » (niveau 3).
  function c3Somme(niveau, a, b, c, d, grande) {
    const forme = grande ? "egalite-somme-grande" : "egalite-somme";
    const reponse = grande ? a + b - d : a + b - c;
    const envers = grande ? a + (d - b) : b - (a - c);
    const morceaux = grande ? [a, "+", b, "=", TROU, "+", d] : [a, "+", b, "=", c, "+", TROU];
    const image = grande
      ? {sorte: "somme", haut: [a, b], bas: [reponse, d], cherche: ["bas", 0]}
      : {sorte: "somme", haut: [a, b], bas: [c, reponse], cherche: ["bas", 1]};
    return c3Fabriquer(niveau, forme, morceaux, reponse, image, {a, b, c: grande ? reponse : c, d: grande ? d : reponse, ecart: grande ? d - b : a - c, envers, cote: a + b, operation: -1});
  }
  // « 142 − 14 = □ − 17 » : ce qui reste est pareil.
  function c3Difference(niveau, a, b, d, grande) {
    const forme = grande ? "egalite-difference-grande" : "egalite-difference";
    const reponse = a - b + d;
    return c3Fabriquer(niveau, forme, [a, "−", b, "=", TROU, "−", d], reponse,
      {sorte: "ecart", haut: [a, b], bas: [reponse, d], cherche: ["bas", 0]},
      {a, b, d, ecart: d - b, envers: a - (d - b), cote: a - b, operation: -1});
  }
  // Lot « couverture » (programme de CM1) : une opération de chaque côté.
  // « 178 − □ = 6 × 8 » : 6 × 8 = 48, la barre de 178 coupée en 48 et ce
  // qu'on a retiré. « 28 − 18 = □ ÷ 5 » : 28 − 18 = 10, le nombre cherché
  // coupé en 5 parts de 10.
  const c3RetireProduit = (niveau, n, a, b) => c3Fabriquer(niveau, "retire-produit", [n, "−", TROU, "=", a, "×", b], n - a * b,
    {sorte: "tout", haut: [n], bas: [a * b, n - a * b], cherche: ["bas", 1]}, {n, a, b, operation: -1, envers: -1, cote: a * b});
  const c3DifferenceQuotient = (niveau, x, y, k) => c3Fabriquer(niveau, "difference-quotient", [x, "−", y, "=", TROU, "÷", k], (x - y) * k,
    {sorte: "tout", haut: [(x - y) * k], bas: Array.from({length: k}, () => x - y), cherche: ["haut", 0]}, {x, y, k, operation: -1, envers: -1, cote: x - y});
  const c3Image = calcul => Object.assign({outil: "deux-barres"}, calcul.image, {haut: calcul.image.haut.slice(), bas: calcul.image.bas.slice(), cherche: calcul.image.cherche.slice()});
  const c3Aide = calcul => Object.assign(c3Image(calcul), {masque: true});
  function c3Phrase(calcul) {
    const {texte, reponse} = calcul;
    return fr(`Regarde : ${sansEspace(texte).replace(CASE, f(reponse))}.`);
  }
  const C3_RANGS = Object.freeze({egal: 0, retire: 1, depart: 2, "egalite-somme": 0, "egalite-difference": 1, "egalite-somme-grande": 0, "egalite-difference-grande": 1, "retire-produit": 2, "difference-quotient": 2});
  const c3Difficulte = calcul => C3_RANGS[calcul.forme] * 10000 + Math.min(calcul.reponse, 9999);
  const C3_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "le décalage dans le mauvais sens",
      test: sauf((calcul, reponse) => calcul.donnees.envers >= 0 && memeNombre(reponse, calcul.donnees.envers)),
      retour: (calcul, reponse) => {
        const {a, b, c, d, ecart} = calcul.donnees;
        if (calcul.forme === "egalite-somme") return fr(`${f(reponse)} : ${f(c)}, c’est ${f(Math.abs(ecart))} de ${ecart > 0 ? "moins" : "plus"} que ${f(a)}. De l’autre côté, il faut ${f(Math.abs(ecart))} de ${ecart > 0 ? "plus" : "moins"}.`);
        if (calcul.forme === "egalite-somme-grande") return fr(`${f(reponse)} : ${f(d)}, c’est ${f(Math.abs(ecart))} de ${ecart > 0 ? "plus" : "moins"} que ${f(b)}. De l’autre côté, il faut ${f(Math.abs(ecart))} de ${ecart > 0 ? "moins" : "plus"}.`);
        return fr(`${f(reponse)} : on retire ${f(Math.abs(ecart))} de ${ecart > 0 ? "plus" : "moins"}. Il faut partir de ${f(Math.abs(ecart))} de ${ecart > 0 ? "plus" : "moins"}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "un seul côté calculé",
      test: sauf((calcul, reponse) => calcul.donnees.cote >= 0 && memeNombre(reponse, calcul.donnees.cote)),
      retour: (calcul, reponse) => {
        const {a, b} = calcul.donnees;
        if (calcul.forme === "retire-produit") return fr(`${f(reponse)}, c’est ${f(a)} × ${f(b)} : ce que vaut le côté droit. Il manque le nombre qu’on retire à ${f(calcul.donnees.n)}.`);
        if (calcul.forme === "difference-quotient") return fr(`${f(reponse)}, c’est ${f(calcul.donnees.x)} − ${f(calcul.donnees.y)} : ce que vaut le côté gauche. Le nombre cherché, divisé par ${calcul.donnees.k}, doit faire ${f(reponse)}.`);
        const signe = calcul.forme.startsWith("egalite-somme") ? "+" : "−";
        return fr(`${f(reponse)}, c’est ${f(a)} ${signe} ${f(b)} : ce que vaut chaque côté. Il manque le nombre de l’autre côté.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "la mauvaise opération",
      test: sauf((calcul, reponse) => calcul.donnees.operation >= 0 && memeNombre(reponse, calcul.donnees.operation)),
      retour: (calcul, reponse) => {
        const {n, a, m} = calcul.donnees;
        if (calcul.forme === "egal") return fr(`${f(reponse)}, c’est ${f(n)} + ${f(a)}. Ici, ${f(a)} et le nombre cherché font ${f(n)} : on enlève ${f(a)}.`);
        if (calcul.forme === "retire") return fr(`${f(reponse)}, c’est ${f(n)} + ${f(m)}. Ici, on cherche l’écart entre ${f(n)} et ${f(m)}.`);
        return fr(`${f(reponse)}, c’est ${f(m)} − ${f(a)}. On a retiré ${f(a)} au nombre cherché : il est plus grand que ${f(m)}.`);
      },
      gras: 0
    })
  ]);
  // Niveau 1 : des dizaines ou des centaines entières, sans retenue
  // (347 − 20 : le 4 des dizaines devient 2). Niveaux 2 et 3 : un décalage
  // de 1 à 3, dans un sens ou dans l'autre.
  const chiffreAuRang = (n, rang) => Math.floor(n / rang) % 10;
  function c3Vivier(niveau) {
    if (niveau === 1) {
      const egal = [];
      const retire = [];
      const depart = [];
      for (let n = 213; n <= 987; n += 37) [10, 100].forEach(u => entre(1, 9).forEach(k => {
        if (chiffreAuRang(n, u) > k) egal.push(c3Egal(1, n, k * u));
      }));
      for (let n = 2135; n <= 9876; n += 389) [10, 100].forEach(u => entre(1, 9).forEach(k => {
        if (chiffreAuRang(n, u) > k) retire.push(c3Retire(1, n, n - k * u));
        if (chiffreAuRang(n, u) + k <= 9) depart.push(c3Depart(1, k * u, n));
      }));
      // Lot 3a (décision 9) : « un calcul de l'autre côté » (173 − □ = 3 × 8,
      // 28 − 18 = □ ÷ 5) vient de « Garder l'égalité » : une 4e sorte ici.
      const produits = [];
      for (let n = 101; n <= 199; n += 6) entre(2, 9).forEach(a => entre(a, 9).forEach(b => { if (a * b <= n - 11 && ![a, b, a * b].includes(n - a * b)) produits.push(c3RetireProduit(1, n, a, b)); }));
      const quotients = [];
      entre(2, 10).forEach(q => entre(2, 9).forEach(k => entre(11, 39).filter(y => y % 10 !== 0 && y % 3 === q % 3).forEach(y => {
        if (![y + q, y, k, q].includes(q * k)) quotients.push(c3DifferenceQuotient(1, y + q, y, k));
      })));
      return Object.freeze({egal, retire, depart, "retire-produit": produits, "difference-quotient": quotients});
    }
    const sommes = [];
    const differences = [];
    const decalages = [-3, -2, -1, 1, 2, 3];
    if (niveau === 2) {
      for (let a = 104; a <= 989; a += 23) entre(2, 9).forEach(b => decalages.forEach(e => {
        if (b + e >= 1 && a - e > 100) sommes.push(c3Somme(2, a, b, a - e, null, false));
      }));
      for (let a = 121; a <= 989; a += 29) entre(11, 49).filter(b => b % 10 !== 0).forEach(b => decalages.forEach(e => {
        if (b + e > 10) differences.push(c3Difference(2, a, b, b + e, false));
      }));
      return Object.freeze({"egalite-somme": sommes, "egalite-difference": differences});
    }
    for (let a = 112; a <= 989; a += 31) [137, 158, 179, 216, 237, 245, 263, 318, 342, 376, 425, 457, 482].forEach(b => decalages.forEach(e => {
      if (a + b - (b + e) > 0) sommes.push(c3Somme(3, a, b, null, b + e, true));
    }));
    for (let a = 203; a <= 989; a += 31) entre(51, 99).filter(b => b % 10 !== 0).forEach(b => decalages.forEach(e => {
      if (b + e <= 99) differences.push(c3Difference(3, a, b, b + e, true));
    }));
    return Object.freeze({"egalite-somme-grande": sommes, "egalite-difference-grande": differences});
  }
  // La réponse n'est jamais un des nombres écrits sur les barres
  // (239 + 237 = □ + 239 → 237 : on la lirait sur la barre du haut).
  // Ni le décalage (242 + 6 = 245 + □ : la réponse serait 3, le décalage).
  const c3Lisible = calcul => [...calcul.image.haut, ...calcul.image.bas].filter(v => v === calcul.reponse).length === 1
    && !(calcul.donnees.ecart !== undefined && Math.abs(calcul.donnees.ecart) === calcul.reponse);
  const C3_VIVIERS = Object.freeze(Object.fromEntries([1, 2, 3].map(niveau => [niveau, Object.freeze(Object.fromEntries(Object.entries(c3Vivier(niveau)).map(([forme, liste]) => [forme, Object.freeze(liste.filter(c3Lisible))])))])));
  // Le dessin de J'écris : le décalage (2, ou 3), puis le nombre cherché.
  function deuxBarresDessins(image, etapes) {
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: vus.length, fini: vus.length >= etapes})));
    return dessinsDe(Array.from({length: etapes}, () => ({})), etapes, dessin);
  }

  const C3 = {
    id: "C3", nom: "Égalités à trou\u00a0: + et −", exemple: "347 = 20 + ?",
    famille: "C", construit: true,
    aide_entraine: "deux-barres",
    erreurs: C3_ERREURS, image: c3Image, aide: c3Aide, phrase: c3Phrase, manipulation: () => null, difficulte: c3Difficulte
  };
  C3.niveaux = [
    {
      n: 1, titre: "un nombre manquant", nom: "Égalités à trou simples", palier: 2, type: "P",
      composer: vivierNiveau(C3_VIVIERS[1], [4, 2, 2, 1, 1]),
      imposes: [c3Egal(1, 657, 40), c3Depart(1, 300, 4250)],
      apprends: apprendsSansManip({
        fiche: C3,
        represente: c3Egal(0, 347, 20),
        ecris: c3Egal(0, 684, 300),
        consigne: "Les deux barres ont la même longueur.",
        consigneEcris: "684 = 300 + ?",
        etapes: [["684 − 300 = ?", 384]],
        dessins: (calcul, n) => deuxBarresDessins(c3Image(calcul), n),
        bilan: "Les deux barres ont la même longueur : 347 = 20 + 327, et 347 − 20 = 327."
      })
    },
    {
      n: 2, titre: "garder l’égalité", nom: "Garder l’égalité", palier: 2, type: "P",
      composer: vivierNiveau(C3_VIVIERS[2], [6, 4]),
      imposes: [c3Somme(2, 236, 8, 233, null, false), c3Difference(2, 175, 26, 28, false)],
      apprends: apprendsSansManip({
        fiche: C3,
        represente: c3Somme(0, 144, 7, 142, null, false),
        ecris: c3Somme(0, 365, 9, 362, null, false),
        consigne: "142, c’est 2 de moins que 144.",
        consigneEcris: "365 + 9 = 362 + ?",
        etapes: [["365 − 362 = ?", 3], ["9 + 3 = ?", 12]],
        dessins: (calcul, n) => deuxBarresDessins(c3Image(calcul), n),
        bilan: "142, c’est 2 de moins que 144 ; de l’autre côté, il faut 2 de plus : 144 + 7 = 142 + 9."
      })
    },
    {
      n: 3, titre: "garder l’égalité, grands nombres", nom: "Garder l’égalité, grands nombres", palier: 3, type: "P",
      composer: vivierNiveau(C3_VIVIERS[3], [5, 5]),
      imposes: [c3Somme(3, 258, 145, null, 148, true), c3Difference(3, 431, 67, 65, true)],
      apprends: apprendsSansManip({
        fiche: C3,
        represente: c3Somme(0, 144, 237, null, 239, true),
        ecris: c3Somme(0, 256, 198, null, 200, true),
        consigne: "239, c’est 2 de plus que 237.",
        consigneEcris: "256 + 198 = ? + 200",
        etapes: [["200 − 198 = ?", 2], ["256 − 2 = ?", 254]],
        dessins: (calcul, n) => deuxBarresDessins(c3Image(calcul), n),
        bilan: "239, c’est 2 de plus que 237 ; de l’autre côté, il faut 2 de moins : 144 + 237 = 142 + 239."
      })
    }
  ];

  // ============================================ modules lot 5 (04/11/2026)
  //
  // D1, D3, D4 : les décimaux du palier 2. Décisions de Gwenaël du 04/11
  // (planches choix-1 à choix-3) :
  //  - D1 : le carré de 100 à colorier (Je manipule), le carré dessiné à
  //    lire (Je représente, l'aide de l'entraînement, niveaux 1 et 2), puis
  //    le tableau de numération qui se remplit (J'écris, la correction,
  //    « À retenir ») ; niveau 3 (millièmes) : le tableau seul. Les fractions
  //    s'écrivent comme sur le cahier (« 2/10 » dans le texte, dessiné par la
  //    page) ; « 0,3 = □/10 » : la case est le numérateur, sans virgule.
  //  - D3 : D2 retourné (le glisse-nombres vers la droite, le tableau à
  //    flèches « ÷ »).
  //  - D4 : le tableau à jetons et sa réserve (Je manipule), puis le tableau
  //    de numération partout : ce qui ne change pas en gris, ce qui change
  //    « ? », la retenue en petit 1 rouge.

  const RANGS_DECIMAUX = Object.freeze({"-2": Object.freeze(["centaine", "centaines"]), "-1": Object.freeze(["dizaine", "dizaines"]), 0: Object.freeze(["unité", "unités"]), 1: Object.freeze(["dixième", "dixièmes"]), 2: Object.freeze(["centième", "centièmes"]), 3: Object.freeze(["millième", "millièmes"])});
  // « 3 dixièmes », « 1 centième » (k : 0 unités, 1 dixièmes…).
  const enRang = (nombre, k) => `${f(nombre)} ${RANGS_DECIMAUX[k][nombre >= 2 ? 1 : 0]}`;
  const nomRangs = k => RANGS_DECIMAUX[k][1];
  // « 10 dixièmes font une unité. »
  const UNE_UNITE = Object.freeze({1: "10 dixièmes font une unité", 2: "100 centièmes font une unité", 3: `1${ESPACE_FINE}000 millièmes font une unité`});
  // « a, b et c »
  const etListe = liste => (liste.length < 2 ? liste.join("") : `${liste.slice(0, -1).join(", ")} et ${liste[liste.length - 1]}`);
  // Le chiffre d'un décimal à un rang (0 : unités, −1 : dixièmes…).
  const chiffreAuRangDecimal = (n, rang) => Math.floor(Math.round(n * 1000) / 10 ** (3 + rang)) % 10;
  // Un morceau écrit : un entier (k = 0) ou une fraction décimale num/10^k.
  const terme = (num, k) => Object.freeze({num, k});
  const valeurTerme = t => exact(t.num / 10 ** t.k);
  // « 2/10 », « 107/1 000 » (espace fine des milliers), « □/100 ».
  const ecrireFraction = (num, k) => `${num === TROU ? CASE : f(num)}/${f(10 ** k)}`;
  const ecrireTerme = t => (t.k === 0 ? f(t.num) : ecrireFraction(t.num, t.k));
  // « 3 + 2/10 = □ » → « 3 + 2/10 »
  const sansCase = texte => texte.replace(` = ${CASE}`, "");
  // Pour tirer un échantillon régulier d'un long vivier (les numérateurs à
  // trois chiffres de D1) : un calcul sur `pas`.
  const echantillon = (liste, nombre) => {
    const pas = Math.max(1, Math.ceil(liste.length / nombre));
    return liste.filter((_, i) => i % pas === 0);
  };

  // Un niveau tiré dans des viviers par écriture, chaque écriture partagée
  // en sous-viviers tirés à tour de rôle (D1-2 : « 712/100 », « 45/100 »,
  // « 7/100 » — sans ça, les numérateurs à trois chiffres, les plus
  // nombreux, prendraient toute la place). Le premier sous-vivier servi
  // change d'une série à l'autre.
  function vivierEquilibre(viviers, parts) {
    const formes = Object.keys(viviers);
    return function composer(rng, total, imposes) {
      const nombres = repartir(total, parts);
      const pris = new Set(imposes.map(c => c.cle));
      const tires = formes.flatMap((forme, i) => {
        const voulu = Math.max(0, nombres[i] - imposes.filter(c => c.forme === forme).length);
        const sous = viviers[forme].map(liste => melanger(rng, liste).filter(c => !pris.has(c.cle)));
        const debut = Math.floor(rng() * sous.length);
        const choix = [];
        for (let tour = 0; choix.length < voulu && sous.some(liste => liste.length); tour += 1) {
          const liste = sous[(debut + tour) % sous.length];
          if (liste.length) choix.push(liste.shift());
        }
        return choix;
      });
      return [...tires, ...imposes];
    };
  }

  // Le dessin de J'écris avec le tableau de numération (D1, D4) : chaque
  // étape juste écrit ses cases (`rangs` du résultat, `lignes` : les
  // chiffres d'une ligne du calcul, quand la ligne est une fraction à
  // écrire, D4 « 3/100 = 0,03 »), en vert.
  function numerationDessins(image, morceaux) {
    const dessin = (vus, revele = false) => {
      if (revele) return Object.freeze(Object.assign({}, image, {inconnue: false, lignes: image.lignes.map(l => Object.freeze(Object.assign({}, l, {cherche: false})))}));
      const trouves = [...new Set(vus.flatMap(m => m.rangs || []))].sort((a, b) => b - a);
      const lignes = new Set(vus.flatMap(m => m.lignes || []));
      return Object.freeze(Object.assign({}, image, {
        inconnue: true, trouves,
        lignes: image.lignes.map((l, i) => Object.freeze(Object.assign({}, l, l.cherche && lignes.has(i) ? {cherche: false, trouvee: true} : {})))
      }));
    };
    return dessinsDe(morceaux, morceaux.length, dessin);
  }

  // ------------------------------------------------- D1 : écritures d'un décimal
  //
  // Quatre écritures : « entier-fraction » (3 + 2/10 = □), « fraction »
  // (32/10 = □), « fractions » (4/10 + 8/100 = □, en désordre au niveau 3),
  // « numerateur » (0,3 = □/10 : la réponse est un entier). Les données :
  // r (la réponse), v (le décimal écrit), et les réponses fausses des
  // erreurs connues (pour la page du professeur, qui les retrouve dans les
  // données) — -1 quand une erreur n'a pas de sens pour ce calcul.
  const D1_CODES = Object.freeze({"entier-fraction": 1, fraction: 2, fractions: 3, numerateur: 4, decompose: 5});
  function d1Somme(niveau, forme, termes) {
    const r = exact(termes.reduce((s, t) => s + valeurTerme(t), 0));
    const fractions = termes.filter(t => t.k > 0);
    const kmax = Math.max(...fractions.map(t => t.k));
    const a = termes[0].k === 0 ? termes[0].num : 0;
    const sommeNumerateurs = fractions.reduce((s, t) => s + t.num, 0);
    // Les chiffres des numérateurs écrits à la suite après la virgule, dans
    // l'ordre du calcul (8/100 + 4/10 + 3/1 000 → 0,843 ; 5/10 + 3/1 000 → 0,53).
    const suite = forme === "fractions" && fractions.every(t => t.num <= 9) ? exact(fractions.reduce((s, t, i) => s + t.num / 10 ** (i + 1), 0)) : -1;
    const donnees = {
      r, v: r, a, kmax,
      colles: forme === "fraction" ? fractions[0].num : forme === "entier-fraction" ? Number(`${a}${fractions[0].num}`) : exact(r * 10 ** kmax),
      plus: exact(r * 10), moins: exact(r / 10),
      // (3 + 2/10 → 5 : c'est 3 + 2, les nombres additionnés, pas un rang.)
      decalePlus: forme === "entier-fraction" && kmax > 1 ? exact(a + (r - a) * 10) : -1,
      decaleMoins: forme === "entier-fraction" ? exact(a + (r - a) / 10) : -1,
      additionne: forme === "entier-fraction" ? a + fractions[0].num : forme === "fractions" ? sommeNumerateurs : -1,
      additionneRang: forme === "fractions" ? exact(sommeNumerateurs / 10 ** kmax) : -1,
      suite
    };
    return Object.freeze({
      texte: `${termes.map(ecrireTerme).join(" + ")} = ${CASE}`, reponse: r, forme, module: "D1", niveau,
      cle: `D1-${niveau}-${D1_CODES[forme]}-${termes.map(t => `${cleNombre(t.num)}-${t.k}`).join("-")}`,
      donnees: Object.freeze(donnees), termes: Object.freeze(termes.slice())
    });
  }
  // « 0,3 = □/10 », « 1/10 = □/100 » : `gauche` est un nombre ou une fraction.
  function d1Numerateur(niveau, gauche, k) {
    const nombre = typeof gauche === "number";
    const v = nombre ? gauche : valeurTerme(gauche);
    const r = Math.round(v * 10 ** k);
    const ecrit = nombre ? f(gauche) : ecrireTerme(gauche);
    return Object.freeze({
      texte: `${ecrit} = ${ecrireFraction(TROU, k)}`, reponse: r, forme: "numerateur", module: "D1", niveau,
      cle: `D1-${niveau}-4-${nombre ? cleNombre(gauche) : `${gauche.num}-${gauche.k}`}-x-${k}`,
      donnees: Object.freeze({r, v, k, colles: -1, plus: r * 10, moins: exact(r / 10), decalePlus: -1, decaleMoins: -1, additionne: -1, additionneRang: -1, suite: -1}),
      gauche: nombre ? terme(gauche, 0) : gauche, ecritGauche: ecrit, k
    });
  }
  // « 4,107 = 4 + □/10 + 7/1 000 » (lot « couverture », exemple de CM2) : un
  // chiffre de la décomposition à retrouver ; dessiné comme « 0,3 = □/10 »
  // (le nombre dans le tableau, la case à ses dixièmes).
  function d1Decompose(niveau, v) {
    const c = Math.round(v * 1000);
    const a = Math.floor(c / 1000);
    const b = Math.floor(c / 100) % 10;
    const u = c % 100;
    const reste = u % 10 === 0 ? `${u / 10}/100` : Math.floor(u / 10) === 0 ? `${u}/1${ESPACE_FINE}000` : `${u}/1${ESPACE_FINE}000`;
    return Object.freeze({
      texte: `${f(v)} = ${a} + ${CASE}/10 + ${reste}`, reponse: b, forme: "numerateur", annonce: "on cherche un chiffre de la décomposition", decompose: true, module: "D1", niveau,
      cle: `D1-${niveau}-5-${cleNombre(v)}`,
      donnees: Object.freeze({r: b, v, k: 1, colles: -1, plus: -1, moins: -1, decalePlus: -1, decaleMoins: -1, additionne: -1, additionneRang: -1, suite: -1}),
      gauche: terme(v, 0), ecritGauche: f(v), k: 1
    });
  }
  const d1EntierFraction = (niveau, a, b, k) => d1Somme(niveau, "entier-fraction", [terme(a, 0), terme(b, k)]);
  const d1Fraction = (niveau, num, k) => d1Somme(niveau, "fraction", [terme(num, k)]);
  const d1Fractions = (niveau, ...paires) => d1Somme(niveau, "fractions", paires.map(([num, k]) => terme(num, k)));

  // Le carré de 100 ou le tableau : les millièmes ne se dessinent pas dans
  // un carré de 100 (tout le niveau 3, décision du 04/11 : « 3/100 + 4/10 »
  // aussi) ; et l'unité est le grand carré (planche choix-4 du 04/11) : à
  // la vraie taille, quatre carrés au plus tiennent au téléphone — au-delà
  // de 3 unités (712/100, 8 + 4/10), le tableau.
  const D1_UNITES_DU_CARRE = 3;
  const d1SansCarre = calcul => calcul.niveau === 3 || Math.trunc(calcul.donnees.v) > D1_UNITES_DU_CARRE
    || (calcul.forme === "numerateur" ? calcul.k === 3 || calcul.gauche.k === 3 || decimalesDe(calcul.donnees.v) === 3 : calcul.termes.some(t => t.k === 3));
  // Le carré de 100 d'un décimal : les unités (carrés pleins), les bandes
  // (dixièmes), les petits carrés (centièmes).
  function d1Carre(v) {
    const c = Math.round(v * 100);
    return {outil: "carre", unites: Math.floor(c / 100), dixiemes: Math.floor(c / 10) % 10, centiemes: c % 10};
  }
  // Le tableau de numération d'un calcul de D1 : chaque morceau sur sa
  // ligne, dans ses colonnes ; le résultat dessous. « 0,3 = □/10 » : la
  // ligne de 0,3, et dessous le numérateur cherché, rangé à ses dixièmes.
  function d1Tableau(calcul, {inconnue = false} = {}) {
    if (calcul.forme === "numerateur") {
      const g = calcul.gauche;
      const ligne = g.k === 0 ? {nombre: g.num, unite: 0, texte: f(g.num)} : {nombre: g.num, unite: -g.k, texte: ecrireTerme(g)};
      return {outil: "numeration", lignes: [Object.freeze(ligne)],
        resultat: {nombre: calcul.reponse, unite: -calcul.k, texte: `${inconnue ? "?" : f(calcul.reponse)}/${f(10 ** calcul.k)}`}, inconnue};
    }
    const lignes = calcul.termes.map((t, i) => Object.freeze({nombre: t.num, unite: -t.k, texte: `${i ? "+ " : ""}${ecrireTerme(t)}`}));
    return {outil: "numeration", lignes, resultat: {nombre: calcul.reponse, unite: 0, texte: ""}, inconnue};
  }
  const d1Image = calcul => d1Tableau(calcul);
  // (« 4,107 = 4 + □/10 + 7/1 000 » : pas d'aide, le tableau écrirait le
  // chiffre cherché ; la correction, elle, le montre.)
  const d1Aide = calcul => (calcul.decompose ? null : d1SansCarre(calcul) ? d1Tableau(calcul, {inconnue: true}) : d1Carre(calcul.donnees.v));
  const d1Phrase = calcul => fr(`Regarde : ${sansEspace(calcul.texte).replace(CASE, f(calcul.reponse))}.`);
  // « 4 dixièmes, 8 centièmes et 3 millièmes » : les morceaux rangés.
  const d1Rangs = calcul => etListe(calcul.termes.filter(t => t.k > 0).slice().sort((p, q) => p.k - q.k).map(t => enRang(t.num, t.k)));

  // Le carré de 100 à colorier (Je manipule, et l'entraînement après deux
  // erreurs) : les unités sont déjà là (des carrés pleins, de la même
  // taille) ; un
  // toucher colorie une bande entière (un dixième), puis, les dixièmes
  // faits, un petit carré (un centième). L'appli écrit le calcul au bout.
  // Ni sur « ? au numérateur » (1 = □/100 ferait 100 touchers), ni sur les
  // millièmes.
  function d1Manipulation(calcul) {
    if (calcul.forme === "numerateur" || d1SansCarre(calcul)) return null;
    const carre = d1Carre(calcul.donnees.v);
    const bande = "une bande, c’est un dixième";
    const petit = "un petit carré, c’est un centième";
    const pour = (num, k) => (k === 1 ? bande : num >= 10 ? "une bande, c’est 10 centièmes" : petit);
    const carres = u => `${u} carré${u > 1 ? "s" : ""} entier${u > 1 ? "s" : ""}`;
    let consigne;
    if (calcul.forme === "entier-fraction") {
      const [entier, t] = calcul.termes;
      consigne = `${enRang(entier.num, 0)} : ${carres(entier.num)}. Colorie ${enRang(t.num, t.k)} : ${pour(t.num, t.k)}.`;
    } else if (calcul.forme === "fraction") {
      const [t] = calcul.termes;
      const reste = t.num - carre.unites * 10 ** t.k;
      consigne = carre.unites
        ? `${f(t.num)} ${nomRangs(t.k)} : ${f(carre.unites * 10 ** t.k)} ${nomRangs(t.k)} font ${carres(carre.unites)}. Colorie les ${enRang(reste, t.k)} qui restent : ${pour(reste, t.k)}.`
        : `Colorie ${enRang(t.num, t.k)} : ${pour(t.num, t.k)}.`;
    } else {
      const parRang = calcul.termes.slice().sort((p, q) => p.k - q.k);
      consigne = `Colorie ${parRang.map(t => enRang(t.num, t.k)).join(", puis ")} : ${bande}, ${petit}.`;
    }
    const calc = sansCase(calcul.texte);
    return Object.freeze(Object.assign(carre, {
      texte: calc, consigne: fr(consigne), refus: null,
      traces: Object.freeze([Object.freeze({apres: carre.dixiemes + carre.centiemes, attente: `${calc} = …`, texte: `${calc} = ${f(calcul.reponse)}`})])
    }));
  }

  // Du plus simple au plus dur : l'écriture, les millièmes, un rang vide
  // au milieu (3 + 5/100 = 3,05), au-delà de 3 unités, la taille des
  // numérateurs.
  const D1_RANGS = Object.freeze({"entier-fraction": 0, fraction: 1, fractions: 2, numerateur: 3, decompose: 3});
  function d1Difficulte(calcul) {
    const {r, v} = calcul.donnees;
    const decimales = decimalesDe(calcul.forme === "numerateur" ? v : r);
    const trouVide = !calcul.forme === "numerateur" && [-1, -2].some(rang => -rang < decimales && chiffreAuRangDecimal(r, rang) === 0) ? 200 : 0;
    const desordre = calcul.forme === "fractions" && calcul.termes.some((t, i) => i && t.k <= calcul.termes[i - 1].k) ? 300 : 0;
    // Ceux qui tiennent dans le carré de 100 (de 0 à 3 unités) d'abord :
    // l'entraînement commence au carré.
    const auTableau = Math.trunc(v) > D1_UNITES_DU_CARRE ? 150 : 0;
    return D1_RANGS[calcul.forme] * 1000 + decimales * 60 + trouVide + desordre + auTableau + Math.min(String(Math.round(r)).length, 3) * 10 + (calcul.forme === "numerateur" ? Math.min(r, 999) / 100 : 0);
  }

  // Les erreurs connues, essayées dans l'ordre 3, 4, 1, 2 : « 32 » pour
  // 3 + 2/10 (les chiffres collés) est aussi un rang de trop — c'est la
  // virgule qui manque qu'on dit ; « 0,97 » pour 9/100 + 7/1 000 (les
  // chiffres à la suite) aussi — c'est l'ordre qu'on dit.
  const D1_ERREURS = Object.freeze([
    Object.freeze({
      c: 3, nom: "le numérateur seul, ou les chiffres collés",
      test: sauf((calcul, reponse) => calcul.donnees.colles >= 0 && memeNombre(reponse, calcul.donnees.colles)),
      retour: (calcul, reponse) => {
        if (calcul.forme === "fraction") {
          const [t] = calcul.termes;
          return fr(`${f(reponse)}, c’est le numérateur. ${ecrireTerme(t)}, c’est ${enRang(t.num, t.k)} : ${UNE_UNITE[t.k]}.`);
        }
        if (calcul.forme === "entier-fraction") {
          const [entier, t] = calcul.termes;
          return fr(`${f(reponse)} : la virgule manque. ${sansCase(calcul.texte)}, c’est ${enRang(entier.num, 0)} et ${enRang(t.num, t.k)}.`);
        }
        return fr(`${f(reponse)} : la virgule manque. ${d1Rangs(calcul)}, c’est moins qu’une unité.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 4, nom: "les chiffres écrits à la suite, dans l’ordre du calcul",
      test: sauf((calcul, reponse) => calcul.donnees.suite >= 0 && memeNombre(reponse, calcul.donnees.suite)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : tu as écrit les chiffres à la suite, dans l’ordre du calcul. Range chaque morceau dans sa colonne : ${d1Rangs(calcul)}.`),
      gras: 0
    }),
    Object.freeze({
      c: 1, nom: "un rang de trop ou de moins",
      test: sauf((calcul, reponse) => ["plus", "moins", "decalePlus", "decaleMoins"].some(cle => calcul.donnees[cle] >= 0 && memeNombre(reponse, calcul.donnees[cle]))),
      retour: (calcul, reponse) => {
        if (calcul.forme === "numerateur") {
          const g = calcul.gauche;
          return fr(`${f(reponse)} : un rang de ${reponse > calcul.reponse ? "trop" : "moins"}. Compte les ${nomRangs(calcul.k)} dans ${g.k === 0 ? calcul.ecritGauche : enRang(g.num, g.k)}.`);
        }
        if (calcul.forme === "fraction") {
          const [t] = calcul.termes;
          return fr(`${f(reponse)} : un chiffre n’est pas au bon rang. Le chiffre des unités de ${f(t.num)} va aux ${nomRangs(t.k)}.`);
        }
        if (calcul.forme === "entier-fraction") {
          const t = calcul.termes[1];
          return fr(`${f(reponse)} : un chiffre n’est pas au bon rang. ${ecrireTerme(t)}, c’est ${enRang(t.num, t.k)}.`);
        }
        return fr(`${f(reponse)} : un chiffre n’est pas au bon rang. Range chaque morceau dans sa colonne : ${d1Rangs(calcul)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "les nombres écrits additionnés",
      test: sauf((calcul, reponse) => ["additionne", "additionneRang"].some(cle => calcul.donnees[cle] >= 0 && memeNombre(reponse, calcul.donnees[cle]))),
      retour: (calcul, reponse) => {
        const fractions = calcul.termes.filter(t => t.k > 0);
        if (calcul.forme === "entier-fraction") {
          const [entier, t] = calcul.termes;
          return fr(`${f(reponse)}, c’est ${f(entier.num)} + ${f(t.num)}. ${ecrireTerme(t)}, c’est ${enRang(t.num, t.k)} : les ${nomRangs(t.k)} s’écrivent après la virgule.`);
        }
        return fr(`${f(reponse)} : tu as ajouté ${etListe(fractions.map(t => f(t.num)))}. ${d1Rangs(calcul)} ne sont pas de la même sorte : chacun va dans sa colonne.`);
      },
      gras: 0
    })
  ]);

  // Les viviers. Jamais une fraction unitaire seule (1/10 = □ : c'est F1),
  // jamais un numérateur multiple de 10 dans « fraction ».
  const sansDizaineEntiere = (de, a) => entre(de, a).filter(n => n % 10 !== 0);
  function d1Vivier(niveau) {
    if (niveau === 1) {
      return Object.freeze({
        "entier-fraction": [entre(1, 9).flatMap(a => entre(1, 9).map(b => d1EntierFraction(1, a, b, 1)))],
        fraction: [sansDizaineEntiere(11, 99).map(n => d1Fraction(1, n, 1))],
        numerateur: [
          entre(1, 9).map(b => d1Numerateur(1, exact(b / 10), 1)),
          entre(1, 9).flatMap(a => entre(1, 9).map(b => d1Numerateur(1, exact(a + b / 10), 1))),
          entre(1, 9).map(a => d1Numerateur(1, a, 1))
        ]
      });
    }
    if (niveau === 2) {
      return Object.freeze({
        fraction: [
          echantillon(sansDizaineEntiere(101, 999), 90).map(n => d1Fraction(2, n, 2)),
          sansDizaineEntiere(11, 99).map(n => d1Fraction(2, n, 2)),
          entre(2, 9).map(n => d1Fraction(2, n, 2))
        ],
        "entier-fraction": [
          entre(1, 9).flatMap(a => entre(1, 9).map(b => d1EntierFraction(2, a, b, 2))),
          echantillon(entre(1, 9).flatMap(a => sansDizaineEntiere(11, 99).map(b => [a, b])), 90).map(([a, b]) => d1EntierFraction(2, a, b, 2))
        ],
        fractions: [entre(1, 9).flatMap(b => entre(1, 9).map(c => d1Fractions(2, [b, 1], [c, 2])))],
        numerateur: [
          entre(1, 9).map(b => d1Numerateur(2, terme(b, 1), 2)),
          echantillon(entre(0, 9).flatMap(a => sansDizaineEntiere(1, 99).map(c => exact(a + c / 100))), 90).map(v => d1Numerateur(2, v, 2)),
          entre(1, 9).map(a => d1Numerateur(2, a, 2))
        ]
      });
    }
    // Niveau 3 : les millièmes, et les sommes en désordre.
    // Trois morceaux en désordre, des chiffres tous différents (sinon
    // « 3/100 + 3/1 000 + 3/10 » se lit dans n'importe quel ordre).
    const trois = [];
    const ordres = [[2, 1, 3], [1, 3, 2], [3, 1, 2], [2, 3, 1], [3, 2, 1]];
    entre(1, 9).forEach(b => entre(1, 9).forEach(c => entre(1, 9).forEach(d => {
      if (b === c || c === d || b === d || (b + c + d) % 5) return;
      const ordre = ordres[(b + 2 * c + 3 * d) % ordres.length];
      const chiffres = {1: b, 2: c, 3: d};
      trois.push(ordre.map(k => [chiffres[k], k]));
    })));
    const deux = [];
    entre(1, 9).forEach(x => entre(1, 9).forEach(y => {
      if (x === y) return;
      deux.push([[x, 2], [y, 1]], [[x, 3], [y, 1]], [[y, 1], [x, 3]], [[x, 3], [y, 2]], [[y, 2], [x, 3]]);
    }));
    const avecEntier = liste => liste.map((b, i) => d1EntierFraction(3, 1 + (i * 4) % 9, b, 3));
    return Object.freeze({
      "entier-fraction": [avecEntier(entre(1, 9)), avecEntier(sansDizaineEntiere(11, 99)), avecEntier(echantillon(sansDizaineEntiere(101, 999), 90))],
      fractions: [echantillon(trois, 120).map(t => d1Fractions(3, ...t)), echantillon(deux, 120).map(t => d1Fractions(3, ...t))],
      numerateur: [
        echantillon(entre(0, 9).flatMap(a => sansDizaineEntiere(1, 999).filter(c => c % 7 === 3).map(c => exact(a + c / 1000))), 120).map(v => d1Numerateur(3, v, 3)),
        entre(1, 9).map(c => d1Numerateur(3, terme(c, 2), 3)),
        entre(1, 9).map(b => d1Numerateur(3, terme(b, 1), 3))
      ],
      // Lot « couverture » (exemples de CM2) : « 4 107/1 000 = □ » et
      // « 4,107 = 4 + □/10 + 7/1 000 ».
      fraction: [echantillon(entre(1001, 9999).filter(n => n % 10 !== 0), 120).map(n => d1Fraction(3, n, 3))],
      decompose: [echantillon(entre(1, 9).flatMap(a => entre(1, 9).flatMap(b => [7, 23, 45, 3, 61].map(u => exact(a + b / 10 + u / 1000)))), 120).map(v => d1Decompose(3, v))]
    });
  }
  const D1_VIVIERS = Object.freeze({1: d1Vivier(1), 2: d1Vivier(2), 3: d1Vivier(3)});

  // J'apprends de D1 : le carré à colorier sur le premier calcul (niveaux 1
  // et 2), le carré dessiné à lire sur le deuxième (le tableau au niveau
  // 3), le tableau de numération qui se remplit sur le troisième.
  //   rangs : les cases du résultat que chaque étape écrit.
  function d1Apprends({manipule, represente, ecris, consigne, consigneEcris, etapes, rangs, bilan}) {
    const premier = manipule || represente;
    return Object.freeze({
      exemple: exempleDe(premier),
      manipule: manipule ? d1Manipulation(manipule) : null,
      represente: Object.freeze({
        outil: d1Aide(represente).outil, consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(d1Aide(represente)),
        solution: Object.freeze({image: Object.freeze(d1Image(represente)), phrase: d1Phrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        consigne: fr(consigneEcris),
        etapes: etapesEcris(etapes), reponse: ecris.reponse,
        solution: Object.freeze({image: Object.freeze(d1Image(ecris)), phrase: d1Phrase(ecris)})
      }, numerationDessins(d1Tableau(ecris, {inconnue: true}), rangs.map(liste => ({rangs: liste})))),
      bilan: frBilan(bilan),
      // « À retenir » : le tableau du calcul de « je représente », rempli.
      image: Object.freeze(d1Image(manipule || represente)),  // lot 3a : le calcul montré
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: manipule || represente, ecris: ecris}),
      textes: Object.freeze([...(manipule ? [manipule.texte] : []), represente.texte, ecris.texte])
    });
  }

  const D1 = {
    id: "D1", nom: "Écritures d’un décimal", exemple: "3 + 2/10",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "carre",
    erreurs: D1_ERREURS, image: d1Image, aide: d1Aide, phrase: d1Phrase, manipulation: d1Manipulation, difficulte: d1Difficulte,
    niveaux: [
      {
        n: 1, titre: "dixièmes", nom: "Dixièmes\u00a0: fraction et décimal", palier: 2, type: "P",
        composer: vivierEquilibre(D1_VIVIERS[1], [4, 3, 3]),
        imposes: [d1EntierFraction(1, 5, 3, 1), d1Numerateur(1, 0.4, 1)],
        apprends: d1Apprends({
          manipule: d1EntierFraction(0, 3, 2, 1),
          represente: d1Fraction(0, 27, 1),
          ecris: d1EntierFraction(0, 4, 6, 1),
          consigne: "10 dixièmes font une unité.",
          consigneEcris: "Chaque morceau va dans sa colonne.",
          etapes: [["6/10 = ?", 0.6], ["4 + 6/10 = ?", 4.6]],
          rangs: [[-1], [0, -1]],
          bilan: "Le chiffre des unités, puis la virgule, puis les dixièmes : 3 + 2/10 = 3,2."
        })
      },
      {
        n: 2, titre: "centièmes", nom: "Centièmes\u00a0: fraction et décimal", palier: 2, type: "P",
        composer: vivierEquilibre(D1_VIVIERS[2], [3, 2, 2, 3]),
        imposes: [d1Fraction(2, 6, 2), d1EntierFraction(2, 2, 8, 2)],
        apprends: d1Apprends({
          manipule: d1Fractions(0, [4, 1], [8, 2]),
          represente: d1Fraction(0, 245, 2),
          ecris: d1EntierFraction(0, 3, 5, 2),
          consigne: "100 centièmes font une unité.",
          consigneEcris: "Chaque morceau va dans sa colonne.",
          etapes: [["5/100 = ?", 0.05], ["3 + 5/100 = ?", 3.05]],
          rangs: [[-1, -2], [0, -1, -2]],
          bilan: "Les dixièmes juste après la virgule, puis les centièmes : 4/10 + 8/100 = 0,48."
        })
      },
      {
        n: 3, titre: "millièmes, sommes en désordre", nom: "Millièmes, sommes en désordre", palier: 3, type: "P",
        composer: vivierEquilibre(D1_VIVIERS[3], [3, 3, 2, 1, 1]),
        imposes: [d1Fractions(3, [5, 3], [2, 1]), d1EntierFraction(3, 3, 46, 3)],
        apprends: d1Apprends({
          represente: d1Fractions(0, [8, 2], [4, 1], [3, 3]),
          ecris: d1EntierFraction(0, 4, 107, 3),
          consigne: "Je range chaque morceau dans sa colonne.",
          consigneEcris: "Chaque morceau va dans sa colonne.",
          etapes: [[`107/1${ESPACE_FINE}000 = ?`, 0.107], [`4 + 107/1${ESPACE_FINE}000 = ?`, 4.107]],
          rangs: [[-1, -2, -3], [0, -1, -2, -3]],
          bilan: `Je range chaque morceau dans sa colonne : 8/100 + 4/10 + 3/1${ESPACE_FINE}000 = 0,483.`
        })
      }
    ]
  };

  // ------------------------------------------------- D3 : ÷ 10, ÷ 100, ÷ 1 000
  //
  // « 45,2 ÷ 10 = □ » : D2 retourné. Les données : n (le résultat), p, m (le
  // nombre divisé). Jamais un résultat entier (480 ÷ 10 est dans M2), au
  // plus trois décimales.

  // Un calcul de D3 : la division de M2 et D2, avec dans ses données la
  // réponse fausse « la partie entière n'a pas changé de rang » (45,2 ÷ 10
  // → 45,02), pour l'exemple de la page du professeur ; -1 sans objet.
  function d3Division(niveau, n, p) {
    const calcul = division("D3", niveau, n, p);
    const {m} = calcul.donnees;
    const entiere = Math.trunc(m);
    const partie = entiere > 0 && !Number.isInteger(m) ? exact(entiere + (m - entiere) / p) : -1;
    return Object.freeze(Object.assign({}, calcul, {donnees: Object.freeze(Object.assign({}, calcul.donnees, {partie}))}));
  }
  // Un décimal tiré : `decimales` chiffres après la virgule (le dernier non
  // nul), la partie entière entre `minimum` et `maximum` ; un entier sans
  // multiple de 10 quand `decimales` vaut 0.
  const d3Nombre = (rng, decimales, minimum, maximum) => (decimales ? decimal(rng, decimales, minimum, maximum) : sansUniteNulle(rng, minimum, maximum));
  function d3Composer(niveau, places) {
    return function composer(rng, total, imposes) {
      const parts = repartir(total, places.map(place => place.part));
      let liste = places.flatMap((place, i) => Array.from({length: parts[i]}, () => place));
      liste = retirerImposes(liste, imposes, (place, c) => place.p === c.donnees.p && place.d === decimalesDe(c.donnees.m) && (c.donnees.m < 1) === (place.max < 1));
      const deja = imposes.slice();
      // (Un vivier court — 0,1 à 0,9 ÷ 10 — peut s'épuiser sur un grand
      // tirage : la place reste vide.)
      const tires = liste.map(place => {
        const [calcul] = tirerCalculs(rng, 1, r => d3Division(niveau, exact(d3Nombre(r, place.d, place.min, place.max) / place.p), place.p), deja);
        if (calcul) deja.push(calcul);
        return calcul;
      });
      return [...tires.filter(Boolean), ...imposes];
    };
  }
  // Niveau 1 : ÷ 10, résultat au-dessus de 1 : 5 entiers (37), 5 nombres à
  // une décimale (58,4). (Lot 7e : au CM1, le résultat a au plus deux
  // chiffres après la virgule — 10,68 ÷ 10 = 1,068 passe au CM2.)
  const d3Niveau1 = d3Composer(1, [{part: 5, p: 10, d: 0, min: 11, max: 999}, {part: 5, p: 10, d: 1, min: 10, max: 999}]);
  // Niveau 2 : ÷ 100 (6 sur 10 : entiers, et une décimale), ÷ 1 000 (4).
  const d3Niveau2 = d3Composer(2, [{part: 3, p: 100, d: 0, min: 101, max: 9999}, {part: 3, p: 100, d: 1, min: 100, max: 999}, {part: 4, p: 1000, d: 0, min: 1001, max: 9999}]);
  // Niveau 3 : un résultat sous 1, des zéros à écrire : 0,6 ÷ 10 ; 7 ÷ 10 ;
  // 45 ÷ 100 ; 3,6 ÷ 100 ; 56 ÷ 1 000.
  const d3Niveau3 = d3Composer(3, [
    {part: 1, p: 10, d: 1, min: 0, max: 0}, {part: 1, p: 10, d: 2, min: 0, max: 0}, {part: 2, p: 10, d: 0, min: 1, max: 9},
    {part: 2, p: 100, d: 0, min: 1, max: 99}, {part: 2, p: 100, d: 1, min: 1, max: 9},
    {part: 2, p: 1000, d: 0, min: 11, max: 999}
  ]);
  // Les erreurs connues de D3, dans l'ordre 1, 2, 3, 4, 5. « Pas divisé »
  // est aussi une colonne de moins pour ÷ 10 : c'est la première qui parle.
  // Jamais « zéro » ni « virgule » qui se déplace : les chiffres glissent.
  const D3_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "pas divisé",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.m)),
      retour: (calcul, reponse, ecrit) => {
        const {p, m} = calcul.donnees;
        return fr(`${commeEcrit(reponse, ecrit)} = ${f(m)} : tu n’as pas divisé. Chaque chiffre doit valoir ${f(p)} fois moins.`);
      }
    }),
    Object.freeze({
      c: 2, nom: "une colonne de moins",
      test: sauf((calcul, reponse) => memeNombre(reponse, exact(calcul.reponse * 10))),
      retour: (calcul, reponse) => {
        const {p} = calcul.donnees;
        return fr(`${f(reponse)} : une colonne de moins. Pour ÷ ${f(p)}, chaque chiffre glisse de ${pluriel(colonnesDe(p), "colonne")} vers la droite.`);
      }
    }),
    Object.freeze({
      c: 3, nom: "une colonne de trop",
      test: sauf((calcul, reponse) => memeNombre(reponse, exact(calcul.reponse / 10))),
      retour: (calcul, reponse) => {
        const {p} = calcul.donnees;
        const k = colonnesDe(p);
        return fr(`${f(reponse)} : une colonne de trop. Pour ÷ ${f(p)}, c’est ${pluriel(k, "colonne")}, pas ${k + 1}.`);
      }
    }),
    Object.freeze({
      c: 4, nom: "multiplié au lieu de diviser",
      test: sauf((calcul, reponse) => memeNombre(reponse, exact(calcul.donnees.m * calcul.donnees.p))),
      retour: (calcul, reponse) => {
        const {p, m} = calcul.donnees;
        return fr(`${f(reponse)}, c’est ${f(m)} × ${f(p)}. Ici, on divise : chaque chiffre vaut ${f(p)} fois moins.`);
      }
    }),
    Object.freeze({
      c: 5, nom: "la partie entière n’a pas changé de rang",
      test: sauf((calcul, reponse) => calcul.donnees.partie >= 0 && memeNombre(reponse, calcul.donnees.partie)),
      retour: (calcul, reponse) => {
        const {p, m} = calcul.donnees;
        return fr(`Dans ${f(reponse)}, le ${f(Math.trunc(m))} n’a pas changé de rang. Lui aussi vaut ${f(p)} fois moins.`);
      }
    })
  ]);

  const D3 = {
    id: "D3", nom: "÷ 10, ÷ 100, ÷ 1 000", exemple: "45,2 ÷ 10",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "tableau-fleches",
    erreurs: D3_ERREURS, image: tableauDe, aide: glisseAide, manipulation: glisseManipulation, difficulte: glisseDifficulte,
    niveaux: [
      {
        n: 1, titre: "décimal ÷ 10", nom: "Décimal ÷ 10", palier: 2, type: "P",
        composer: d3Niveau1,
        imposes: [d3Division(1, 3.7, 10), d3Division(1, 5.84, 10)],
        apprends: glisseApprends({
          calcul: d3Division(1, 4.52, 10), exemple: "45,2 ÷ 10", colonnes: COLONNES_D2,
          represente: d3Division(1, 7.3, 10),
          ecris: {calcul: d3Division(1, 5.27, 10), etapes: [etapeDe(`52,7 ÷ 10 = ${CASE}`, 5.27)]},
          consigne: "Chaque chiffre vaut 10 fois moins.",
          refus: "Chaque chiffre doit valoir 10 fois moins : 1 colonne.",
          trace: ["45,2 ÷ 10 = …", "45,2 ÷ 10 = 4,52"],
          bilan: frBilan("Quand je divise par 10, chaque chiffre prend une valeur 10 fois plus petite : 45,2 ÷ 10 = 4,52.")
        })
      },
      {
        n: 2, titre: "décimal ÷ 100, ÷ 1 000", nom: "Décimal ÷ 100, ÷ 1 000", palier: 3, type: "P",
        composer: d3Niveau2,
        imposes: [d3Division(2, 2.83, 100), d3Division(2, 4.125, 1000)],
        apprends: glisseApprends({
          calcul: d3Division(2, 4.56, 100), exemple: "456 ÷ 100", colonnes: COLONNES_D2,
          represente: d3Division(2, 3.718, 1000),
          ecris: {calcul: d3Division(2, 8.45, 100), etapes: [etapeDe(`845 ÷ 100 = ${CASE}`, 8.45)]},
          consigne: "Chaque chiffre vaut 100 fois moins.", consigneTableau: "Chaque chiffre vaut 1 000 fois moins.",
          refus: "Chaque chiffre doit valoir 100 fois moins : 2 colonnes.",
          trace: ["456 ÷ 100 = …", "456 ÷ 100 = 4,56"],
          bilan: frBilan("Quand je divise par 100, chaque chiffre prend une valeur 100 fois plus petite : 456 ÷ 100 = 4,56.")
        })
      },
      {
        n: 3, titre: "des zéros à écrire", nom: "Diviser : zéros à écrire", palier: 3, type: "P",
        composer: d3Niveau3,
        imposes: [d3Division(3, 0.08, 10), d3Division(3, 0.034, 1000)],
        apprends: glisseApprends({
          calcul: d3Division(3, 0.06, 10), exemple: "0,6 ÷ 10", colonnes: COLONNES_D2,
          represente: d3Division(3, 0.036, 100),
          // (Lot 3b : J'écris ÷ 10, comme la leçon ; ÷ 100 et ÷ 1 000 sont annoncés.)
          ecris: {calcul: d3Division(3, 0.09, 10), etapes: [etapeDe(`0,9 ÷ 10 = ${CASE}`, 0.09)]},
          consigne: "Chaque chiffre vaut 10 fois moins.", consigneTableau: "Chaque chiffre vaut 100 fois moins.",
          refus: "Chaque chiffre doit valoir 10 fois moins : 1 colonne.",
          trace: ["0,6 ÷ 10 = …", "0,6 ÷ 10 = 0,06"],
          bilan: frBilan("J’écris un zéro dans les colonnes vides devant le 6 : 0,6 ÷ 10 = 0,06.")
        })
      }
    ]
  };

  // ------------------------------------------- D4 : ajouter ou retrancher d'un rang
  //
  // « 4,45 + 0,3 = □ » (plus), « 0,45 + 3/100 = □ » (plus-fraction),
  // « 6,78 − 0,05 = □ » (moins). Un seul chiffre ajouté ou retranché. Les
  // données : n, d (signé), rang (−1 : dixièmes…), chiffre, r, et les
  // réponses fausses des erreurs connues (-1 sans objet) : ailleurs (le
  // chiffre au rang voisin), bout (écrit au bout), oubli (la retenue
  // oubliée), sens (le mauvais sens).
  const D4_CODES = Object.freeze({plus: 1, "plus-fraction": 2, moins: 3, "plus-entier": 4, "moins-entier": 5});
  function d4Calcul(niveau, forme, n, rang, chiffre) {
    const k = -rang;
    const signe = forme.startsWith("moins") ? -1 : 1;
    const d = exact(signe * chiffre / 10 ** k);
    const r = exact(n + d);
    const ecritD = forme === "plus-fraction" ? ecrireFraction(chiffre, k) : f(Math.abs(d));
    // Les rangs qui reçoivent une retenue (3,96 + 0,05 : les dixièmes, puis
    // les unités).
    const retenues = [];
    if (signe > 0 && chiffreAuRangDecimal(n, rang) + chiffre >= 10) {
      for (let haut = rang + 1; ; haut += 1) {
        retenues.push(haut);
        if (chiffreAuRangDecimal(n, haut) + 1 < 10) break;
      }
    }
    const ecritN = f(n).replace(new RegExp(ESPACE_FINE, "g"), "");
    const voisin = rangVoisin => (rangVoisin <= 2 && rangVoisin >= -3 && rangVoisin !== rang ? exact(n + signe * chiffre * 10 ** rangVoisin) : -1);
    return Object.freeze({
      // (Un entier ajouté, retranché : rangé avec « plus », « moins ».)
      texte: `${f(n)} ${signe > 0 ? "+" : "−"} ${ecritD} = ${CASE}`, reponse: r, forme: forme.replace("-entier", ""), module: "D4", niveau,
      // (Un entier ajouté, lot « couverture » : dizaines 21, centaines 22.)
      cle: `D4-${niveau}-${D4_CODES[forme]}-${cleNombre(n)}-${chiffre}-${k < 0 ? 20 - k : k}`,
      donnees: Object.freeze({
        n, d, rang, chiffre, r,
        ailleursGauche: voisin(rang + 1), ailleursDroite: voisin(rang - 1),
        bout: signe > 0 && rang < 0 && decimalesDe(n) < 3 ? Number(`${ecritN}${ecritN.includes(",") ? "" : ","}${chiffre}`.replace(",", ".")) : -1,
        oubli: retenues.length ? exact(r - 10 ** (rang + 1)) : -1,
        sens: exact(n - d) >= 0 ? exact(n - d) : -1
      }),
      ecritD, signe, retenues: Object.freeze(retenues)
    });
  }
  const d4Plus = (niveau, n, rang, chiffre) => d4Calcul(niveau, "plus", n, rang, chiffre);
  const d4Fraction = (niveau, n, rang, chiffre) => d4Calcul(niveau, "plus-fraction", n, rang, chiffre);
  const d4Moins = (niveau, n, rang, chiffre) => d4Calcul(niveau, "moins", n, rang, chiffre);

  // Le tableau de numération d'un calcul de D4 : le nombre, ce qu'on
  // ajoute (son chiffre à son rang), le résultat ; dans l'aide, les chiffres
  // qui ne changent pas en gris (`garder`), ceux qui changent « ? ».
  function d4Tableau(calcul, {inconnue = false, ligneCachee = false} = {}) {
    const {n, rang, chiffre, r} = calcul.donnees;
    const change = new Set([rang, ...calcul.retenues]);
    const rangsResultat = [...chiffresDuNombre(r).keys()];
    return {
      outil: "numeration",
      lignes: [
        Object.freeze({nombre: n, unite: 0, texte: f(n)}),
        Object.freeze(Object.assign({nombre: chiffre, unite: rang, texte: `${calcul.signe > 0 ? "+" : "−"} ${calcul.ecritD}`}, ligneCachee ? {cherche: true} : {}))
      ],
      resultat: {nombre: r, unite: 0, texte: ""},
      garder: rangsResultat.filter(x => !change.has(x)),
      retenue: calcul.retenues.slice(),
      inconnue
    };
  }
  // Les rangs des chiffres écrits d'un nombre (4,75 → 0, −1, −2).
  function chiffresDuNombre(nombre) {
    const [entiere, decimales = ""] = formaterNombre(nombre).replace(new RegExp(ESPACE_FINE, "g"), "").split(",");
    const rangs = new Map();
    [...entiere].forEach((chiffre, i) => rangs.set(entiere.length - 1 - i, chiffre));
    [...decimales].forEach((chiffre, i) => rangs.set(-1 - i, chiffre));
    return rangs;
  }
  const d4Image = calcul => d4Tableau(calcul);
  const d4Aide = calcul => d4Tableau(calcul, {inconnue: true});
  const d4Phrase = calcul => fr(`Regarde : ${sansEspace(calcul.texte).replace(CASE, f(calcul.reponse))}.`);
  // Le tableau à jetons (Je manipule, et l'entraînement après deux
  // erreurs) : le nombre de départ en jetons ; l'élève touche le bon jeton
  // de la réserve ; avec une retenue, il échange chaque paquet de 10.
  function d4Manipulation(calcul) {
    const {n, rang, chiffre, r} = calcul.donnees;
    // (Des dizaines, des centaines : pas de colonne dans le tableau à jetons.)
    if (rang > 0) return null;
    const plusBas = Math.max(2, decimalesDe(n), -rang);
    const calc = sansCase(calcul.texte);
    return Object.freeze({
      outil: "jetons", depart: n, rang, chiffre, signe: calcul.signe,
      colonnes: Object.freeze(Array.from({length: plusBas + 1}, (_, i) => -i)),
      texte: calc,
      consigne: fr(`${calcul.signe > 0 ? "Ajoute" : "Retire"} ${calcul.ecritD} : touche le bon jeton.`),
      refus: null,
      traces: Object.freeze([Object.freeze({apres: 1 + calcul.retenues.length, attente: `${calc} = …`, texte: `${calc} = ${f(r)}`})])
    });
  }
  // Du plus simple au plus dur : l'écriture, le rang (les millièmes après
  // les dixièmes), une case vide qui se remplit (4,5 + 0,03), les retenues.
  const D4_RANGS = Object.freeze({plus: 0, "plus-fraction": 1, moins: 2, "plus-entier": 0, "moins-entier": 2});
  function d4Difficulte(calcul) {
    const {n, rang} = calcul.donnees;
    return D4_RANGS[calcul.forme] * 1000 + calcul.retenues.length * 200 + (-rang) * 50 + (-rang > decimalesDe(n) ? 30 : 0) + decimalesDe(n) * 10 + Math.min(Math.trunc(n), 9);
  }
  const D4_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "le chiffre au mauvais rang",
      test: sauf((calcul, reponse) => ["ailleursGauche", "ailleursDroite"].some(cle => calcul.donnees[cle] >= 0 && memeNombre(reponse, calcul.donnees[cle]))),
      retour: (calcul, reponse) => fr(`${f(reponse)} : le ${calcul.donnees.chiffre} n’est pas dans la bonne colonne. ${calcul.ecritD}, c’est ${enRang(calcul.donnees.chiffre, -calcul.donnees.rang)}.`),
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "le chiffre écrit au bout",
      test: sauf((calcul, reponse) => calcul.donnees.bout >= 0 && memeNombre(reponse, calcul.donnees.bout)),
      retour: (calcul, reponse) => {
        const k = -calcul.donnees.rang;
        return fr(`${f(reponse)} : tu as écrit le ${calcul.donnees.chiffre} au bout. ${calcul.ecritD}, c’est ${enRang(calcul.donnees.chiffre, k)} : il va dans la colonne des ${nomRangs(k)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "la retenue oubliée",
      test: sauf((calcul, reponse) => calcul.donnees.oubli >= 0 && memeNombre(reponse, calcul.donnees.oubli)),
      retour: (calcul, reponse) => {
        const {n, rang, chiffre} = calcul.donnees;
        const k = -rang;
        const total = chiffreAuRangDecimal(n, rang) + chiffre;
        return fr(`${f(reponse)} : la retenue est oubliée. ${f(chiffreAuRangDecimal(n, rang))} + ${chiffre} = ${total} ${nomRangs(k)}, et 10 ${nomRangs(k)} font 1 ${RANGS_DECIMAUX[k - 1][0]}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 4, nom: "le mauvais sens",
      test: sauf((calcul, reponse) => calcul.donnees.sens >= 0 && memeNombre(reponse, calcul.donnees.sens)),
      retour: (calcul, reponse) => {
        const {n, chiffre, rang} = calcul.donnees;
        return calcul.signe < 0
          ? fr(`${f(reponse)}, c’est ${f(n)} + ${calcul.ecritD}. Ici, on retranche : ${enRang(chiffre, -rang)} de moins.`)
          : fr(`${f(reponse)}, c’est ${f(n)} − ${calcul.ecritD}. Ici, on ajoute : ${enRang(chiffre, -rang)} de plus.`);
      },
      gras: 0
    })
  ]);
  // Les nombres de départ : la partie entière de 0 à 9 (au plus 9 jetons
  // d'unités), le dernier chiffre non nul ; le résultat sous 10, et il
  // garde ses décimales (4,45 + 0,05 = 4,5 perdrait la colonne qui change).
  // (Vérifié en millièmes entiers avant de fabriquer le calcul : les
  // viviers sont grands.)
  const decimalesMillemes = x => (x % 1000 === 0 ? 0 : x % 100 === 0 ? 1 : x % 10 === 0 ? 2 : 3);
  function d4Garde(n, rang, chiffre, signe) {
    const nm = Math.round(n * 1000);
    const rm = nm + signe * chiffre * 10 ** (3 + rang);
    // (Ni un résultat égal au nombre ajouté : 0,04 − 0,02 = 0,02.)
    return rm < 10000 && rm > 0 && rm % 1000 !== 0 && rm !== chiffre * 10 ** (3 + rang) && decimalesMillemes(rm) === Math.max(decimalesMillemes(nm), -rang);
  }
  function d4Vivier(niveau) {
    const formes = {plus: [], "plus-fraction": [], moins: []};
    const nombres = [];
    // Des nombres à une ou deux décimales (niveaux 1 et 3), à trois (niveau 2).
    const decimalesVoulues = niveau === 2 ? [3] : [1, 2];
    decimalesVoulues.forEach(dec => {
      const base = 10 ** dec;
      for (let e = 0; e <= 9; e += 1) for (let x = 1; x < base; x += dec === 3 ? 37 : dec === 2 ? 3 : 1) {
        if (x % 10 === 0) continue;
        nombres.push(exact(e + x / base));
      }
    });
    // Une écriture par nombre, à tour de rôle (le rang et le chiffre aussi) :
    // assez de calculs, sans tout fabriquer.
    const ecritures = niveau === 3 ? ["plus", "plus-fraction"] : ["plus", "plus-fraction", "moins"];
    const rangs = niveau === 2 ? [-1, -2, -3] : [-1, -2];
    nombres.forEach((n, i) => rangs.forEach((rang, j) => {
      const forme = ecritures[(i + j) % ecritures.length];
      const signe = forme === "moins" ? -1 : 1;
      const chiffreN = chiffreAuRangDecimal(n, rang);
      const possibles = entre(1, 9).filter(chiffre => {
        if (forme === "moins" && !(chiffreN > chiffre)) return false;
        if (forme !== "moins" && (chiffreN + chiffre >= 10) !== (niveau === 3)) return false;
        return d4Garde(n, rang, chiffre, signe);
      });
      if (!possibles.length) return;
      formes[forme].push(d4Calcul(niveau, forme, n, rang, possibles[(i * 7 + j * 3) % possibles.length]));
    }));
    // Lot « couverture » (relecture Codex du 06/11) : ajouter ou retrancher
    // un entier à un décimal, 4,45 + 1 ; 4,45 + 10 (CM1) ; 106,78 − 100
    // (CM2). Le chiffre des unités (dizaines, centaines) seul change.
    if (niveau !== 3) {
      // (Niveau 1 : des nombres à deux décimales ; niveau 2, aux millièmes.)
      const entiers = {"plus-entier": [], "moins-entier": []};
      // (Les centaines dès le CM1, 4,45 + 300 : attendu de CM1, relecture Codex.)
      const rangsEntiers = [0, 1, 2];
      const base = niveau === 1 ? 100 : 1000;
      for (let e = 1; e <= 8; e += 1) for (let x = 3; x < base; x += niveau === 1 ? 7 : 67) {
        if (x % 10 === 0) continue;
        rangsEntiers.forEach(rang => {
          const u = 10 ** rang;
          const n = exact(e + x / base);
          const c = 1 + (e + x) % (rang === 0 ? 9 - e : 9);
          if (rang === 0 ? e + c <= 9 : true) entiers["plus-entier"].push(d4Calcul(niveau, "plus-entier", n, rang, c));
          // (Le chiffre qui change reste écrit : 34,45 − 20 = 14,45, jamais
          // 24,45 − 20 = 4,45, où le tableau donnerait la réponse.)
          const k = 1 + (e % 3);
          const grand = rang === 0 ? n : exact(n + (c + k) * u);
          if (rang === 0 ? e > c : c + k <= 9) entiers["moins-entier"].push(d4Calcul(niveau, "moins-entier", grand, rang, c));
        });
      }
      Object.assign(formes, entiers);
    }
    if (niveau === 3) {
      // Lot « couverture » : des millièmes avec retenue (0,457 + 7/1 000,
      // exemple officiel de CM2).
      entre(0, 4).forEach(e => [415, 457, 326, 238, 149, 563].forEach(x => entre(1, 9).forEach(chiffre => {
        const n = exact(e + x / 1000);
        if ((x % 10) + chiffre < 10 || (e + chiffre) % 3) return;
        if (d4Garde(n, -3, chiffre, 1)) formes[(x + chiffre) % 2 ? "plus" : "plus-fraction"].push(d4Calcul(3, (x + chiffre) % 2 ? "plus" : "plus-fraction", n, -3, chiffre));
      })));
      // Des retenues qui se propagent (3,96 + 0,05), en plus.
      entre(0, 8).forEach(e => entre(1, 9).forEach(u => entre(1, 9).forEach(chiffre => {
        if (u + chiffre < 10 || (e + u) % 3) return;
        const n = exact(e + 0.9 + u / 100);
        const forme = (e + u + chiffre) % 2 ? "plus" : "plus-fraction";
        if (d4Garde(n, -2, chiffre, 1)) formes[forme].push(d4Calcul(3, forme, n, -2, chiffre));
      })));
      return Object.freeze({plus: Object.freeze(formes.plus), "plus-fraction": Object.freeze(formes["plus-fraction"])});
    }
    return Object.freeze(Object.fromEntries(Object.entries(formes).map(([forme, liste]) => [forme, Object.freeze(liste)])));
  }
  const D4_VIVIERS = Object.freeze({1: d4Vivier(1), 2: d4Vivier(2), 3: d4Vivier(3)});

  // J'apprends de D4 : les jetons sur le premier calcul, le tableau sur le
  // deuxième, le tableau qui se remplit sur le troisième. `morceaux` : ce
  // que chaque étape écrit ({rangs} du résultat, {lignes} : la fraction
  // écrite en décimal, « 3/100 = 0,03 »).
  function d4Apprends({manipule, represente, ecris, consigne, consigneEcris, etapes, morceaux, bilan}) {
    const m = d4Manipulation(manipule);
    const ligneCachee = morceaux.some(morceau => morceau.lignes);
    return Object.freeze({
      exemple: exempleDe(manipule),
      manipule: m,
      represente: Object.freeze({
        outil: "numeration", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(d4Aide(represente)),
        solution: Object.freeze({image: Object.freeze(d4Image(represente)), phrase: d4Phrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        consigne: fr(consigneEcris),
        etapes: etapesEcris(etapes), reponse: ecris.reponse,
        solution: Object.freeze({image: Object.freeze(d4Image(ecris)), phrase: d4Phrase(ecris)})
      }, numerationDessins(d4Tableau(ecris, {inconnue: true, ligneCachee}), morceaux)),
      bilan: frBilan(bilan),
      image: Object.freeze(d4Image(manipule || represente)),  // lot 3a : le calcul montré
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: manipule, ecris: ecris}),
      textes: Object.freeze([manipule.texte, represente.texte, ecris.texte])
    });
  }

  const D4 = {
    id: "D4", nom: "Ajouter ou retrancher des unités d’un rang", exemple: "4,45 + 0,3",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "numeration",
    erreurs: D4_ERREURS, image: d4Image, aide: d4Aide, phrase: d4Phrase, manipulation: d4Manipulation, difficulte: d4Difficulte,
    niveaux: [
      {
        n: 1, titre: "sans retenue", nom: "Un rang qui change : dixièmes, centièmes", palier: 2, type: "P",
        composer: vivierNiveau(D4_VIVIERS[1], [4, 2, 2, 1, 1]),
        imposes: [d4Plus(1, 5.24, -1, 5), d4Moins(1, 7.86, -2, 4)],
        apprends: d4Apprends({
          manipule: d4Plus(0, 4.45, -1, 3),
          represente: d4Fraction(0, 0.45, -2, 3),
          ecris: d4Plus(0, 6.24, -1, 5),
          consigne: "3/100, c’est 3 centièmes.",
          consigneEcris: "6,24 + 0,5 = 6,04 + 0,2 + 0,5",
          etapes: [["0,2 + 0,5 = ?", 0.7], ["6,24 + 0,5 = ?", 6.74]],
          morceaux: [{rangs: [-1]}, {rangs: [0, -1, -2]}],
          // Lot 7e : le niveau ajoute ou retire aussi des unités, des centièmes.
          bilan: "Sans retenue, seul le chiffre du rang ajouté (ou retiré) change : 4,45 + 0,3 = 4,75."
        })
      },
      {
        n: 2, titre: "millièmes, sans retenue", nom: "Un rang qui change : millièmes", palier: 3, type: "P",
        composer: vivierNiveau(D4_VIVIERS[2], [4, 2, 2, 1, 1]),
        imposes: [d4Fraction(2, 2.315, -3, 4), d4Moins(2, 8.476, -1, 2)],
        apprends: d4Apprends({
          manipule: d4Plus(0, 2.435, -3, 4),
          represente: d4Moins(0, 7.152, -2, 3),
          // (Lot 3b : J'écris ajoute un décimal, comme la leçon ; la fraction
          // ajoutée est annoncée à l'entraînement.)
          ecris: d4Plus(0, 1.624, -3, 5),
          consigne: "0,03, c’est 3 centièmes.",
          consigneEcris: "1,624 + 0,005 = 1,62 + 0,004 + 0,005",
          etapes: [["0,004 + 0,005 = ?", 0.009], ["1,624 + 0,005 = ?", 1.629]],
          morceaux: [{rangs: [-3]}, {rangs: [0, -1, -2, -3]}],
          bilan: "Sans retenue, seul le chiffre du rang ajouté (ou retiré) change : 2,435 + 0,004 = 2,439."
        })
      },
      {
        n: 3, titre: "avec retenue (ajouter)", nom: "Ajouter avec une retenue", palier: 3, type: "P",
        composer: vivierNiveau(D4_VIVIERS[3], [6, 4]),
        imposes: [d4Plus(3, 2.58, -1, 7), d4Fraction(3, 6.97, -2, 5)],
        apprends: d4Apprends({
          manipule: d4Plus(0, 4.45, -1, 8),
          represente: d4Plus(0, 3.96, -2, 5),
          ecris: d4Plus(0, 5.73, -1, 6),
          consigne: "10 dixièmes font 1 unité.",
          consigneEcris: "5,73 + 0,6 = 5,03 + 0,7 + 0,6",
          etapes: [["0,7 + 0,6 = ?", 1.3], ["5,73 + 0,6 = ?", 6.33]],
          morceaux: [{rangs: [-1]}, {rangs: [0, -1, -2]}],
          bilan: "10 dixièmes font 1 unité, 10 centièmes font 1 dixième : 4,45 + 0,8 = 5,25."
        })
      }
    ]
  };

  // ============================================ lot 7a (14/11/2026)
  //
  // D5 « Compléments à l'unité », D6 « Additionner deux décimaux », D7
  // « Soustraire deux décimaux » : la méthode de la fiche de Gwenaël
  // (« J'additionne avec les grilles », JE RETIENS : les unités avec les
  // unités, les dixièmes avec les dixièmes, les centièmes avec les
  // centièmes ; je fais des échanges si nécessaire) et du calcul mental
  // officiel (8,6 + 7,8 = 15 + 1,4). Les carrés de 100 (décision du 04/11 :
  // les grilles reviennent dans D5 et D6 ; D7, l'inverse, suit le même
  // chemin) dessinent la partie décimale seule : un ou deux carrés.
  //  - D5 : n + □ = l'entier suivant ; on colorie ce qui manque.
  //  - D6 : a + b ; les unités, puis les parties décimales sur les carrés
  //    (ce qu'on ajoute est hachuré, dans le 2e carré si ça dépasse 1).
  //  - D7 : a − b ; les unités, puis les parties décimales ; quand il en
  //    manque, on « casse » une unité (elle devient le 1er carré) ; ce
  //    qu'on enlève est barré.
  // Échelles (relecture Codex du 14/11) : D6 et D7 n'ont jamais un nombre
  // à un seul chiffre non nul ajouté ou retiré sans échange (c'est D4) ;
  // un niveau n'a jamais un calcul d'un autre.
  // Les cases d'un nombre (ses centièmes après la virgule) : 3,47 → 47.
  const casesDe = x => Math.round((x - Math.floor(x + 1e-9)) * 100);
  // Les chiffres non nuls d'un nombre (4,05 → 2 ; 0,3 → 1).
  const chiffresNonNuls = x => [...formaterNombre(x).replace(/\D/g, "")].filter(c => c !== "0").length;

  // ------------------------------------------------- D5 : compléments à l'unité
  //
  // « 2,6 + □ = 3 » : les données n, e (sa partie entière), x (ses cases),
  // cible, r, et les réponses fausses connues : chiffres (chaque chiffre
  // complété à 10 : 0,35 → 0,75), entier (la réponse sans virgule : 4,
  // 65), a10 (complété à 10 au lieu de 1 : 9,4 pour 0,6).
  function d5Calcul(niveau, n) {
    const e = Math.floor(n + 1e-9);
    const x = casesDe(n);
    const cible = e + 1;
    const r = exact(cible - n);
    const d = x % 10;
    const t = Math.floor(x / 10);
    const chiffres = d && t ? exact((10 - t) / 10 + (10 - d) / 100) : -1;
    const dec = decimalesDe(n);
    return fabriquer("D5", niveau, "complement", [n, "+", TROU, "=", cible], r, {
      n, e, x, cible, r, chiffres: chiffres > 0 && !memeNombre(chiffres, r) ? chiffres : -1,
      entier: Math.round(r * 10 ** dec), a10: e === 0 ? exact(10 - n) : -1
    });
  }
  const D5_SORTES = Object.freeze([["à 1", (c, d) => d.e === 0], ["à l’entier suivant", () => true]]);
  function d5Vivier(niveau) {
    const liste = [];
    for (let e = 0; e <= 9; e += 1) {
      for (let x = 1; x < 100; x += 1) {
        if (niveau === 1 ? x % 10 !== 0 : x % 10 === 0) continue;
        liste.push(d5Calcul(niveau, exact(e + x / 100)));
      }
    }
    return Object.freeze({
      "a-un": Object.freeze(liste.filter(c => c.donnees.e === 0)),
      suivant: Object.freeze(liste.filter(c => c.donnees.e > 0))
    });
  }
  const D5_VIVIERS = Object.freeze({1: d5Vivier(1), 2: d5Vivier(2)});
  // (Les deux sortes se tirent à tour de rôle ; la forme reste « complement ».)
  function d5Composer(niveau, parts) {
    const viviers = D5_VIVIERS[niveau];
    return function composer(rng, total, imposes) {
      const nombres = repartir(total, parts);
      const pris = new Set(imposes.map(c => c.cle));
      const tires = ["a-un", "suivant"].flatMap((nom, i) => {
        const deja = imposes.filter(c => (c.donnees.e === 0) === (nom === "a-un")).length;
        return melanger(rng, viviers[nom]).filter(c => !pris.has(c.cle)).slice(0, Math.max(0, nombres[i] - deja));
      });
      return [...tires, ...imposes];
    };
  }
  const d5Image = calcul => ({outil: "carre-op", op: "completer", carres: 1, bleu: calcul.donnees.x, autre: 100 - calcul.donnees.x});
  const d5Aide = calcul => Object.assign(d5Image(calcul), {cache: true});
  const d5Phrase = calcul => fr(`Regarde : ${sansEspace(calcul.texte).replace(CASE, f(calcul.reponse))}.`);
  function d5Manipulation(calcul) {
    const {e, x} = calcul.donnees;
    const centiemes = x % 10;
    const consigne = centiemes
      ? "Finis la bande, puis colorie les bandes qui manquent."
      : "Colorie ce qui manque pour faire une unité.";
    const calc = sansCase(calcul.texte).replace(CASE, "?");
    return Object.freeze({
      outil: "carre-op", op: "completer", carres: 1, bleu: x, autre: 100 - x,
      texte: calc, consigne: fr(e ? `${enRang(e, 0)} ${e > 1 ? "sont déjà là" : "est déjà là"}. ${consigne}` : consigne), refus: null,
      traces: Object.freeze([Object.freeze({apres: 0, attente: `${calc} = …`, texte: calcul.texte.replace(CASE, f(calcul.reponse))})])
    });
  }
  function d5Difficulte(calcul) {
    const {e, x} = calcul.donnees;
    return (e ? 1000 : 0) + (x % 10 ? 300 : 0) + Math.abs(50 - x) + e;
  }
  const D5_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "chaque chiffre complété à 10",
      test: sauf((calcul, reponse) => calcul.donnees.chiffres >= 0 && memeNombre(reponse, calcul.donnees.chiffres)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : tu as complété chaque chiffre à 10. ${f(calcul.donnees.n)} + ${f(reponse)} ne fait pas ${f(calcul.donnees.cible)} : finis d’abord la bande, puis les bandes.`)
    }),
    Object.freeze({
      c: 2, nom: "la virgule oubliée",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.entier)),
      retour: (calcul, reponse) => fr(`${f(reponse)}, c’est beaucoup trop : il manque moins d’une unité. Où est la virgule ?`)
    }),
    Object.freeze({
      c: 3, nom: "complété jusqu’à 10",
      test: sauf((calcul, reponse) => calcul.donnees.a10 >= 0 && memeNombre(reponse, calcul.donnees.a10)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : tu es allé jusqu’à 10. Ici, on va jusqu’à ${f(calcul.donnees.cible)}.`)
    })
  ]);
  // Le dessin de J'écris : le calcul dessiné (ce qu'on ajoute, ce qu'on
  // enlève) ; un complément (D5) : ce qui manque reste blanc, puis se
  // hachure à la dernière étape.
  //   progression : les cases hachurées (ou barrées) après chaque étape
  //   (lot « relier » : ce que l'élève écrit se voit dans le dessin).
  function carreOpDessins(image, progression) {
    const etapes = progression.length;
    const morceaux = Array.from({length: etapes}, (_, i) => ({etape: i}));
    return dessinsDe(morceaux, etapes, (vus, revele = false) => {
      const autre = revele ? image.autre : vus.length ? progression[vus.length - 1] : 0;
      return Object.freeze(Object.assign({}, image, {autre, cache: !autre}));
    });
  }
  // J'écris de D5 (lot 3c : la même recette pour la leçon et les calculs
  // tirés). Dixièmes : « 0,4 + □ = 1 », puis « 5,4 + □ = 6 ». Centièmes :
  // je finis la bande (« 4,26 + □ = 4,3 »), je complète les bandes
  // (« 4,3 + □ = 5 »), puis le tout. null : la recette ne s'applique pas.
  function d5Ecris(calcul) {
    const {n, e, x, cible, r} = calcul.donnees;
    if (!e) return null;
    let consigne = calcul.texte.replace(CASE, "?");
    let etapes;
    if (x % 10) {
      const bande = exact(e + Math.ceil(x / 10) / 10);
      if (bande >= cible) return null;
      etapes = [[`${f(n)} + ? = ${f(bande)}`, exact(bande - n)], [`${f(bande)} + ? = ${f(cible)}`, exact(cible - bande)], [`${f(n)} + ? = ${f(cible)}`, r]];
    } else {
      etapes = [[`${f(exact(n - e))} + ? = 1`, r], [`${f(n)} + ? = ${f(cible)}`, r]];
    }
    return ecrisAvecDessins({
      consigne: fr(consigne),
      etapes: etapesEcris(etapes), reponse: r,
      solution: Object.freeze({image: Object.freeze(d5Image(calcul)), phrase: d5Phrase(calcul)})
    }, carreOpDessins(d5Image(calcul), x % 10 ? [(10 - x % 10), 100 - x, 100 - x] : [100 - x, 100 - x]));
  }
  function d5Apprends({manipule, represente, ecris, consigne, bilan}) {
    const m = d5Manipulation(manipule);
    return Object.freeze({
      exemple: exempleDe(manipule),
      manipule: m,
      represente: Object.freeze({
        outil: "carre-op", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(d5Aide(represente)),
        solution: Object.freeze({image: Object.freeze(d5Image(represente)), phrase: d5Phrase(represente)})
      }),
      ecris: d5Ecris(ecris),
      bilan: frBilan(bilan),
      image: Object.freeze(d5Image(manipule)),
      calculs: Object.freeze({montre: manipule, ecris}),
      textes: Object.freeze([manipule.texte, represente.texte, ecris.texte])
    });
  }

  const D5 = {
    id: "D5", nom: "Compléments à l’unité", exemple: "0,7 + ? = 1",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "carre-op",
    erreurs: D5_ERREURS, image: d5Image, aide: d5Aide, phrase: d5Phrase, manipulation: d5Manipulation, difficulte: d5Difficulte,
    niveaux: [
      {
        n: 1, titre: "dixièmes, à l’entier suivant", nom: "Compléter à l’unité\u00a0: dixièmes", palier: 3, type: "P",
        composer: d5Composer(1, [4, 6]),
        imposes: [d5Calcul(1, 0.3), d5Calcul(1, 4.7)],
        apprends: d5Apprends({
          manipule: d5Calcul(0, 2.6),
          represente: d5Calcul(0, 1.8),
          ecris: d5Calcul(0, 5.4),
          consigne: "Ce qui reste blanc, c’est ce qui manque.",
          bilan: "Il manque 4 dixièmes pour faire une unité : 0,6 + 0,4 = 1. 2,6 + 0,4 = 3."
        })
      },
      {
        n: 2, titre: "centièmes", nom: "Compléter à l’unité\u00a0: centièmes", palier: 4, type: "P",
        composer: d5Composer(2, [4, 6]),
        imposes: [d5Calcul(2, 0.42), d5Calcul(2, 6.18)],
        apprends: d5Apprends({
          manipule: d5Calcul(0, 2.35),
          represente: d5Calcul(0, 3.72),
          ecris: d5Calcul(0, 4.26),
          consigne: "Ce qui reste blanc, c’est ce qui manque.",
          bilan: "Je finis la bande, puis je complète les bandes : 2,35 + 0,05 = 2,4. 2,4 + 0,6 = 3. 2,35 + 0,65 = 3."
        })
      }
    ]
  };

  // ------------------------------------------- D6, D7 : deux décimaux, + et −
  //
  // « 2,7 + 3,7 = □ », « 3,4 − 0,8 = □ ». Les données : a, b, r, ea, eb
  // (les parties entières), xa, xb (les cases), casse (D7 : une unité
  // cassée), u (les unités : 2 + 3 ; 15 − 1 − 2), dec (la partie décimale
  // du résultat : 1,4 ; 0,6), et les réponses fausses connues : sansEchange
  // (0,7 + 0,7 = 0,14 : 5,14), oubli (l'échange oublié : 5,4 ; 3,6 — la
  // retenue de D7 : 2,4 → « 3,4 − 0,8 = 3,6 »), droite (les chiffres
  // alignés à droite : 2,57 + 5,8 → 2,65), inverse (D7 : le petit chiffre
  // retiré du grand : 3,4 − 0,8 = 3,4).
  function deuxDecimaux(module, niveau, a, b) {
    const plus = module === "D6";
    const ea = Math.floor(a + 1e-9);
    const eb = Math.floor(b + 1e-9);
    const xa = casesDe(a);
    const xb = casesDe(b);
    const r = exact(plus ? a + b : a - b);
    const casse = !plus && xb > xa;
    const u = plus ? ea + eb : ea - (casse ? 1 : 0) - eb;
    const dec = exact(plus ? (xa + xb) / 100 : ((casse ? 100 : 0) + xa - xb) / 100);
    const da = decimalesDe(a);
    const db = decimalesDe(b);
    let sansEchange = -1;
    let oubli = -1;
    let droite = -1;
    let inverse = -1;
    if (plus) {
      if (xa + xb >= 100 && da === 1 && db === 1) sansEchange = Number(`${ea + eb}.${(xa + xb) / 10}`);
      if (xa + xb >= 100) oubli = exact(r - 1);
      if (da !== db) {
        const court = da < db ? a : b;
        const long = da < db ? b : a;
        droite = exact(Math.floor(long) + Math.floor(court) + casesDe(long) / 100 + casesDe(court) / 1000);
        if (memeNombre(droite, r)) droite = -1;
      }
    } else {
      // (6,48 − 4,6 → 2,42 : 48 − 6, les chiffres alignés à droite.)
      if (da === 2 && db === 1 && xa - xb / 10 >= 0) {
        droite = exact(ea - eb + (xa - xb / 10) / 100);
        if (memeNombre(droite, r)) droite = -1;
      }
      if (casse) {
        oubli = exact(r + 1);
        // Le petit chiffre retiré du grand, rang par rang (3,4 − 0,8 → 3,4).
        const ca = [ea, Math.floor(xa / 10), xa % 10];
        const cb = [eb, Math.floor(xb / 10), xb % 10];
        const v = ca.map((c, i) => Math.abs(c - cb[i]));
        inverse = exact(v[0] + v[1] / 10 + v[2] / 100);
        if (memeNombre(inverse, r) || memeNombre(inverse, oubli)) inverse = -1;
      }
    }
    const signe = plus ? "+" : "−";
    return fabriquer(module, niveau, plus ? "somme" : "difference", [a, signe, b, "=", TROU], r, {
      a, b, r, ea, eb, xa, xb, casse, u, dec, sansEchange, oubli, droite, inverse
    });
  }
  const d6Somme = (niveau, a, b) => deuxDecimaux("D6", niveau, a, b);
  const d7Difference = (niveau, a, b) => deuxDecimaux("D7", niveau, a, b);

  function deuxImage(calcul) {
    const {xa, xb, casse} = calcul.donnees;
    if (calcul.module === "D6") return {outil: "carre-op", op: "ajouter", carres: 2, bleu: xa, autre: xb};
    // D7 : une unité cassée devient le 1er carré (plein) ; 9 − 1,9 : un seul carré.
    return {outil: "carre-op", op: "enlever", carres: casse && xa ? 2 : 1, bleu: (casse ? 100 : 0) + xa, autre: xb};
  }
  const deuxAide = calcul => deuxImage(calcul);
  const deuxPhrase = calcul => fr(`Regarde : ${sansEspace(calcul.texte).replace(CASE, f(calcul.reponse))}.`);
  // « 2,7 + 3,7 = 5 + 1,4 = 6,4 » ; « 3,4 − 0,8 = 2 + 0,6 = 2,6 ».
  const deuxTrace = calcul => {
    const {a, b, u, dec, r} = calcul.donnees;
    const signe = calcul.module === "D6" ? "+" : "−";
    return u ? `${f(a)} ${signe} ${f(b)} = ${f(u)} + ${f(dec)} = ${f(r)}` : `${f(a)} ${signe} ${f(b)} = ${f(r)}`;
  };
  function deuxManipulation(calcul) {
    const {a, b, ea, eb, xa, xb, casse, u} = calcul.donnees;
    const image = deuxImage(calcul);
    const enCases = x => (x % 10 ? f(x / 100) : f(x / 100));
    let consigne;
    if (calcul.module === "D6") {
      consigne = `${ea + eb ? `Les unités : ${f(ea)} + ${f(eb)} = ${f(ea + eb)}. ` : ""}Ajoute ${enCases(xb)} : touche les carrés.`;
    } else if (casse) {
      const debut = xa ? `${f(a)}, c’est ${f(ea - 1)} + ${f(1 + xa / 100)}` : `${f(a)}, c’est ${f(ea - 1)} + 1`;
      consigne = `${debut}. ${eb ? `Les unités : ${f(ea - 1)} − ${f(eb)} = ${f(u)}. ` : ""}Enlève ${enCases(xb)} : touche les carrés.`;
    } else {
      consigne = `${eb ? `Les unités : ${f(ea)} − ${f(eb)} = ${f(u)}. ` : ""}Enlève ${enCases(xb)} : touche les carrés.`;
    }
    const calc = sansCase(calcul.texte);
    return Object.freeze(Object.assign(image, {
      dixiemes: Math.floor(xb / 10), centiemes: xb % 10,
      texte: calc, consigne: fr(consigne), refus: null,
      traces: Object.freeze([Object.freeze({apres: 0, attente: `${calc} = …`, texte: deuxTrace(calcul)})])
    }));
  }
  function deuxDifficulte(calcul) {
    const {a, b, xa, xb, casse} = calcul.donnees;
    const echange = calcul.module === "D6" ? xa + xb >= 100 : casse;
    return (echange ? 1000 : 0) + (decimalesDe(a) + decimalesDe(b)) * 100 + Math.min(99, Math.floor(a + b));
  }
  // Les erreurs connues : D6 (1, 2, 3) et D7 (1, 2, 3), chacune les siennes.
  const ERREUR_ALIGNE = c => Object.freeze({
    c, nom: "les chiffres alignés à droite",
    test: sauf((calcul, reponse) => calcul.donnees.droite >= 0 && memeNombre(reponse, calcul.donnees.droite)),
    retour: (calcul, reponse) => fr(`${f(reponse)} : les chiffres ne sont pas dans la bonne colonne. Les dixièmes avec les dixièmes, les centièmes avec les centièmes.`)
  });
  const D6_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "les dixièmes écrits sans échange",
      test: sauf((calcul, reponse) => calcul.donnees.sansEchange >= 0 && memeNombre(reponse, calcul.donnees.sansEchange)),
      retour: (calcul, reponse) => {
        const {xa, xb} = calcul.donnees;
        return fr(`${f(reponse)} : ${xa / 10} dixièmes + ${xb / 10} dixièmes = ${(xa + xb) / 10} dixièmes, et 10 dixièmes font 1 unité.`);
      }
    }),
    Object.freeze({
      c: 2, nom: "l’échange oublié",
      test: sauf((calcul, reponse) => calcul.donnees.oubli >= 0 && memeNombre(reponse, calcul.donnees.oubli)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : l’unité de l’échange est oubliée. ${f(calcul.donnees.dec)}, c’est 1 unité et ${f(exact(calcul.donnees.dec - 1))}.`)
    }),
    ERREUR_ALIGNE(3)
  ]);
  const D7_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "l’unité cassée oubliée",
      test: sauf((calcul, reponse) => calcul.donnees.oubli >= 0 && memeNombre(reponse, calcul.donnees.oubli)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : l’unité cassée est oubliée. Elle n’est plus dans les unités.`)
    }),
    Object.freeze({
      c: 2, nom: "le petit chiffre retiré du grand",
      test: sauf((calcul, reponse) => calcul.donnees.inverse >= 0 && memeNombre(reponse, calcul.donnees.inverse)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : tu as retiré le petit chiffre du grand. Quand il n’y a pas assez, je casse une unité.`)
    }),
    ERREUR_ALIGNE(3)
  ]);

  // Les viviers. D6-1 : sans échange ; D6-2 : avec échange, un chiffre
  // après la virgule ; D6-3 : un nombre aux centièmes, l'autre aux dixièmes.
  // Chaque nombre a au moins deux chiffres non nuls (sinon c'est D4).
  function d6Vivier(niveau) {
    const liste = [];
    const nombres1 = [];
    for (let e = 0; e <= 9; e += 1) for (let x = 10; x < 100; x += 10) nombres1.push(exact(e + x / 100));
    const nombres2 = [];
    for (let e = 0; e <= 9; e += 1) for (let x = 1; x < 100; x += 1) if (x % 10) nombres2.push(exact(e + x / 100));
    const deux = x => chiffresNonNuls(x) >= 2;
    if (niveau <= 2) {
      nombres1.filter(deux).forEach(a => nombres1.filter(deux).forEach(b => {
        const echange = casesDe(a) + casesDe(b) >= 100;
        if (echange !== (niveau === 2)) return;
        liste.push(d6Somme(niveau, a, b));
      }));
    } else {
      nombres2.filter(deux).forEach((a, i) => nombres1.filter(deux).forEach((b, j) => {
        if ((i * 7 + j * 3) % 13) return;
        liste.push((i + j) % 2 ? d6Somme(3, a, b) : d6Somme(3, b, a));
      }));
    }
    return Object.freeze(liste);
  }
  const D6_SORTES = {
    1: [["somme sous 10", (c, d) => d.r < 10], ["somme au-delà de 10", () => true]],
    2: [["résultat entier", (c, d) => Number.isInteger(d.r)], ["résultat sous 10", (c, d) => d.r < 10], ["au-delà de 10", () => true]],
    3: [["sans échange", (c, d) => d.xa + d.xb < 100], ["avec échange", () => true]]
  };
  // D7-1 : sans échange ; D7-2 : avec échange, un chiffre après la virgule
  // (3,4 − 0,8 ; 15,3 − 2,4 ; 9 − 1,9) ; D7-3 : un nombre aux centièmes.
  function d7Vivier(niveau) {
    const liste = [];
    const deux = x => chiffresNonNuls(x) >= 2;
    const dixiemes = [];
    for (let e = 0; e <= 19; e += 1) for (let x = 0; x < 100; x += 10) dixiemes.push(exact(e + x / 100));
    const centiemes = [];
    for (let e = 0; e <= 9; e += 1) for (let x = 0; x < 100; x += 1) centiemes.push(exact(e + x / 100));
    if (niveau === 1) {
      dixiemes.filter(a => a < 20 && casesDe(a)).forEach(a => dixiemes.filter(b => b < 10 && deux(b)).forEach(b => {
        if (!(casesDe(b) < casesDe(a)) || b >= a || Math.floor(b) > Math.floor(a)) return;
        liste.push(d7Difference(1, a, b));
      }));
    } else if (niveau === 2) {
      dixiemes.forEach(a => dixiemes.filter(b => b < 10 && casesDe(b)).forEach(b => {
        if (!(casesDe(b) > casesDe(a)) || b >= a) return;
        // (Dixièmes seuls : a sous 10 ; d'un entier : a jusqu'à 10.)
        if (Math.floor(b) === 0 && a >= 10) return;
        if (!casesDe(a) && a > 10) return;
        if (Math.floor(b) > 0 && !deux(b)) return;
        liste.push(d7Difference(2, a, b));
      }));
    } else {
      const avecCentiemes = x => casesDe(x) % 10 !== 0;
      centiemes.forEach((a, i) => centiemes.forEach((b, j) => {
        // (« Chiffres après la virgule différents » : 6,48 − 4,6 ; 5 − 2,35.)
        if (!(avecCentiemes(a) || avecCentiemes(b)) || decimalesDe(a) === decimalesDe(b) || b >= a || (i * 5 + j * 3) % 7) return;
        if (!casesDe(b) || (!deux(b) && casesDe(b) <= casesDe(a))) return;
        liste.push(d7Difference(3, a, b));
      }));
    }
    return Object.freeze(liste);
  }
  const D7_SORTES = {
    1: [["moins de 10", (c, d) => d.a < 10], ["au-delà de 10", () => true]],
    2: [["dixièmes seuls", (c, d) => d.eb === 0 && d.xa > 0], ["unités et dixièmes", (c, d) => d.xa > 0], ["d’un entier", () => true]],
    3: [["sans casser d’unité", (c, d) => !d.casse], ["on casse une unité", (c, d) => d.eb === 0 && d.xa > 0], ["unités et centièmes", (c, d) => d.xa > 0], ["d’un entier", () => true]]
  };
  // Tire à tour de rôle dans chaque sorte du niveau.
  function parSortes(liste, sortes) {
    const paquets = sortes.map(() => []);
    liste.forEach(calcul => {
      const i = sortes.findIndex(([, test]) => test(calcul, calcul.donnees));
      paquets[i < 0 ? sortes.length - 1 : i].push(calcul);
    });
    return paquets;
  }
  function deuxComposer(liste, sortes, parts) {
    const paquets = parSortes(liste, sortes);
    return function composer(rng, total, imposes) {
      const nombres = repartir(total, parts);
      const pris = new Set(imposes.map(c => c.cle));
      const tires = paquets.flatMap((paquet, i) => {
        const deja = imposes.filter(c => Math.max(0, sortes.findIndex(([, t]) => t(c, c.donnees))) === i).length;
        return melanger(rng, paquet).filter(c => !pris.has(c.cle)).slice(0, Math.max(0, nombres[i] - deja));
      });
      return [...tires, ...imposes];
    };
  }
  const D6_LISTES = Object.freeze({1: d6Vivier(1), 2: d6Vivier(2), 3: d6Vivier(3)});
  const D7_LISTES = Object.freeze({1: d7Vivier(1), 2: d7Vivier(2), 3: d7Vivier(3)});

  // J'apprends de D6 et D7 : les carrés à toucher sur le premier calcul,
  // les carrés dessinés sur le deuxième, J'écris sur le troisième.
  // J'écris de D6 et D7 (la même recette pour la leçon et les calculs
  // tirés) : les unités, la partie décimale, puis le tout
  // (« 3,6 + 2,2 = 3 + 2 + 0,6 + 0,2 ») ; une unité cassée (D7) : « 7,2 =
  // 6 + 1,2 », puis « 1,2 − 0,9 », puis le tout.
  function deuxEcris(calcul) {
    const {a, b, r, ea, eb, xa, xb, casse, dec} = calcul.donnees;
    const plus = calcul.module === "D6";
    const da = exact(xa / 100);
    const db = exact(xb / 100);
    let consigne;
    let etapes;
    if (casse) {
      if (eb || !ea || !xa) return null;
      const grand = exact(1 + da);
      consigne = `${f(a)} − ${f(b)} = ${f(ea - 1)} + ${f(grand)} − ${f(b)}`;
      etapes = [[`${f(grand)} − ${f(b)} = ?`, dec], [`${f(a)} − ${f(b)} = ?`, r]];
    } else {
      // (1,6 − 1,5 : « 1 − 1 = 0 » n'apprend rien ; le calcul n'est pas pris.)
      if (!ea || !eb || !xa || !xb || (!plus && ea === eb)) return null;
      const op = plus ? "+" : "−";
      consigne = `${f(a)} ${op} ${f(b)} = ${f(ea)} ${op} ${f(eb)} + ${f(da)} ${op} ${f(db)}`;
      etapes = [[`${f(ea)} ${op} ${f(eb)} = ?`, plus ? ea + eb : ea - eb], [`${f(da)} ${op} ${f(db)} = ?`, dec], [`${f(a)} ${op} ${f(b)} = ?`, r]];
    }
    return ecrisAvecDessins({
      consigne: fr(consigne),
      etapes: etapesEcris(etapes), reponse: r,
      solution: Object.freeze({image: Object.freeze(deuxImage(calcul)), phrase: deuxPhrase(calcul)})
    }, carreOpDessins(deuxImage(calcul), casse ? [xb, xb] : [0, xb, xb]));
  }
  function deuxApprends({manipule, represente, ecris, consigne, bilan}) {
    return Object.freeze({
      exemple: exempleDe(manipule),
      manipule: deuxManipulation(manipule),
      represente: Object.freeze({
        outil: "carre-op", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(deuxAide(represente)),
        solution: Object.freeze({image: Object.freeze(deuxImage(represente)), phrase: deuxPhrase(represente)})
      }),
      ecris: deuxEcris(ecris),
      bilan: frBilan(bilan),
      image: Object.freeze(deuxImage(manipule)),
      calculs: Object.freeze({montre: manipule, ecris}),
      textes: Object.freeze([manipule.texte, represente.texte, ecris.texte])
    });
  }

  const D6 = {
    id: "D6", nom: "Additionner deux décimaux", exemple: "4,5 + 1,2",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "carre-op",
    erreurs: D6_ERREURS, image: deuxImage, aide: deuxAide, phrase: deuxPhrase, manipulation: deuxManipulation, difficulte: deuxDifficulte,
    niveaux: [
      {
        n: 1, titre: "sans retenue", nom: "Additionner sans échange", palier: 3, type: "P",
        composer: deuxComposer(D6_LISTES[1], D6_SORTES[1], [6, 4]),
        imposes: [d6Somme(1, 3.2, 4.5), d6Somme(1, 7.4, 6.3)],
        apprends: deuxApprends({
          manipule: d6Somme(0, 4.5, 1.2),
          represente: d6Somme(0, 2.3, 3.4),
          ecris: d6Somme(0, 3.6, 2.2),
          consigne: "Les dixièmes avec les dixièmes.",
          bilan: "Les unités avec les unités, les dixièmes avec les dixièmes : 4 + 1 = 5. 0,5 + 0,2 = 0,7. 4,5 + 1,2 = 5,7."
        })
      },
      {
        n: 2, titre: "avec retenue (moins de 10, un chiffre après la virgule)", nom: "Additionner avec un échange", palier: 3, type: "P",
        composer: deuxComposer(D6_LISTES[2], D6_SORTES[2], [2, 5, 3]),
        imposes: [d6Somme(2, 3.5, 2.5), d6Somme(2, 8.6, 7.8)],
        apprends: deuxApprends({
          manipule: d6Somme(0, 2.7, 3.7),
          represente: d6Somme(0, 1.8, 4.5),
          ecris: d6Somme(0, 4.9, 3.4),
          consigne: "10 dixièmes font 1 unité.",
          bilan: "10 dixièmes font 1 unité : 2 + 3 = 5. 0,7 + 0,7 = 1,4. 2,7 + 3,7 = 6,4."
        })
      },
      {
        n: 3, titre: "chiffres après la virgule différents", nom: "Additionner\u00a0: dixièmes et centièmes", palier: 4, type: "P",
        composer: deuxComposer(D6_LISTES[3], D6_SORTES[3], [4, 6]),
        imposes: [d6Somme(3, 4.6, 0.35), d6Somme(3, 3.8, 2.47)],
        apprends: deuxApprends({
          manipule: d6Somme(0, 2.57, 5.8),
          represente: d6Somme(0, 1.4, 3.75),
          ecris: d6Somme(0, 3.46, 1.7),
          consigne: "Les dixièmes avec les dixièmes, les centièmes avec les centièmes.",
          bilan: "Les dixièmes avec les dixièmes, les centièmes avec les centièmes : 2 + 5 = 7. 0,57 + 0,8 = 1,37. 2,57 + 5,8 = 8,37."
        })
      }
    ]
  };

  const D7 = {
    id: "D7", nom: "Soustraire deux décimaux", exemple: "5,8 − 2,3",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "carre-op",
    erreurs: D7_ERREURS, image: deuxImage, aide: deuxAide, phrase: deuxPhrase, manipulation: deuxManipulation, difficulte: deuxDifficulte,
    niveaux: [
      {
        n: 1, titre: "sans retenue", nom: "Soustraire sans échange", palier: 3, type: "P",
        composer: deuxComposer(D7_LISTES[1], D7_SORTES[1], [6, 4]),
        imposes: [d7Difference(1, 7.6, 4.2), d7Difference(1, 13.8, 5.3)],
        apprends: deuxApprends({
          manipule: d7Difference(0, 5.8, 2.3),
          represente: d7Difference(0, 6.7, 3.4),
          ecris: d7Difference(0, 8.9, 4.5),
          consigne: "Les dixièmes avec les dixièmes.",
          bilan: "Les unités avec les unités, les dixièmes avec les dixièmes : 5 − 2 = 3. 0,8 − 0,3 = 0,5. 5,8 − 2,3 = 3,5."
        })
      },
      {
        n: 2, titre: "avec retenue", nom: "Soustraire avec un échange", palier: 4, type: "P",
        composer: deuxComposer(D7_LISTES[2], D7_SORTES[2], [4, 3, 3]),
        imposes: [d7Difference(2, 6.2, 0.5), d7Difference(2, 9, 1.9)],
        apprends: deuxApprends({
          manipule: d7Difference(0, 3.4, 0.8),
          represente: d7Difference(0, 5.3, 0.6),
          ecris: d7Difference(0, 7.2, 0.9),
          consigne: "Il n’y a pas assez de dixièmes : je casse une unité.",
          bilan: "Pas assez de dixièmes, je casse une unité : 3,4 = 2 + 1,4. 1,4 − 0,8 = 0,6. 3,4 − 0,8 = 2,6."
        })
      },
      {
        n: 3, titre: "chiffres après la virgule différents", nom: "Soustraire\u00a0: dixièmes et centièmes", palier: 4, type: "P",
        composer: deuxComposer(D7_LISTES[3], D7_SORTES[3], [3, 3, 2, 2]),
        imposes: [d7Difference(3, 6.48, 4.6), d7Difference(3, 5, 2.35)],
        apprends: deuxApprends({
          manipule: d7Difference(0, 5.42, 0.6),
          represente: d7Difference(0, 3.15, 0.4),
          ecris: d7Difference(0, 4.27, 0.5),
          consigne: "Il n’y a pas assez de dixièmes : je casse une unité.",
          bilan: "Pas assez de dixièmes, je casse une unité : 5,42 = 4 + 1,42. 1,42 − 0,6 = 0,82. 5,42 − 0,6 = 4,82."
        })
      }
    ]
  };

  // ============================================ lot 7b (15/11/2026)
  //
  // D8 « Doubles et moitiés de décimaux », D9 « Décimal × 5, × 50 », M13
  // « ÷ 4, ÷ 8 : la moitié de la moitié » : calcul mental CM2 (p. 16, 18,
  // 19), exemples de réussite CM2 (p. 8-10), évaluation de 6e (Q13, Q15) ;
  // bornes et familles du rapport de Codex du 14/11.
  //  - D8 : le schéma en barres de M1, le nombre coupé en deux morceaux —
  //    la partie entière et la partie décimale (13,6 = 13 + 0,6) ; le double
  //    et la moitié suivent le même chemin (moitié de 13,6 = 6,5 + 0,3) ; un
  //    entier impair (D8-1) : le pair d'avant et 1 (9 = 8 + 1).
  //  - D9 : les outils de M7 — le glisse-nombres (× 10, × 100 pour × 50),
  //    puis le nombre dix fois coupé en deux ; × 50, c'est × 100 puis la
  //    moitié (la v2 disait × 10).
  //  - M13 : la barre coupée en deux, puis encore en deux (rangées collées,
  //    le schéma de M6 à l'envers) ; J'écris, chaque moitié sur le résultat
  //    d'avant (« 140 ÷ 2 = 70 », « 70 ÷ 2 = 35 »).

  // ------------------------------------------------- D8 : doubles et moitiés de décimaux
  //
  // Les morceaux d'un nombre : la partie entière et la partie décimale
  // (13,6 → 13 et 0,6 ; 1,22 → 1 et 0,22) ; un entier impair : le pair
  // d'avant et 1 (9 → 8 et 1 ; 1 → 1).
  function d8Morceaux(n) {
    if (Number.isInteger(n)) return n > 1 && n % 2 ? [n - 1, 1] : [n];
    const e = Math.floor(n + 1e-9);
    const d = exact(n - e);
    return e ? [e, d] : [d];
  }
  // Formes : « double » (double de 13,6), « double-fois » (2 × 4,35),
  // « moitie » (moitié de 9), « division » (1,22 ÷ 2), « trou-double »
  // (2 × □ = 9). `ecrit` : le nombre tel qu'il s'écrit, quand il garde un
  // zéro (« 8,10 », évaluation de 6e, Q13). Données : n, r, e (la partie
  // entière), dec (la partie décimale), morceaux, zero (écrit avec son
  // zéro), et les réponses fausses connues : confondu (double et moitié
  // échangés), impair (la moitié de l'unité oubliée : moitié de 13,6 →
  // 6,3), sansEchange (double de 13,6 → 26,12), chiffres (moitié de 8,10 →
  // 4,5 : chaque chiffre coupé en deux).
  const D8_MOITIES = Object.freeze(["moitie", "division", "trou-double"]);
  const d8Moitie = calcul => D8_MOITIES.includes(calcul.forme);
  function d8Calcul(niveau, forme, n, ecrit = null) {
    const moitie = D8_MOITIES.includes(forme);
    const r = exact(moitie ? n / 2 : 2 * n);
    const e = Math.floor(n + 1e-9);
    const dec = exact(n - e);
    const morceaux = d8Morceaux(n);
    const x = Math.round(dec * 100);
    let impair = -1;
    let sansEchange = -1;
    let chiffres = -1;
    if (moitie && e % 2 === 1) impair = exact((e - 1) / 2 + dec / 2);
    if (!moitie && x % 10 === 0 && 2 * x >= 100) sansEchange = Number(`${2 * e}.${2 * x / 10}`);
    if (moitie && ecrit && e % 2 === 0) chiffres = Number(`${e / 2}.${x / 2}`);
    const texteN = ecrit || n;
    const morceauxTexte = {
      double: ["double de", texteN, "=", TROU],
      "double-fois": [2, "×", texteN, "=", TROU],
      moitie: ["moitié de", texteN, "=", TROU],
      division: [texteN, "÷", 2, "=", TROU],
      "trou-double": [2, "×", TROU, "=", texteN]
    }[forme];
    const donnees = {n, r, e, dec, morceaux: Object.freeze(morceaux), zero: Boolean(ecrit), confondu: exact(moitie ? 2 * n : n / 2), impair, sansEchange, chiffres};
    const calcul = fabriquer("D8", niveau, forme, morceauxTexte, r, donnees);
    // Les clés : « moitié de 9 » porte « q » (comme M1) ; « 8,10 » porte
    // son zéro (« 810d2 »), sinon ce serait 8,1.
    const nombreCle = ecrit ? `${ecrit.replace(",", "")}d${ecrit.split(",")[1].length}` : cleNombre(n);
    const cles = {double: `${nombreCle}`, "double-fois": `2-${nombreCle}`, moitie: `${nombreCle}-q`, division: `${nombreCle}-q-2`, "trou-double": `2-x-${nombreCle}`};
    return avecCle(calcul, `D8-${niveau}-${cles[forme]}`);
  }
  // (8,10 : le nombre et sa partie décimale s'écrivent avec leur zéro.)
  const d8Image = calcul => Object.assign({outil: "barres", sorte: d8Moitie(calcul) ? "moitie" : "double", n: calcul.donnees.n, morceaux: calcul.donnees.morceaux.slice()},
    calcul.donnees.zero ? {ecrit: `${f(calcul.donnees.n)}0`, ecrits: calcul.donnees.morceaux.map(m => (Number.isInteger(m) ? f(m) : `${f(m)}0`))} : {});
  const d8Aide = calcul => Object.assign(d8Image(calcul), {masque: true});
  function d8Phrase(calcul) {
    const {n, r, morceaux} = calcul.donnees;
    if (d8Moitie(calcul)) {
      if (morceaux.length < 2) return fr(`Regarde : ${f(n)} coupé en deux, ça fait ${f(r)} et ${f(r)}.`);
      return fr(`Regarde : ${morceaux.map(m => f(exact(m / 2))).join(" et ")}, ça fait ${f(r)}.`);
    }
    return fr(`Regarde : ${morceaux.map(m => f(exact(2 * m))).join(" et ")}, ça fait ${f(r)}.`);
  }
  // Du plus simple au plus dur : le double, puis la moitié, puis les autres
  // écritures ; un échange (double de 0,6 = 1,2), une unité impaire à
  // couper (13 → 6,5) ; la taille.
  const D8_FORMES = Object.freeze({double: 0, "double-fois": 0, moitie: 1, division: 2, "trou-double": 2});
  function d8Difficulte(calcul) {
    const {n, e, dec} = calcul.donnees;
    const echange = !d8Moitie(calcul) && 2 * dec >= 1 ? 1 : 0;
    const impair = d8Moitie(calcul) && e % 2 === 1 ? 1 : 0;
    return D8_FORMES[calcul.forme] * 1000 + (calcul.donnees.zero ? 400 : 0) + echange * 200 + impair * 200 + Math.min(99, Math.round(n * 5));
  }
  const D8_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "double et moitié confondus",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.confondu)),
      retour: (calcul, reponse) => {
        const {n} = calcul.donnees;
        return d8Moitie(calcul)
          ? fr(`${f(reponse)}, c’est le double de ${f(n)}. Ici, on coupe ${f(n)} en deux : ${f(n)} ÷ 2.`)
          : fr(`${f(reponse)}, c’est la moitié de ${f(n)}. Le double, c’est 2 fois ${f(n)} : ${f(n)} + ${f(n)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "la moitié de l’unité oubliée",
      test: sauf((calcul, reponse) => calcul.donnees.impair >= 0 && memeNombre(reponse, calcul.donnees.impair)),
      retour: (calcul, reponse) => {
        const {e} = calcul.donnees;
        return fr(`${f(reponse)} : la moitié de ${f(e)}, ce n’est pas ${f((e - 1) / 2)}. ${f(e)} = ${f(e - 1)} + 1, et la moitié de 1, c’est 0,5 : moitié de ${f(e)} = ${f(exact(e / 2))}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "dixièmes doublés sans échange",
      test: sauf((calcul, reponse) => calcul.donnees.sansEchange >= 0 && memeNombre(reponse, calcul.donnees.sansEchange)),
      retour: (calcul, reponse) => {
        const x = Math.round(calcul.donnees.dec * 10);
        return fr(`${f(reponse)} : ${2 * x} dixièmes, c’est 1 unité et ${2 * x - 10} dixièmes.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 4, nom: "chaque chiffre coupé en deux",
      test: sauf((calcul, reponse) => calcul.donnees.chiffres >= 0 && memeNombre(reponse, calcul.donnees.chiffres)),
      retour: (calcul, reponse) => {
        const {e, dec} = calcul.donnees;
        const c = Math.round(dec * 100);
        return fr(`${f(reponse)} : après la virgule, il y a ${c} centièmes. La moitié de ${c} centièmes, c’est ${c / 2} centièmes : ${f(exact(dec / 2))}. Moitié de ${f(e)} = ${f(e / 2)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 5, nom: "un morceau oublié",
      test: sauf((calcul, reponse) => {
        const {r, morceaux} = calcul.donnees;
        if (morceaux.length < 2) return false;
        return morceaux.some(m => memeNombre(reponse, exact(d8Moitie(calcul) ? r - m / 2 : r - 2 * m)));
      }),
      retour: calcul => {
        const morceaux = calcul.donnees.morceaux.map(f).join(" et ");
        return d8Moitie(calcul) ? fr(`Coupe CHAQUE morceau en deux : ${morceaux}.`) : fr(`Double CHAQUE morceau : ${morceaux}.`);
      },
      gras: 0
    })
  ]);
  // Les viviers (rapport de Codex du 14/11) :
  //  - D8-1 : la moitié des impairs de 1 à 15 (calcul mental CM2, p. 16),
  //    trois écritures (moitié de 9 ; 9 ÷ 2 ; 2 × □ = 9 : 24 calculs, de
  //    quoi faire 20 calculs à l'entraînement) ;
  //  - D8-2 : un chiffre après la virgule ; le double (13,6), la moitié qui
  //    reste aux dixièmes (un nombre pair de dixièmes : 7,4 ; jamais 8,1) ;
  //    la partie entière jusqu'à 19 pour le double, jusqu'à 15 ou 16, 18
  //    pour la moitié (sa moitié est un fait connu : M1-1, D8-1) ;
  //  - D8-3 : les centièmes ; le double (2 × 4,35), la moitié aux centièmes
  //    (1,22 ÷ 2 ; un nombre pair de centièmes), la moitié qui fait des
  //    centièmes, écrite avec son zéro (moitié de 8,10 = 4,05).
  // Jamais de partie entière nulle (le schéma garde ses deux morceaux).
  // (Un paquet par écriture : chaque écriture est dans chaque série.)
  function d8Vivier(niveau) {
    const impairs = entre(1, 15, 2);
    const paquet = (forme, nombres, ecrit = () => null) => Object.freeze(nombres.map(n => d8Calcul(niveau, forme, n, ecrit(n))));
    if (niveau === 1) return Object.freeze([paquet("moitie", impairs), paquet("division", impairs), paquet("trou-double", impairs)]);
    if (niveau === 2) {
      const doubles = entre(1, 19).flatMap(e => entre(1, 9).map(d => exact(e + d / 10)));
      const moities = [...entre(1, 16), 18].flatMap(e => [2, 4, 6, 8].map(d => exact(e + d / 10)));
      return Object.freeze([paquet("double", doubles), paquet("double-fois", doubles), paquet("moitie", moities), paquet("division", moities)]);
    }
    const centiemes = entre(1, 9).flatMap(e => entre(1, 99).filter(x => x % 10).map(x => exact(e + x / 100)));
    const pairs = centiemes.filter(x => Math.round(x * 100) % 2 === 0);
    const zeros = entre(1, 9).flatMap(e => [1, 3, 5, 7, 9].map(y => exact(e + y / 10)));
    const avecZero = n => `${f(n)}0`;
    return Object.freeze([paquet("double-fois", centiemes), paquet("double", centiemes), paquet("division", pairs), paquet("moitie", pairs),
      paquet("moitie", zeros, avecZero), paquet("division", zeros, avecZero)]);
  }
  const D8_VIVIERS = Object.freeze({1: d8Vivier(1), 2: d8Vivier(2), 3: d8Vivier(3)});
  // (Chaque paquet se tire à part, dans ses proportions.)
  function d8Composer(niveau, parts) {
    const paquets = D8_VIVIERS[niveau];
    const dans = (calcul, i) => paquets[i].some(c => c.cle === calcul.cle);
    return function composer(rng, total, imposes) {
      const nombres = repartir(total, parts);
      const pris = new Set(imposes.map(c => c.cle));
      const tires = paquets.flatMap((paquet, i) => {
        const deja = imposes.filter(c => dans(c, i)).length;
        return melanger(rng, paquet).filter(c => !pris.has(c.cle)).slice(0, Math.max(0, nombres[i] - deja));
      });
      return [...tires, ...imposes];
    };
  }
  // Le dessin de J'écris : le schéma de M1 (un morceau par étape, puis
  // l'accolade).
  const d8Dessins = (calcul, etapes) => barresDessins(d8Image(calcul), etapes);
  // Les étapes d'un calcul (comme M1-3 : « double de 36 = 2 × 30 + 2 × 6 ») :
  // chaque morceau, puis le tout — « 2 × 13 = □ », « 2 × 0,6 = □ »,
  // « double de 13,6 = □ » ; « 13 ÷ 2 = □ », « 0,6 ÷ 2 = □ », « moitié de
  // 13,6 = □ » (calcul mental CM2, p. 18 : 13,6 ÷ 2 = (13 ÷ 2) + (0,6 ÷ 2)).
  // 8,10 : la partie décimale s'écrit aussi avec son zéro (0,10).
  function d8Etapes(calcul) {
    const {n, r, morceaux, zero} = calcul.donnees;
    const ecrit = x => (zero && !Number.isInteger(x) ? `${f(x)}0` : f(x));
    const morceau = x => (d8Moitie(calcul) ? `${ecrit(x)} ÷ 2` : `2 × ${ecrit(x)}`);
    const tout = {double: `double de ${ecrit(n)}`, "double-fois": `2 × ${ecrit(n)}`, division: `${ecrit(n)} ÷ 2`}[calcul.forme] || `moitié de ${ecrit(n)}`;
    return [...morceaux.map(m => [`${morceau(m)} = ?`, exact(d8Moitie(calcul) ? m / 2 : 2 * m)]), [`${tout} = ?`, r]];
  }
  // La consigne en égalité, qui commence par le calcul cherché (« double de
  // 13,6 = 2 × 13 + 2 × 0,6 ») ; « double de » ne se coupe pas.
  const d8Consigne = etapes => {
    const textes = etapes.map(([texte]) => texte.replace(" = ?", ""));
    return `${textes[textes.length - 1]} = ${textes.slice(0, -1).join(" + ")}`.replace(/(double|moitié) de /g, "$1\u00a0de\u00a0");
  };
  // J'écris de D8 (la même recette pour la leçon et les calculs tirés).
  // Un seul morceau (moitié de 1) : pas de J'écris tiré.
  function d8Ecris(calcul) {
    if (calcul.donnees.morceaux.length < 2 || calcul.forme === "trou-double") return null;
    const etapes = d8Etapes(calcul);
    return ecrisAvecDessins({
      consigne: fr(d8Consigne(etapes)),
      etapes: etapesEcris(etapes), reponse: calcul.reponse,
      solution: Object.freeze({image: Object.freeze(d8Image(calcul)), phrase: d8Phrase(calcul)})
    }, d8Dessins(calcul, etapes.length));
  }
  // J'apprends de D8 (comme M1, sans manipulation) : « Je représente » à
  // étapes sur le schéma (le premier calcul), puis J'écris (le deuxième).
  function d8Apprends({represente, ecris, bilan, autre = null}) {
    const etapes = d8Etapes(represente);
    const consigne = d8Consigne(etapes);
    return Object.freeze({
      exemple: exempleDe(represente),
      manipule: null,
      represente: ecrisAvecDessins(Object.freeze({
        outil: "barres", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(d8Aide(represente)),
        etapes: etapesEcris(etapes),
        solution: Object.freeze({image: d8Image(represente), phrase: d8Phrase(represente)})
      }), d8Dessins(represente, etapes.length)),
      ecris: d8Ecris(ecris),
      bilan: frBilan(bilan),
      ...autreDe(autre),
      image: Object.freeze(d8Image(represente)),
      calculs: Object.freeze({montre: represente, ecris}),
      textes: Object.freeze([represente.texte, represente.texte, ecris.texte])
    });
  }

  const D8 = {
    id: "D8", nom: "Doubles et moitiés de décimaux", exemple: "moitié de 9",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "barres",
    erreurs: D8_ERREURS, image: d8Image, aide: d8Aide, phrase: d8Phrase, manipulation: () => null, difficulte: d8Difficulte,
    // Comme M1 (lot 7e-2) : la première moitié arrive annoncée, avec son
    // dessin — chaque morceau déjà coupé en deux ; l'élève les réunit.
    aideNouveau: calcul => (d8Moitie(calcul) && calcul.donnees.morceaux.length > 1
      ? Object.assign(d8Aide(calcul), {trouves: calcul.donnees.morceaux.map((_, i) => i), fini: false}) : null),
    niveaux: [
      {
        n: 1, titre: "moitié des impairs jusqu’à 15", nom: "Moitié des impairs jusqu’à 15", palier: 3, type: "F",
        composer: d8Composer(1, [2, 1, 1]),
        imposes: [d8Calcul(1, "moitie", 1), d8Calcul(1, "trou-double", 9)],
        apprends: d8Apprends({
          represente: d8Calcul(0, "moitie", 9),
          ecris: d8Calcul(0, "moitie", 7),
          bilan: "La moitié de 1, c’est 0,5 : 8 ÷ 2 = 4. 1 ÷ 2 = 0,5. moitié de 9 = 4 + 0,5 = 4,5."
        })
      },
      {
        n: 2, titre: "un chiffre après la virgule", nom: "Doubles et moitiés\u00a0: dixièmes", palier: 3, type: "P",
        composer: d8Composer(2, [3, 2, 3, 2]),
        imposes: [d8Calcul(2, "double", 7.3), d8Calcul(2, "moitie", 13.6)],
        apprends: d8Apprends({
          represente: d8Calcul(0, "double", 13.6),
          ecris: d8Calcul(0, "double", 7.8),
          bilan: "Je double chaque morceau : double de 13,6 = 2 × 13 + 2 × 0,6 = 26 + 1,2 = 27,2.",
          autre: {phrase: "Pour la moitié, je coupe chaque morceau\u00a0:", calcul: "moitié de 13,6 = 6,5 + 0,3 = 6,8"}
        })
      },
      {
        n: 3, titre: "deux chiffres après la virgule", nom: "Doubles et moitiés\u00a0: centièmes", palier: 3, type: "P",
        composer: d8Composer(3, [2, 2, 2, 2, 1, 1]),
        imposes: [d8Calcul(3, "division", 1.22), d8Calcul(3, "moitie", 8.1, "8,10")],
        apprends: d8Apprends({
          represente: d8Calcul(0, "double-fois", 4.35),
          ecris: d8Calcul(0, "double-fois", 3.26),
          bilan: "Je double chaque morceau : 2 × 4,35 = 2 × 4 + 2 × 0,35 = 8 + 0,7 = 8,7.",
          autre: {phrase: "Pour la moitié, je coupe chaque morceau\u00a0:", calcul: "1,22 ÷ 2 = 0,5 + 0,11 = 0,61"}
        })
      }
    ]
  };

  // ------------------------------------------------- D9 : décimal × 5, × 50
  //
  // « 3,4 × 5 », « 50 × 12,4 » : les données de M7 (n, fois, p, dix, r…),
  // en décimal exact. × 5, c'est × 10 puis la moitié ; × 50, × 100 puis la
  // moitié (calcul mental CM2, p. 19).
  function d9Calcul(niveau, n, fois, gauche = false) {
    const p = fois * 2;
    const r = exact(n * fois);
    const donnees = {n, fois, p, dix: exact(n * p), r, somme: exact(n + fois), plus: exact(r * 10), moins: exact(r / 10)};
    return gauche
      ? fabriquer("D9", niveau, "produit-gauche", [fois, "×", n, "=", TROU], r, donnees)
      : fabriquer("D9", niveau, "produit", [n, "×", fois, "=", TROU], r, donnees);
  }
  // Le glisse-nombres avec la virgule (les colonnes de D2).
  function d9Manipulation(calcul) {
    const m = m7Manipulation(calcul);
    return Object.freeze(Object.assign({}, m, {colonnes: COLONNES_D2}));
  }
  // Le chiffre le plus à droite (3,4 → 4 ; 1,46 → 6).
  const dernierChiffre = x => Number(formaterNombre(x).replace(/\D/g, "").slice(-1));
  function d9Difficulte(calcul) {
    const {n} = calcul.donnees;
    return (calcul.forme === "produit-gauche" ? 1000 : 0) + (dernierChiffre(n) % 2 ? 500 : 0) + decimalesDe(n) * 100 + Math.min(99, Math.round(n));
  }
  // Les viviers (rapport de Codex) : des décimaux, jamais un entier (M7).
  //  - D9-1 : × 5, au plus trois chiffres ; un chiffre le plus à droite
  //    impair seulement avec un chiffre après la virgule (3,5 × 5 = 35 ÷ 2 =
  //    17,5) : 1,47 × 5 = 14,7 ÷ 2 = 7,35 demanderait la moitié aux centièmes,
  //    qui vient après (D8-3) ;
  //  - D9-2 : × 50, moins de 20, au plus trois chiffres, le chiffre le plus
  //    à droite pair (calcul mental CM2, p. 19) : dixièmes (12,4), centièmes
  //    (4,86).
  function d9Nombres(niveau) {
    if (niveau === 1) {
      const dixiemes = entre(1, 49).flatMap(e => entre(1, 9).map(d => exact(e + d / 10)));
      const centiemes = entre(1, 9).flatMap(e => entre(1, 99).filter(x => x % 10 && x % 2 === 0).map(x => exact(e + x / 100)));
      return [...dixiemes, ...centiemes];
    }
    const dixiemes = entre(1, 19).flatMap(e => [2, 4, 6, 8].map(d => exact(e + d / 10)));
    const centiemes = entre(1, 9).flatMap(e => entre(1, 99).filter(x => x % 10 && x % 2 === 0).map(x => exact(e + x / 100)));
    return [...dixiemes, ...centiemes];
  }
  function d9Vivier(niveau) {
    const fois = niveau === 2 ? 50 : 5;
    const nombres = d9Nombres(niveau);
    return Object.freeze({
      produit: Object.freeze(nombres.map(n => d9Calcul(niveau, n, fois))),
      "produit-gauche": Object.freeze(nombres.map(n => d9Calcul(niveau, n, fois, true)))
    });
  }
  const D9_VIVIERS = Object.freeze({1: d9Vivier(1), 2: d9Vivier(2)});
  // J'apprends de D9 : comme M7, le glisse-nombres avec la virgule.
  function d9Apprends(options) {
    const lecon = m7Apprends(options);
    const glisse = d9Manipulation(options.manipule);
    return Object.freeze(Object.assign({}, lecon, {
      manipule: Object.freeze({outil: "glisse", depart: glisse.depart, colonnes: glisse.colonnes, decalage: glisse.decalage, consigne: glisse.consigne, refus: glisse.refus, traces: glisse.traces})
    }));
  }

  const D9 = {
    id: "D9", nom: "Décimal × 5, × 50", exemple: "3,4 × 5",
    famille: "D", construit: true, virgule: true,
    aide_entraine: "dix-fois",
    erreurs: M7_ERREURS, image: m7Image, aide: m7Aide, phrase: m7Phrase, manipulation: d9Manipulation, difficulte: d9Difficulte,
    niveaux: [
      {
        n: 1, titre: "× 5 (trois chiffres au plus)", nom: "Décimal × 5", palier: 3, type: "P",
        composer: vivierNiveau(D9_VIVIERS[1], [7, 3]),
        imposes: [d9Calcul(1, 2.6, 5), d9Calcul(1, 7.3, 5, true)],
        apprends: d9Apprends({
          manipule: d9Calcul(0, 3.4, 5),
          represente: d9Calcul(0, 1.46, 5),
          ecris: d9Calcul(0, 2.48, 5, true),
          consigne: "1,46 × 5, c’est la moitié de 1,46 × 10.",
          consigneEcris: "5 × 2,48 = 2,48 × 10 ÷ 2",
          etapes: [["2,48 × 10 = ?", 24.8], ["24,8 ÷ 2 = ?", 12.4]],
          bilan: "× 5, c’est × 10 puis la moitié : 3,4 × 10 = 34. 3,4 × 5 = 34 ÷ 2 = 17."
        })
      },
      {
        n: 2, titre: "× 50 (nombre de moins de 20, au plus trois chiffres, chiffre le plus à droite pair)", nom: "Décimal × 50", palier: 3, type: "P",
        composer: vivierNiveau(D9_VIVIERS[2], [7, 3]),
        imposes: [d9Calcul(2, 16.2, 50), d9Calcul(2, 2.48, 50, true)],
        apprends: d9Apprends({
          manipule: d9Calcul(0, 12.4, 50),
          represente: d9Calcul(0, 4.6, 50),
          ecris: d9Calcul(0, 3.8, 50, true),
          consigne: "4,6 × 50, c’est la moitié de 4,6 × 100.",
          consigneEcris: "50 × 3,8 = 3,8 × 100 ÷ 2",
          etapes: [["3,8 × 100 = ?", 380], ["380 ÷ 2 = ?", 190]],
          bilan: `× 50, c’est × 100 puis la moitié : 12,4 × 100 = 1${ESPACE_FINE}240. 12,4 × 50 = 1${ESPACE_FINE}240 ÷ 2 = 620.`
        })
      }
    ]
  };

  // ------------------------------------------------- M13 : ÷ 4, ÷ 8, la moitié de la moitié
  //
  // « 140 ÷ 4 » ou « 4 × □ = 140 » : n, d (4 ou 8), q ; les moitiés
  // successives (70, 35) pour J'écris et les erreurs connues. La règle
  // commune avec M12 (`m13Prend`, plus haut) : ÷ 4, ÷ 8 d'un nombre qui
  // finit par 0, au quotient entier qui ne finit pas par 0 → M13 ; tout le
  // reste → M12 (96 ÷ 8, 84 ÷ 4, 536 ÷ 8, 120 ÷ 4 = 30). M13-3 : un
  // quotient décimal (260 ÷ 8 = 32,5).
  function m13Calcul(niveau, forme, n, d) {
    const q = exact(n / d);
    const moities = [];
    for (let x = n, k = 1; k < d; k *= 2) { x = exact(x / 2); moities.push(x); }
    const donnees = {n, d, q, moities: Object.freeze(moities), unePlus: moities.slice(0, -1), trop: exact(q / 2), fois: n * d,
      arrondi: Number.isInteger(q) ? -1 : Math.floor(q)};
    return forme === "trou-facteur"
      ? fabriquer("M13", niveau, forme, [d, "×", TROU, "=", n], q, donnees)
      : fabriquer("M13", niveau, "division", [n, "÷", d, "=", TROU], q, donnees);
  }
  const m13Image = calcul => ({outil: "barres-fois", moitie: true, n: calcul.donnees.n, fois: calcul.donnees.d});
  const m13Aide = calcul => Object.assign(m13Image(calcul), {masque: true});
  const m13Phrase = calcul => fr(`Regarde : ${f(calcul.donnees.n)}, puis ${calcul.donnees.moities.map(f).join(", puis ")}.`);
  function m13Difficulte(calcul) {
    const {n, d} = calcul.donnees;
    return (calcul.forme === "trou-facteur" ? 5000 : 0) + (d === 8 ? 2000 : 0) + Math.min(1999, n);
  }
  const M13_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "coupé en deux une fois de moins",
      test: sauf((calcul, reponse) => calcul.donnees.unePlus.some(x => memeNombre(reponse, x))),
      retour: (calcul, reponse) => {
        const {d} = calcul.donnees;
        return fr(`${f(reponse)} : tu n’as pas coupé assez de fois. ÷ ${d}, c’est couper ${d === 4 ? "deux" : "trois"} fois en deux.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "coupé en deux une fois de trop",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.trop)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : tu as coupé en deux une fois de trop. ÷ ${calcul.donnees.d}, c’est couper ${calcul.donnees.d === 4 ? "deux" : "trois"} fois en deux.`),
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "la moitié d’un nombre impair",
      test: sauf((calcul, reponse) => calcul.donnees.arrondi >= 0 && (memeNombre(reponse, calcul.donnees.arrondi) || memeNombre(reponse, calcul.donnees.arrondi + 1))),
      retour: (calcul, reponse) => {
        const h = calcul.donnees.moities[calcul.donnees.moities.length - 2];
        return fr(`${f(reponse)} : la moitié de ${f(h)} n’est pas un nombre entier. ${f(h)} = ${f(h - 1)} + 1, et la moitié de 1, c’est 0,5.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 4, nom: "multiplié au lieu de diviser",
      test: sauf((calcul, reponse) => memeNombre(reponse, calcul.donnees.fois)),
      retour: (calcul, reponse) => fr(`${f(reponse)}, c’est ${f(calcul.donnees.n)} × ${calcul.donnees.d}. Ici, on coupe ${f(calcul.donnees.n)} en deux, puis encore en deux.`),
      gras: 0
    })
  ]);
  // Les viviers (règle commune avec M12) :
  //  - M13-1 : ÷ 4, de 140 à 980 (140 ÷ 4 = 35) — sans 60 ni 100 (les
  //    repères de M5), sans quotient de table (20 ÷ 4 : M4) ;
  //  - M13-2 : ÷ 8, de 120 à 1 960 (360 ÷ 8 = 45) ;
  //  - M13-3 : un quotient décimal, un chiffre après la virgule (,5), ÷ 4
  //    jusqu'à 590, ÷ 8 jusqu'à 780 (30 ÷ 4 = 7,5 ; 260 ÷ 8 = 32,5).
  function m13Vivier(niveau) {
    if (niveau === 3) {
      const quatre = entre(30, 590, 20).map(n => m13Calcul(3, "division", n, 4));
      const huit = entre(20, 780, 40).map(n => m13Calcul(3, "division", n, 8));
      return Object.freeze({division: Object.freeze([...quatre, ...huit])});
    }
    const d = niveau === 1 ? 4 : 8;
    const nombres = entre(10, niveau === 1 ? 990 : 1990, 10).filter(n => m13Prend(n, d) && m12Garde(n));
    return Object.freeze({
      division: Object.freeze(nombres.map(n => m13Calcul(niveau, "division", n, d))),
      "trou-facteur": Object.freeze(nombres.map(n => m13Calcul(niveau, "trou-facteur", n, d)))
    });
  }
  const M13_VIVIERS = Object.freeze({1: m13Vivier(1), 2: m13Vivier(2), 3: m13Vivier(3)});
  // Le dessin de J'écris : chaque moitié remplit sa rangée ; la dernière,
  // l'accolade.
  function m13Dessins(image, etapes) {
    const lignes = Math.round(Math.log2(image.fois));
    const dessin = (vus, revele = false) => (revele
      ? Object.freeze(Object.assign({}, image))
      : Object.freeze(Object.assign({}, image, {masque: true, trouves: Math.min(vus.length, lignes - 1), fini: vus.length >= etapes})));
    return dessinsDe(Array.from({length: etapes}, () => ({})), etapes, dessin);
  }
  // Les étapes : chaque moitié sur le résultat d'avant (« 140 ÷ 2 = □ »,
  // « 70 ÷ 2 = □ ») ; la moitié d'un impair au-delà de 15 (65), en
  // découpant : « 65 ÷ 2 = 60 ÷ 2 + 5 ÷ 2 = □ » (rapport de Codex : la
  // liste de D8-1 s'arrête à 15).
  function m13Etapes(calcul) {
    const {n, moities} = calcul.donnees;
    return moities.map((x, i) => {
      const h = i ? moities[i - 1] : n;
      const decoupe = h % 2 === 1 && h > 15 ? ` = ${f(h - h % 10)} ÷ 2 + ${h % 10} ÷ 2` : "";
      return [`${f(h)} ÷ 2${decoupe} = ?`, x];
    });
  }
  const m13Consigne = calcul => `${f(calcul.donnees.n)} ÷ ${calcul.donnees.d} = ${f(calcul.donnees.n)}${" ÷ 2".repeat(Math.round(Math.log2(calcul.donnees.d)))}`;
  // J'écris de M13 (la même recette pour la leçon et les calculs tirés).
  function recetteMoitieMoitie(calcul) {
    if (calcul.forme !== "division") return null;
    const etapes = m13Etapes(calcul);
    return ecrisAvecDessins({
      consigne: fr(m13Consigne(calcul)),
      etapes: etapesEcris(etapes), reponse: calcul.reponse,
      solution: Object.freeze({image: Object.freeze(m13Image(calcul)), phrase: m13Phrase(calcul)})
    }, m13Dessins(m13Image(calcul), etapes.length));
  }
  function m13Apprends({represente, ecris, consigne, bilan}) {
    return Object.freeze({
      exemple: exempleDe(represente),
      manipule: null,
      represente: Object.freeze({
        outil: "barres-fois", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: Object.freeze(m13Aide(represente)),
        solution: Object.freeze({image: m13Image(represente), phrase: m13Phrase(represente)})
      }),
      ecris: recetteMoitieMoitie(ecris),
      bilan: frBilan(bilan),
      image: Object.freeze(m13Image(represente)),
      calculs: Object.freeze({montre: represente, ecris}),
      textes: Object.freeze([represente.texte, represente.texte, ecris.texte])
    });
  }

  const M13 = {
    id: "M13", nom: "÷ 4, ÷ 8\u00a0: la moitié de la moitié", exemple: "140 ÷ 4",
    famille: "M", construit: true,
    aide_entraine: "barres-fois",
    erreurs: M13_ERREURS, image: m13Image, aide: m13Aide, phrase: m13Phrase, manipulation: () => null, difficulte: m13Difficulte
  };
  M13.niveaux = [
    {
      n: 1, titre: "diviser par 4", nom: "÷ 4\u00a0: la moitié de la moitié", palier: 3, type: "P",
      composer: vivierNiveau(M13_VIVIERS[1], [7, 3]),
      imposes: [m13Calcul(1, "division", 180, 4), m13Calcul(1, "trou-facteur", 220, 4)],
      apprends: m13Apprends({
        represente: m13Calcul(0, "division", 140, 4),
        ecris: m13Calcul(0, "division", 260, 4),
        consigne: "Je coupe 140 en deux, puis encore en deux.",
        bilan: "÷ 4, c’est la moitié de la moitié : 140 ÷ 2 = 70. 140 ÷ 4 = 70 ÷ 2 = 35."
      })
    },
    {
      n: 2, titre: "diviser par 8", nom: "÷ 8\u00a0: couper trois fois en deux", palier: 3, type: "P",
      composer: vivierNiveau(M13_VIVIERS[2], [7, 3]),
      imposes: [m13Calcul(2, "division", 520, 8), m13Calcul(2, "trou-facteur", 200, 8)],
      apprends: m13Apprends({
        represente: m13Calcul(0, "division", 360, 8),
        ecris: m13Calcul(0, "division", 280, 8),
        consigne: "Je coupe 360 en deux, puis encore, puis encore.",
        bilan: "÷ 8, c’est couper trois fois en deux : 360 ÷ 2 = 180. 180 ÷ 2 = 90. 360 ÷ 8 = 90 ÷ 2 = 45."
      })
    },
    {
      n: 3, titre: "résultat décimal", nom: "÷ 4, ÷ 8\u00a0: résultat décimal", palier: 3, type: "P", virgule: true,
      composer: vivierNiveau(M13_VIVIERS[3], [1]),
      imposes: [m13Calcul(3, "division", 30, 4), m13Calcul(3, "division", 180, 8)],
      apprends: m13Apprends({
        represente: m13Calcul(0, "division", 260, 8),
        ecris: m13Calcul(0, "division", 140, 8),
        consigne: "Je coupe 260 en deux, trois fois. La dernière moitié a une virgule.",
        bilan: "Je coupe trois fois en deux : 260 ÷ 2 = 130. 130 ÷ 2 = 65. 260 ÷ 8 = 65 ÷ 2 = 30 + 2,5 = 32,5."
      })
    }
  ];

  // ============================================ modules lot 6 (04/11/2026)
  //
  // F2, F5, F6, F8 : les fractions du CM1 (lot 6a ; F1 et F3 suivent, lot
  // 6b). Décisions de Gwenaël du 04/11 (planches choix-1 à choix-4, puis la
  // version 2, choix-5 à choix-7 ; fichier DECISIONS du dossier du lot) :
  //  - une seule case par calcul, toujours (« 1/2 + 1/4 = □/4 »,
  //    « 17/5 = 3 + □/5 », « 4/7 = 12/□ ») ; pas de touche « , » ;
  //  - Je manipule : les bandes du site posées bout à bout sur la droite
  //    graduée (poser, couper, fondre, enlever) ; Je représente, l'aide de
  //    l'entraînement, J'écris, la correction, « À retenir » : le schéma en
  //    barres, une seule barre de 0 à a posée sur la même droite ;
  //  - chaque module est une échelle, et les voisins ne se marchent pas
  //    dessus : F2 a les dénominateurs 2 et 4, et lui seul ; F6 n'a jamais
  //    une égalité dont les deux dénominateurs sont dans 1, 2, 4, ni un
  //    dénominateur d'arrivée 10 ; F5 et F8-3 n'ont jamais 10 (D1).
  //
  // Un calcul s'écrit en texte (« 1/2 + 1/4 = □/4 ») et se lit : ses deux
  // côtés, leurs termes {n, d, s} (d = 1 : un entier ; s : le signe), la
  // case (le côté, le terme, « n » ou « d »). La réponse se calcule, en
  // fractions exactes.

  const pgcd = (a, b) => (b ? pgcd(b, a % b) : Math.abs(a));
  const ppcm = (a, b) => a / pgcd(a, b) * b;
  // Une fraction exacte [num, den], réduite, den > 0.
  const qf = (n, d = 1) => { const g = pgcd(n, d) || 1; return [n / g * Math.sign(d), Math.abs(d) / g]; };
  const qPlus = (p, q) => qf(p[0] * q[1] + q[0] * p[1], p[1] * q[1]);
  const qMoins = (p, q) => qPlus(p, [-q[0], q[1]]);
  const qFois = (p, k) => qf(p[0] * k, p[1]);
  const qValeur = p => p[0] / p[1];
  const qEgal = (p, q) => p[0] === q[0] && p[1] === q[1];

  const NOMS_PARTS = Object.freeze({2: ["demi", "demis"], 3: ["tiers", "tiers"], 4: ["quart", "quarts"], 5: ["cinquième", "cinquièmes"], 6: ["sixième", "sixièmes"], 7: ["septième", "septièmes"], 8: ["huitième", "huitièmes"], 9: ["neuvième", "neuvièmes"], 10: ["dixième", "dixièmes"], 12: ["douzième", "douzièmes"]});
  const nomParts = (d, pluriel = true) => (NOMS_PARTS[d] ? NOMS_PARTS[d][pluriel ? 1 : 0] : null);
  // « 3 quarts », « 1 tiers ».
  const enParts = (n, d) => `${n} ${nomParts(d, n >= 2)}`;

  // Lire un calcul écrit. « a/d est entre n et □ » (F5-3) a sa propre forme.
  function lireFraction(texte) {
    const entre = /^(\d+)\/(\d+) est entre (\d+|□) et (\d+|□)$/.exec(texte);
    if (entre) {
      const [, a, d, bas, haut] = entre;
      return {entre: true, a: Number(a), d: Number(d), bas: bas === CASE ? null : Number(bas), haut: haut === CASE ? null : Number(haut)};
    }
    let cache = null;
    const cotes = texte.split(" = ").map((cote, k) => {
      const termes = [];
      let s = 1;
      cote.split(" ").forEach(morceau => {
        if (morceau === "+") { s = 1; return; }
        if (morceau === "−") { s = -1; return; }
        const [n, d = "1"] = morceau.split("/");
        if (n === CASE) cache = {cote: k, i: termes.length, part: "n"};
        if (d === CASE) cache = {cote: k, i: termes.length, part: "d"};
        termes.push(Object.freeze({n: n === CASE ? null : Number(n), d: d === CASE ? null : Number(d), s}));
        s = 1;
      });
      return termes;
    });
    return {cotes, cache};
  }
  const valeurTermeF = t => qf(t.s * t.n, t.d);
  const valeurCote = termes => termes.reduce((v, t) => qPlus(v, valeurTermeF(t)), [0, 1]);
  // Les termes avec la case remplie par la réponse.
  function remplir(lu, r) {
    return lu.cotes.map((termes, k) => termes.map((t, i) => (k === lu.cache.cote && i === lu.cache.i ? Object.freeze(Object.assign({}, t, lu.cache.part === "d" ? {d: r} : {n: r})) : t)));
  }
  // La réponse : ce qui rend les deux côtés égaux.
  function resoudreFraction(lu) {
    if (lu.entre) {
      const n = Math.floor(lu.a / lu.d);
      return lu.bas === null ? n : n + 1;
    }
    const {cote, i, part} = lu.cache;
    const autres = lu.cotes[cote].filter((_, j) => j !== i);
    const voulu = qMoins(valeurCote(lu.cotes[1 - cote]), valeurCote(autres));
    const t = lu.cotes[cote][i];
    const terme = qf(voulu[0] * t.s, voulu[1]);
    const r = part === "d" ? qf(t.n * terme[1], terme[0]) : qFois(terme, t.d);
    return r[1] === 1 && r[0] > 0 ? r[0] : NaN;
  }
  // « 1/2 + 1/4 », un terme, ou un côté entier.
  const ecrireTermeF = t => (t.d === 1 ? f(t.n) : `${f(t.n)}/${f(t.d)}`);
  const ecrireCote = termes => termes.map((t, i) => `${i ? (t.s < 0 ? "− " : "+ ") : ""}${ecrireTermeF(t)}`).join(" ");
  const ecrireFractionPleine = (lu, r) => (lu.entre
    ? `${lu.a}/${lu.d} est entre ${lu.bas === null ? r : lu.bas} et ${lu.haut === null ? r : lu.haut}`
    : remplir(lu, r).map(ecrireCote).join(" = "));

  // Un calcul de fractions, tiré de son texte. La clé : les nombres dans
  // l'ordre, « x » pour la case, « q » entre les deux côtés, le signe de
  // chaque terme (1 : +, 2 : −).
  function fracCalcul(module, niveau, forme, texte, code) {
    const lu = lireFraction(texte);
    const r = resoudreFraction(lu);
    const morceaux = lu.entre
      ? [lu.a, lu.d, lu.bas === null ? "x" : lu.bas, lu.haut === null ? "x" : lu.haut]
      : lu.cotes.flatMap((termes, k) => [...(k ? ["q"] : []), ...termes.flatMap(t => [t.n === null ? "x" : t.n, t.d === null ? "x" : t.d, t.s > 0 ? 1 : 2])]);
    return {texte, reponse: r, forme, module, niveau, cle: `${module}-${niveau}-${code}-${morceaux.join("-")}`, lu};
  }

  // ------------------------------------------------ le schéma en barres
  //
  // Une barre de 0 à a posée sur la droite, d parts fines par unité (le
  // plus petit multiple commun des dénominateurs) ; un trait épais toutes
  // les `gros` parts (le dénominateur le plus grossier). Ce qui est
  // coloré, ce qui est hachuré, les crochets et l'accolade suivent le
  // calcul. `revele` : la correction (la case remplie, sans « ? »).
  function fracBarre(calcul, {revele = false} = {}) {
    const lu = calcul.lu;
    const r = calcul.reponse;
    if (lu.entre) {
      // F5-3 : 43/8, les unités entières en blocs pleins, la dernière unité
      // coupée en huitièmes ; l'entier cherché porte « ? ».
      const n = Math.floor(lu.a / lu.d);
      return {outil: "barre-droite", a: n + 1, d: lu.d, pris: lu.a, entiers: n, cache: revele ? null : r, haut: [], bas: null};
    }
    const plein = remplir(lu, r);
    const {cote, i} = lu.cache;
    const termes = plein.flat();
    const dens = termes.map(t => t.d);
    const d = dens.reduce(ppcm, 1);
    const grossier = Math.min(...dens.filter(x => x > 1));
    const gros = grossier < d && Number.isFinite(grossier) ? d / grossier : 0;
    const parts = q => q[0] * d / q[1];
    const caseT = plein[cote][i];
    const ecritCase = revele ? ecrireTermeF(caseT) : lu.cache.part === "d" ? `${f(caseT.n)}/?` : caseT.d === 1 ? "?" : `?/${f(caseT.d)}`;
    const seul = lu.cotes[cote].length === 1;
    const image = {outil: "barre-droite", d, gros, pris: 0, retire: 0, haut: [], bas: null, cache: null};
    let fin = 0;
    if (seul) {
      // La case est seule de son côté : l'autre côté se dessine (une
      // fraction, une somme, une différence).
      const e = plein[1 - cote];
      const total = valeurCote(e);
      if (e.every(t => t.s > 0)) {
        image.pris = parts(total);
        let x = 0;
        if (e.length > 1 || e[0].d > 1) e.forEach(t => { const w = parts(valeurTermeF(t)); if (t.d > 1) image.haut.push({de: x, a: x + w, texte: ecrireTermeF(t)}); x += w; });
        fin = qValeur(total);
      } else {
        const premier = valeurTermeF(e[0]);
        image.pris = parts(premier);
        image.retire = parts(premier) - parts(total);
        let x = parts(total);
        e.slice(1).forEach(t => { const w = parts([t.n, t.d]); image.haut.push({de: x, a: x + w, texte: ecrireTermeF(t)}); x += w; });
        fin = qValeur(premier);
      }
      if (caseT.d === 1 && lu.cache.part === "n") image.cache = revele ? null : qValeur(total);
      else image.bas = {de: 0, a: parts(total), texte: ecritCase, cherche: !revele};
    } else {
      // La case est dans une somme ou une différence (17/5 = 3 + □/5,
      // 2/5 + □/5 = 1, 3/4 − □/4 = 1/2) : la barre dit le tout, les crochets
      // ce qu'on connaît, l'accolade ce qui manque.
      const e = plein[cote];
      const total = valeurCote(plein[1 - cote]);
      const tout = plein[1 - cote];
      if (e[i].s > 0) {
        image.pris = parts(total);
        let x = 0;
        e.forEach((t, j) => {
          const w = parts(valeurTermeF(t));
          if (j === i) {
            if (t.d === 1) image.cache = revele ? null : (x + w) / d;
            else image.bas = {de: x, a: x + w, texte: ecritCase, cherche: !revele};
          } else if (t.d > 1) image.haut.push({de: x, a: x + w, texte: ecrireTermeF(t)});
          x += w;
        });
        if (tout.length === 1 && tout[0].d === 1 && !e.some(t => t.d === 1)) image.haut.unshift({de: 0, a: parts(total), texte: ecrireTermeF(tout[0])});
        fin = qValeur(total);
      } else {
        // « 3/4 − □/4 = 1/2 » : le premier terme, la part enlevée hachurée.
        const premier = valeurTermeF(e[0]);
        image.pris = parts(premier);
        image.retire = parts(premier) - parts(total);
        image.haut.push({de: 0, a: parts(premier), texte: ecrireTermeF(e[0])});
        image.bas = {de: parts(total), a: parts(premier), texte: ecritCase, cherche: !revele};
        fin = qValeur(premier);
      }
    }
    image.a = Math.max(1, Math.ceil(fin - 1e-9));
    image.haut = Object.freeze(image.haut.map(Object.freeze));
    if (image.bas) image.bas = Object.freeze(image.bas);
    return image;
  }
  const fracImage = calcul => Object.freeze(fracBarre(calcul, {revele: true}));
  const fracAide = calcul => Object.freeze(fracBarre(calcul));
  const fracPhrase = calcul => fr(`Regarde : ${ecrireFractionPleine(calcul.lu, calcul.reponse)}.`);

  // ------------------------------------------------ les bandes à manipuler
  //
  // Le plan des gestes d'un calcul, s'il en a un (sinon null) : les bandes
  // de départ, puis les étapes (poser, couper, fondre, enlever), chacune
  // avec sa consigne ; la trace écrite au bout, avec l'étape
  // (« 1/2 + 1/4 = 2/4 + 1/4 = 3/4 »). Au plus 8 gestes, et des bandes
  // assez larges (30 parts au plus sur la droite).
  const FRAC_GESTES_MAX = 8;
  const FRAC_PARTS_MAX = 30;
  const DENS_RESERVE = Object.freeze([2, 3, 4, 5, 6, 8, 10, 12]);
  const bandesDe = (t, couleur) => (t.d === 1 ? Array.from({length: t.n}, () => ({d: 1, de: couleur})) : Array.from({length: t.n}, () => ({d: t.d})));
  // Couper ou fondre pour tout écrire en 1/T (T = 1 : en unités).
  function convertir(pieces, T, etapes, consignes) {
    const liste = pieces.slice();
    let k = 0;
    while (k < liste.length) {
      const p = liste[k];
      if (p.enleve || p.d === T) { k += 1; continue; }
      if (T % p.d === 0) {
        const en = T / p.d;
        etapes.push({geste: "couper", piece: k, en, consigne: consignes.couper(p, T)});
        liste.splice(k, 1, ...Array.from({length: en}, () => ({d: T})));
        k += en;
        continue;
      }
      // Un paquet de bandes plus fines qui fait 1/T.
      let somme = [0, 1];
      let n = 0;
      while (k + n < liste.length && qValeur(somme) < 1 / T - 1e-9) { somme = qPlus(somme, [1, liste[k + n].d]); n += 1; }
      if (!qEgal(somme, qf(1, T)) || n < 2) return null;
      etapes.push({geste: "fondre", piece: k, n, d: T, consigne: consignes.fondre(liste.slice(k, k + n))});
      liste.splice(k, n, {d: T, de: T === 1 ? liste[k].d : T});
      k += 1;
    }
    return liste;
  }
  const FRAC_CONSIGNES = Object.freeze({
    couper(p, T) {
      const en = nomParts(T) ? `en ${nomParts(T)}` : `en ${T / p.d}`;
      if (p.d === 1) return `1, c’est combien de ${nomParts(T) || `parts de 1/${T}`} ? Touche 1 : il se coupe ${en}.`;
      return `Touche 1/${p.d} : il se coupe ${en}.`;
    },
    // (Sans dire ce que fait le paquet : « 2 quarts font 1/2 » donnerait la
    // réponse de « 2/4 = □/2 ».)
    fondre(paquet) {
      const memes = paquet.every(p => p.d === paquet[0].d);
      const quoi = memes && nomParts(paquet[0].d) ? `les ${enParts(paquet.length, paquet[0].d)}` : "ces bandes";
      return `Touche le paquet : ${quoi} deviennent une seule bande.`;
    }
  });
  function fracManipulation(calcul) {
    const lu = calcul.lu;
    if (lu.entre) return null;
    const r = calcul.reponse;
    const plein = remplir(lu, r);
    const {cote, i} = lu.cache;
    const caseT = plein[cote][i];
    const etapes = [];
    let depart = [];
    let pieces;
    let milieu = null;
    let reserve = [];
    if (lu.cotes[cote].length === 1) {
      const e = plein[1 - cote];
      const T = caseT.d;
      if (e.every(t => t.s > 0)) {
        const fin = valeurCote(e);
        const poser = e.length > 1 && e.every(t => t.d > 1);
        const couleur = T;
        if (poser) {
          pieces = [];
          e.forEach(t => {
            etapes.push({geste: "poser", d: t.d, n: t.n, consigne: `Pose ${e.map(ecrireTermeF).join(", puis ")} : touche la bonne bande.`});
            pieces.push(...bandesDe(t));
          });
          reserve = [...new Set(e.map(t => t.d))];
        } else {
          depart = e.flatMap(t => bandesDe(t, couleur));
          pieces = depart.slice();
        }
        if (!convertir(pieces, T, etapes, FRAC_CONSIGNES)) return null;
        // L'étape écrite : chaque terme en 1/T, quand c'est possible.
        if (T > 1 && e.length > 1 && e.some(t => t.d !== T) && e.every(t => T % t.d === 0)) milieu = e.map(t => ({n: t.n * T / t.d, d: T, s: t.s}));
        if (T > 1 && e.length === 1 && e[0].d !== T && e[0].d === 1) milieu = null;
        void fin;
      } else {
        // Une différence : le premier terme posé, coupé s'il le faut, puis
        // on enlève ; le résultat dans les mêmes parts (sinon, pas de geste).
        const Tp = e.map(t => t.d).reduce(ppcm, 1);
        if (Tp !== T) return null;
        depart = bandesDe(e[0], T);
        pieces = convertir(depart.slice(), T, etapes, FRAC_CONSIGNES);
        if (!pieces) return null;
        const enlever = qMoins(valeurTermeF(e[0]), valeurCote(e)) ;
        const nombre = enlever[0] * T / enlever[1];
        const retires = e.slice(1).map(ecrireTermeF).join(" et ");
        const reste = pieces.map((_, k) => k);
        for (let k = 0; k < nombre; k += 1) {
          const piece = reste.pop();
          etapes.push({geste: "enlever", piece, parmi: reste.concat([piece]), consigne: `Enlève ${retires} : touche ${nombre > 1 ? "les" : "le"} ${nomParts(T, nombre > 1) || `bandes de 1/${T}`} à enlever.`});
        }
        if (e.some(t => t.d !== T)) milieu = e.map(t => ({n: t.n * T / t.d, d: T, s: t.s}));
      }
    } else if (cote === 1 && plein[0].length === 1 && plein[1][0].d === 1 && plein[1].length === 2) {
      // « 17/5 = 3 + □/5 », « 9/4 = □ + 1/4 » : les parts posées, on fond
      // chaque paquet qui fait 1.
      const a = plein[0][0];
      depart = bandesDe(a);
      pieces = depart.slice();
      const n = plein[1][0].n;
      for (let k = 0; k < n; k += 1) {
        etapes.push({geste: "fondre", piece: k, n: a.d, d: 1, consigne: `${enParts(a.d, a.d)} font 1 : touche le paquet.`});
      }
    } else {
      return null;
    }
    if (!etapes.length || etapes.length > FRAC_GESTES_MAX) return null;
    // La droite : de 0 à la plus grande longueur posée.
    const longueur = Math.max(...[depart, pieces].map(liste => liste.reduce((s, p) => s + 1 / p.d, 0)));
    const a = Math.max(1, Math.ceil(longueur - 1e-9));
    const plusFin = Math.max(...plein.flat().map(t => t.d));
    if (a * plusFin > FRAC_PARTS_MAX || a > 6) return null;
    if (reserve.length) {
      // La réserve : les bonnes bandes, et une ou deux autres, tant que tout
      // tient sur une ligne.
      // (D'abord la moitié de la plus petite bande, comme 1/8 à côté de 1/2
      // et 1/4 ; puis les plus proches.)
      const u = 360 / a;
      const largeur = liste => liste.reduce((s, d) => s + u / d, 0) + 14 * (liste.length - 1);
      const fin = Math.max(...reserve);
      const autres = DENS_RESERVE.filter(d => !reserve.includes(d)).sort((p, q) => (q === 2 * fin) - (p === 2 * fin) || Math.abs(p - fin) - Math.abs(q - fin) || q - p);
      for (const d of autres) if (reserve.length < 3 && largeur([...reserve, d]) <= 360) reserve.push(d);
      reserve.sort((p, q) => p - q);
    }
    const plein1 = ecrireFractionPleine(lu, r);
    const [gauche, droite] = plein1.split(" = ");
    const fini = milieu ? `${cote === 1 ? gauche : droite} = ${ecrireCote(milieu)} = ${cote === 1 ? droite : gauche}` : plein1;
    const texte = lu.cotes[cote].length === 1 ? ecrireCote(plein[1 - cote]) : calcul.texte;
    return Object.freeze({
      outil: "bandes", a, grad: plusFin, texte,
      depart: Object.freeze(depart.map(Object.freeze)),
      etapes: Object.freeze(etapes.map(e => Object.freeze(Object.assign({}, e, {consigne: fr(e.consigne)}, e.parmi ? {parmi: Object.freeze(e.parmi.slice())} : {})))),
      reserve: Object.freeze(reserve),
      consigne: fr(etapes[0].consigne), refus: null,
      traces: Object.freeze([Object.freeze({apres: etapes.length, attente: `${texte} = …`, texte: fini})])
    });
  }

  // ------------------------------------------------ J'apprends des fractions
  //
  // Les bandes sur le premier calcul (quand le niveau en a), la barre sur
  // le deuxième, la barre qui se remplit sur le troisième. `morceaux` : ce
  // que chaque étape de J'écris fait apparaître — {ecrit: entier} (la
  // graduation se réécrit en fraction : « 1 = 4/4 »), {gros} (les traits
  // épais : « chaque cinquième, 4 vingtièmes »), {haut: k} (un crochet
  // caché qui apparaît), {bas: true} (la case trouvée), {} (rien de plus).
  // L'exemple : le calcul sans sa case quand elle est seule à droite
  // (« 1/2 + 1/4 »), sinon le calcul avec « ? ».
  // (« 3/4 = ?/12 », « 1/4 + 1/4 = ?/2 » gardent leur droite : on y dit en
  // quelles parts écrire.)
  function exempleFraction(calcul) {
    const lu = calcul.lu;
    const droite = lu.cache && lu.cache.cote === 1 && lu.cotes[1].length === 1 ? lu.cotes[1][0] : null;
    const seule = droite && lu.cotes[0].length > 1 && lu.cache.part === "n" && droite.d === Math.max(...lu.cotes[0].map(t => t.d));
    return Object.freeze({texte: seule ? ecrireCote(lu.cotes[0]) : calcul.texte.replace(CASE, "?"), reponse: calcul.reponse});
  }
  function fracEcrisDessins(calcul, etapes, morceaux, {haut = []} = {}) {
    const aide = fracBarre(calcul);
    const correction = fracBarre(calcul, {revele: true});
    const avecEcrits = morceaux.some(m => m.ecrit !== undefined);
    const base = Object.assign({}, aide, {hautEtiquettes: avecEcrits ? 40 : 24, haut: [...aide.haut, ...haut.map(h => Object.assign({masque: true}, h))]});
    const gros = morceaux.find(m => m.gros);
    const dessin = (vus, revele = false) => {
      const image = Object.assign({}, base);
      const vu = cle => vus.some(m => m[cle] !== undefined);
      image.ecrits = {};
      morceaux.forEach((m, k) => {
        if (m.ecrit === undefined) return;
        if (revele || vus.includes(m)) image.ecrits[m.ecrit] = Object.freeze({texte: m.texte, trouve: !revele});
      });
      image.ecrits = Object.freeze(image.ecrits);
      if (gros) image.gros = revele || vu("gros") ? gros.gros : 0;
      // Un crochet caché qui apparaît, ou un crochet réécrit (« 1/2 » devient
      // « 2/4 »), en vert à son étape.
      image.haut = Object.freeze(base.haut.map((h, k) => {
        const m = morceaux.find(x => x.haut === k);
        const fait = Boolean(m && (revele || vus.includes(m)));
        return Object.freeze(Object.assign({}, h, {masque: Boolean(h.masque) && !fait, trouve: fait && !revele}, fait && m.texte ? {texte: m.texte} : {}));
      }));
      if (revele || vu("bas")) {
        if (correction.bas) image.bas = Object.freeze(Object.assign({}, correction.bas, {trouve: !revele}));
        image.cache = null;
        if (aide.cache !== null && !revele) image.ecrits = Object.freeze(Object.assign({}, image.ecrits, {[aide.cache]: Object.freeze({texte: String(aide.cache), trouve: true})}));
      }
      return Object.freeze(image);
    };
    return dessinsDe(morceaux, etapes.length, dessin);
  }
  function fracApprends({fiche, manipule = null, represente, ecris, consigne, consigneEcris, etapes, morceaux, haut = [], bilan}) {
    const premier = manipule || represente;
    return Object.freeze({
      exemple: exempleFraction(premier),
      manipule: manipule ? fracManipulation(manipule) : null,
      represente: Object.freeze({
        outil: "barre-droite", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: fracAide(represente),
        solution: Object.freeze({image: fracImage(represente), phrase: fracPhrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        consigne: fr(consigneEcris),
        etapes: etapesEcris(etapes), reponse: ecris.reponse,
        solution: Object.freeze({image: fracImage(ecris), phrase: fracPhrase(ecris)})
      }, fracEcrisDessins(ecris, etapes, morceaux, {haut})),
      bilan: frBilan(bilan),
      image: fracImage(manipule || represente),  // lot 3a : le calcul montré
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: manipule || represente, ecris: ecris}),
      textes: Object.freeze([...(manipule ? [manipule.texte] : []), represente.texte, ecris.texte])
    });
  }

  // Les données d'un calcul : la réponse, et les réponses fausses des
  // erreurs connues (−1 quand une erreur n'a pas de sens ici) — la page du
  // professeur les retrouve pour son exemple.
  const finirCalcul = (calcul, donnees) => Object.freeze(Object.assign({}, calcul, {donnees: Object.freeze(Object.assign({r: calcul.reponse}, donnees))}));
  const sansPareil = (calcul, valeur) => (valeur > 0 && Number.isInteger(valeur) && valeur !== calcul.reponse ? valeur : -1);

  // Les parts d'une barre de 0 à a : au plus 30 (au téléphone, la barre a
  // environ 300 px : une part de 10 px se compte encore).
  const FRAC_BARRE_MAX = 30;
  const tientSurLaBarre = (valeur, d) => Math.ceil(valeur - 1e-9) * d <= FRAC_BARRE_MAX;
  const enUnites = n => `${n} unité${n > 1 ? "s" : ""}`;
  // Les nombres « numérateurs seuls » : le calcul refait avec les
  // numérateurs comme s'ils étaient des parts de la même taille.
  function numerateursSeuls(lu) {
    if (lu.entre || lu.cache.part === "d") return -1;
    const {cote, i} = lu.cache;
    const somme = termes => termes.reduce((s, t, j) => s + (t.n === null ? 0 : t.s * t.n), 0);
    const t = lu.cotes[cote][i];
    const x = t.s * (somme(lu.cotes[1 - cote]) - somme(lu.cotes[cote].filter((_, j) => j !== i)));
    return x;
  }
  // Les dénominateurs d'un calcul lu (la case en moins).
  const densDe = lu => lu.cotes.flat().map(t => t.d).filter(d => d !== null);

  // ------------------------------------------------ F2 : demis, quarts et unité
  //
  // Seulement 1/2, 1/4, 2/4, 1 au niveau 1 ; 3/4 dans le calcul ou au
  // résultat au niveau 2. Des viviers écrits à la main : les petits viviers
  // de faits (décision technique : un peu plus de 30 calculs par niveau,
  // tous de la même sorte, plutôt que des reprises dans une série).
  const F2_CODES = Object.freeze({somme: 1, difference: 2, egale: 3, complement: 4});
  function f2Calcul(niveau, forme, texte) {
    const c = fracCalcul("F2", niveau, forme, texte, F2_CODES[forme]);
    const lu = c.lu;
    const caseT = lu.cotes[lu.cache.cote][lu.cache.i];
    const plein = remplir(lu, c.reponse);
    const T = lu.cache.part === "d" ? c.reponse : caseT.d;
    const autres = densDe(lu).filter(d => d !== T);
    const autre = autres.length ? autres.reduce((m, d) => (d < m ? d : m), autres[0]) : 1;
    const v = valeurTermeF(plein[lu.cache.cote][lu.cache.i]);
    const e = plein[1 - lu.cache.cote];
    const avecMoins = lu.cotes[lu.cache.cote].length === 1 && e.some(t => t.s < 0);
    const sens = avecMoins ? (() => { const q = e.reduce((s, t) => qPlus(s, [t.n, t.d]), [0, 1]); const x = qFois(q, T); return x[1] === 1 ? x[0] : -1; })() : -1;
    const compte = lu.cache.part === "d" ? autre : (() => { const x = qFois(v, autre); return x[1] === 1 ? x[0] : -1; })();
    // (Une égalité « 1/2 = □/4 » : recopier le numérateur, c'est compter
    // dans les mauvaises parts — la cause 3.)
    const plusieurs = lu.cotes.flat().length > 2;
    return finirCalcul(c, {
      numerateurs: plusieurs ? sansPareil(c, numerateursSeuls(lu)) : -1,
      sens: sansPareil(c, sens),
      compte: sansPareil(c, compte), autre
    });
  }
  const F2_VIVIERS = Object.freeze({
    1: Object.freeze({
      somme: ["1/2 + 1/2 = □", "1/2 + 1/2 = □/2", "1/2 + 1/2 = □/4", "1/4 + 1/4 = □/4", "1/4 + 1/4 = □/2", "1/4 + 1/4 = 1/□",
        "2/4 + 2/4 = □", "2/4 + 2/4 = □/4", "2/4 + 2/4 = □/2", "1/2 + 2/4 = □", "2/4 + 1/2 = □", "1/2 + 2/4 = □/4", "2/4 + 1/2 = □/2",
        "1/4 + 1/4 + 1/2 = □", "1/2 + 1/4 + 1/4 = □", "1/4 + 1/4 + 1/4 + 1/4 = □", "1/4 + 1/4 + 1/4 + 1/4 = □/2"].map(t => f2Calcul(1, "somme", t)),
      difference: ["1 − 1/2 = □/2", "1 − 1/2 = □/4", "1 − 2/4 = □/4", "1 − 2/4 = □/2", "1/2 − 1/4 = □/4", "2/4 − 1/4 = □/4",
        "1 − 1/4 − 1/4 = □/2", "1 − 1/4 − 1/4 = □/4", "2/2 − 1/2 = □/2", "4/4 − 2/4 = □/4", "4/4 − 2/4 = □/2"].map(t => f2Calcul(1, "difference", t)),
      egale: ["1/2 = □/4", "2/4 = □/2", "1 = □/2", "1 = □/4", "1/2 = 2/□", "2/4 = 1/□", "1 = 2/□", "1 = 4/□", "4/4 = □", "2/2 = □"].map(t => f2Calcul(1, "egale", t))
    }),
    2: Object.freeze({
      somme: ["1/2 + 1/4 = □/4", "1/4 + 1/2 = □/4", "2/4 + 1/4 = □/4", "1/4 + 2/4 = □/4", "1/4 + 1/4 + 1/4 = □/4", "3/4 + 1/4 = □", "1/4 + 3/4 = □",
        "3/4 + 1/4 = □/4", "3/4 + 1/2 = □/4", "1/2 + 3/4 = □/4", "3/4 + 2/4 = □/4", "3/4 + 3/4 = □/2", "3/4 + 3/4 = □/4"].map(t => f2Calcul(2, "somme", t)),
      difference: ["1 − 1/4 = □/4", "1 − 3/4 = □/4", "3/4 − 1/2 = □/4", "3/4 − 2/4 = □/4", "3/4 − 1/4 = □/2", "3/4 − 1/4 = □/4",
        "3/4 − 1/4 − 1/4 = □/4", "1 − 1/4 = 3/□"].map(t => f2Calcul(2, "difference", t)),
      complement: ["3/4 + □/4 = 1", "1/4 + □/4 = 1", "1/2 + □/4 = 3/4", "1/4 + □/4 = 3/4", "3/4 − □/4 = 1/2", "3/4 − □/4 = 1/4",
        "1 − □/4 = 3/4", "1 − □/4 = 1/4", "3/4 = 1/2 + □/4", "3/4 = 1/4 + □/4", "1 = 3/4 + □/4"].map(t => f2Calcul(2, "complement", t))
    })
  });
  const f2 = (niveau, texte) => {
    const tous = Object.values(F2_VIVIERS[niveau]).flat();
    const trouve = tous.find(c => c.texte === texte);
    if (!trouve) throw new Error(`F2-${niveau} : ${texte}`);
    return trouve;
  };
  // Le même calcul hors série (J'apprends : niveau 0).
  const pourApprendre = calcul => Object.freeze(Object.assign({}, calcul, {niveau: 0, cle: calcul.cle.replace(/^(\w+)-\d+-/, "$1-0-")}));
  const F2_RANGS = Object.freeze({egale: 0, somme: 1, difference: 2, complement: 3});
  function f2Difficulte(calcul) {
    const lu = calcul.lu;
    return F2_RANGS[calcul.forme] * 1000 + lu.cotes.flat().length * 100 + (lu.cache.part === "d" ? 50 : 0) + calcul.reponse;
  }
  const nomDe = d => nomParts(d) || `parts de 1/${d}`;
  const F2_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "les numérateurs seuls, comme si les parts étaient de la même taille",
      test: sauf((calcul, reponse) => calcul.donnees.numerateurs > 0 && memeNombre(reponse, calcul.donnees.numerateurs)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : tu as calculé avec les numérateurs seuls. Les parts ne sont pas de la même taille : écris tout en ${nomDe(densDe(calcul.lu).reduce(ppcm, 1))}.`),
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "le mauvais sens",
      test: sauf((calcul, reponse) => calcul.donnees.sens > 0 && memeNombre(reponse, calcul.donnees.sens)),
      retour: (calcul, reponse) => {
        const lu = calcul.lu;
        const e = lu.cotes[1 - lu.cache.cote];
        return fr(`${f(reponse)} : tu as ajouté. Ici, on enlève ${etListe(e.filter(t => t.s < 0).map(ecrireTermeF))}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "compté dans les mauvaises parts",
      test: sauf((calcul, reponse) => calcul.donnees.compte > 0 && memeNombre(reponse, calcul.donnees.compte)),
      retour: (calcul, reponse) => {
        const lu = calcul.lu;
        if (lu.cache.part === "d") return fr(`${f(reponse)} : tu as recopié un dénominateur. Cherche en combien de parts égales l’unité est coupée.`);
        const caseT = lu.cotes[lu.cache.cote][lu.cache.i];
        const autre = calcul.donnees.autre;
        return fr(`${f(reponse)} : tu as compté des ${autre === 1 ? "unités" : nomDe(autre)}. Ici, on compte des ${caseT.d === 1 ? "unités" : nomDe(caseT.d)}.`);
      },
      gras: 0
    })
  ]);
  const F2 = {
    id: "F2", nom: "Demis, quarts et unité", exemple: "1/2 + 1/2",
    famille: "F", construit: true,
    aide_entraine: "barre-droite",
    erreurs: F2_ERREURS, image: fracImage, aide: fracAide, phrase: fracPhrase, manipulation: fracManipulation, difficulte: f2Difficulte,
    niveaux: [
      {
        n: 1, titre: "demis et quarts", nom: "Demis et quarts", palier: 2, type: "F",
        composer: vivierNiveau(F2_VIVIERS[1], [5, 4, 3]),
        imposes: [f2(1, "1/2 + 1/2 = □"), f2(1, "2/4 = □/2")],
        apprends: fracApprends({
          fiche: "F2",
          manipule: pourApprendre(f2(1, "1/4 + 1/4 = □/2")),
          represente: pourApprendre(f2(1, "1 − 1/2 = □/2")),
          // Lot 3b : J'écris est une addition, comme la leçon.
          ecris: pourApprendre(f2(1, "1/2 + 2/4 = □")),
          consigne: "Une unité, c’est 2 demis.",
          consigneEcris: "1/2 + 2/4 = 2/4 + 2/4",
          etapes: [["1/2 = ?/4", 2], ["2/4 + 2/4 = ?/4", 4], ["1/2 + 2/4 = ?", 1]],
          morceaux: [{haut: 0, texte: "2/4"}, {}, {bas: true}],
          bilan: "1/4 + 1/4 = 2/4 = 1/2."
        })
      },
      {
        n: 2, titre: "avec 3/4", nom: "Demis et quarts, avec 3/4", palier: 3, type: "F",
        composer: vivierNiveau(F2_VIVIERS[2], [5, 4, 3]),
        imposes: [f2(2, "3/4 + 1/4 = □"), f2(2, "1 − 3/4 = □/4")],
        apprends: fracApprends({
          fiche: "F2",
          manipule: pourApprendre(f2(2, "1/2 + 1/4 = □/4")),
          represente: pourApprendre(f2(2, "1 − 1/4 = □/4")),
          ecris: pourApprendre(f2(2, "1/4 + 1/2 = □/4")),
          consigne: "Une unité, c’est 4 quarts.",
          consigneEcris: "1/4 + 1/2 = ?/4",
          etapes: [["1/2 = ?/4", 2], ["1/4 + 2/4 = ?/4", 3]],
          morceaux: [{haut: 1, texte: "2/4"}, {bas: true}],
          bilan: "1/2 = 2/4. 1/2 + 1/4 = 2/4 + 1/4 = 3/4."
        })
      }
    ]
  };

  // ------------------------------------------------ F5 : entier et fraction
  //
  // Dénominateurs de 2 à 9 (jamais 10 : D1), des fractions sous 6 ; aux
  // niveaux 1 et 2, au plus 30 parts sur la barre.
  const F5_CODES = Object.freeze({decomposer: 1, recomposer: 2, entier: 3, encadrer: 4, "encadrer-bas": 5});
  function f5Calcul(niveau, forme, texte) {
    const c = fracCalcul("F5", niveau, forme, texte, F5_CODES[forme]);
    const lu = c.lu;
    const d = {quotient: -1, retranche: -1, ajoute: -1, oubli: -1, meme: -1};
    if (forme === "decomposer") {
      const [a] = lu.cotes[0];
      const n = lu.cotes[1][0].n;
      Object.assign(d, {quotient: sansPareil(c, n), retranche: sansPareil(c, a.n - n)});
    } else if (forme === "entier") {
      const [a] = lu.cotes[0];
      const reste = lu.cotes[1][1].n;
      Object.assign(d, {quotient: sansPareil(c, reste), retranche: sansPareil(c, a.n - reste)});
    } else if (forme === "recomposer") {
      const [n, t] = lu.cotes[0];
      Object.assign(d, {ajoute: sansPareil(c, n.n + t.n), oubli: sansPareil(c, t.n)});
    } else {
      Object.assign(d, {meme: sansPareil(c, lu.bas === null ? lu.haut : lu.bas)});
    }
    return finirCalcul(c, d);
  }
  const fraction = (a, d) => `${a}/${d}`;
  function f5Vivier(niveau) {
    const decompositions = [];
    entre(2, 9).forEach(d => entre(d + 1, 6 * d - 1).forEach(a => { if (a % d) decompositions.push([a, d]); }));
    const surLaBarre = decompositions.filter(([a, d]) => tientSurLaBarre(a / d, d));
    // Lot « couverture » : l'entier jusqu'à 9 (58/7 = 8 + 2/7, exemple de
    // CM2) ; trop grands pour la barre, ils se dessinent comme « encadrer »
    // (les unités en blocs pleins). 2 calculs sur 10.
    const grandes = [];
    entre(3, 9).forEach(d => entre(6, 9).forEach(n => entre(1, d - 1).forEach(reste => { if ((n + reste) % 3 === 0) grandes.push([n * d + reste, d]); })));
    if (niveau === 1) {
      return Object.freeze({
        decomposer: surLaBarre.map(([a, d]) => f5Calcul(1, "decomposer", `${fraction(a, d)} = ${Math.floor(a / d)} + ${CASE}/${d}`)),
        grandes: grandes.map(([a, d]) => f5Calcul(1, "decomposer", `${fraction(a, d)} = ${Math.floor(a / d)} + ${CASE}/${d}`))
      });
    }
    if (niveau === 2) {
      // Lot « couverture » (décision du 06/11) : « encadrer » (l'ancien
      // niveau 3) est ici — c'est trouver l'entier, comme « 9/4 = □ + 1/4 ».
      return Object.freeze({
        recomposer: surLaBarre.map(([a, d]) => f5Calcul(2, "recomposer", `${Math.floor(a / d)} + ${fraction(a % d, d)} = ${CASE}/${d}`)),
        entier: surLaBarre.map(([a, d]) => f5Calcul(2, "entier", `${fraction(a, d)} = ${CASE} + ${fraction(a % d, d)}`)),
        encadrer: decompositions.map(([a, d]) => f5Calcul(2, "encadrer", `${fraction(a, d)} est entre ${Math.floor(a / d)} et ${CASE}`)),
        "encadrer-bas": decompositions.map(([a, d]) => f5Calcul(2, "encadrer-bas", `${fraction(a, d)} est entre ${CASE} et ${Math.floor(a / d) + 1}`)),
        grandes: grandes.map(([a, d]) => f5Calcul(2, "entier", `${fraction(a, d)} = ${CASE} + ${fraction(a % d, d)}`))
      });
    }
    return Object.freeze({
      encadrer: decompositions.map(([a, d]) => f5Calcul(3, "encadrer", `${fraction(a, d)} est entre ${Math.floor(a / d)} et ${CASE}`)),
      "encadrer-bas": decompositions.map(([a, d]) => f5Calcul(3, "encadrer-bas", `${fraction(a, d)} est entre ${CASE} et ${Math.floor(a / d) + 1}`))
    });
  }
  const F5_VIVIERS = Object.freeze({1: f5Vivier(1), 2: f5Vivier(2), 3: f5Vivier(3)});
  // La fraction d'un calcul de F5 tient-elle sur la barre ? (58/7 : non.)
  const f5Fraction = calcul => {
    const lu = calcul.lu;
    if (lu.entre) return [lu.a, lu.d];
    const t = lu.cotes.flat().find(x => x.d > 1 && x.n !== null && x.n >= x.d);
    if (t) return [t.n, t.d];
    const [e, q] = lu.cotes[0];
    return calcul.forme === "recomposer" ? [e.n * q.d + q.n, q.d] : [calcul.reponse, 1];
  };
  const f5SurLaBarre = calcul => { const [a, d] = f5Fraction(calcul); return tientSurLaBarre(a / d, d); };
  const f5Grande = calcul => !calcul.lu.entre && !f5SurLaBarre(calcul);
  const trouverDans = (viviers, module, niveau, texte) => {
    const trouve = Object.values(viviers[niveau]).flat().find(c => c.texte === texte);
    if (!trouve) throw new Error(`${module}-${niveau} : ${texte}`);
    return trouve;
  };
  const f5 = (niveau, texte) => trouverDans(F5_VIVIERS, "F5", niveau, texte);
  const F5_RANGS = Object.freeze({decomposer: 0, recomposer: 0, entier: 1, encadrer: 0, "encadrer-bas": 1});
  function f5Difficulte(calcul) {
    const lu = calcul.lu;
    const [a, d] = lu.entre ? [lu.a, lu.d] : calcul.forme === "recomposer" ? [lu.cotes[0][0].n * lu.cotes[0][1].d + lu.cotes[0][1].n, lu.cotes[0][1].d] : [lu.cotes[0][0].n, lu.cotes[0][0].d];
    return F5_RANGS[calcul.forme] * 1000 + Math.floor(a / d) * 60 + d * 5 + a / 10;
  }
  const F5_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "le quotient et le reste confondus",
      test: sauf((calcul, reponse) => calcul.donnees.quotient > 0 && memeNombre(reponse, calcul.donnees.quotient)),
      retour: (calcul, reponse) => {
        const d = calcul.lu.cotes[0][0].d;
        return calcul.forme === "entier"
          ? fr(`${f(reponse)}, c’est le nombre de ${nomDe(d)} qui restent. Ici, on cherche le nombre d’unités.`)
          : fr(`${f(reponse)}, c’est le nombre d’unités. Ici, on cherche les ${nomDe(d)} qui restent.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "des parts comptées comme des unités",
      test: sauf((calcul, reponse) => calcul.donnees.retranche > 0 && memeNombre(reponse, calcul.donnees.retranche)),
      retour: (calcul, reponse) => {
        const [a] = calcul.lu.cotes[0];
        if (calcul.forme === "entier") return fr(`${f(reponse)} : ce sont des ${nomDe(a.d)}, pas des unités. Combien d’unités dans ${enParts(reponse, a.d)} ?`);
        const n = calcul.lu.cotes[1][0].n;
        return fr(`${f(reponse)} : tu as retiré ${n} de ${a.n}. Mais ${enUnites(n)}, c’est ${enParts(n * a.d, a.d)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "l’entier ajouté au numérateur",
      test: sauf((calcul, reponse) => calcul.donnees.ajoute > 0 && memeNombre(reponse, calcul.donnees.ajoute)),
      retour: (calcul, reponse) => {
        const [n, t] = calcul.lu.cotes[0];
        return fr(`${f(reponse)}, c’est ${n.n} + ${t.n}. Une unité, c’est ${enParts(t.d, t.d)}${n.n > 1 ? ` : ${enUnites(n.n)}, c’est ${enParts(n.n * t.d, t.d)}` : ""}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 4, nom: "l’entier oublié",
      test: sauf((calcul, reponse) => calcul.donnees.oubli > 0 && memeNombre(reponse, calcul.donnees.oubli)),
      retour: (calcul, reponse) => {
        const [n, t] = calcul.lu.cotes[0];
        return fr(`${f(reponse)} : tu as oublié ${n.n === 1 ? "l’unité" : `les ${n.n} unités`}. Une unité, c’est ${enParts(t.d, t.d)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 5, nom: "le même entier",
      test: sauf((calcul, reponse) => calcul.donnees.meme > 0 && memeNombre(reponse, calcul.donnees.meme)),
      retour: (calcul, reponse) => {
        const lu = calcul.lu;
        return lu.bas === null
          ? fr(`${f(reponse)} : c’est le même entier. ${fraction(lu.a, lu.d)} est plus petit que ${f(reponse)} : cherche l’entier juste avant.`)
          : fr(`${f(reponse)} : c’est le même entier. ${fraction(lu.a, lu.d)} est plus grand que ${f(reponse)} : cherche l’entier juste après.`);
      },
      gras: 0
    })
  ]);
  const F5 = {
    id: "F5", nom: "Entier et fraction", exemple: "17/5 = 3 + ?/5",
    famille: "F", construit: true,
    aide_entraine: "barre-droite",
    // Lot « couverture » : au-delà de 6 unités (58/7 = 8 + 2/7), pas de
    // dessin — la droite n'en tient pas plus ; la table suffit (8 × 7 = 56).
    erreurs: F5_ERREURS, phrase: fracPhrase, difficulte: f5Difficulte,
    image: calcul => (f5Grande(calcul) ? null : fracImage(calcul)),
    aide: calcul => (f5Grande(calcul) ? null : fracAide(calcul)),
    // « Encadrer » n'a pas de bandes à manipuler (décision du 04/11) ; ni
    // les fractions trop grandes pour la barre (lot « couverture »).
    manipulation: calcul => (calcul.lu.entre || !f5SurLaBarre(calcul) ? null : fracManipulation(calcul)),
    niveaux: [
      {
        n: 1, titre: "décomposer", nom: "Fraction : entier et reste", palier: 2, type: "P",
        composer: vivierNiveau(F5_VIVIERS[1], [8, 2]),
        imposes: [f5(1, "13/4 = 3 + □/4"), f5(1, "8/3 = 2 + □/3")],
        apprends: fracApprends({
          fiche: "F5",
          manipule: pourApprendre(f5(1, "17/5 = 3 + □/5")),
          represente: pourApprendre(f5(1, "11/4 = 2 + □/4")),
          ecris: pourApprendre(f5(1, "23/6 = 3 + □/6")),
          consigne: "4 quarts font une unité.",
          consigneEcris: "23/6 = 3 + ?/6",
          etapes: [["3 = ?/6", 18], ["23/6 = 18/6 + ?/6", 5], ["23/6 = 3 + ?/6", 5]],
          morceaux: [{ecrit: 3, texte: "18/6"}, {bas: true}, {}],
          bilan: "15/5 = 3. 17/5 = 15/5 + 2/5 = 3 + 2/5."
        })
      },
      {
        n: 2, titre: "décomposer, recomposer, encadrer", nom: "Fraction : décomposer, recomposer, encadrer", palier: 2, type: "P",
        composer: vivierNiveau(F5_VIVIERS[2], [3, 3, 1, 1, 2]),
        imposes: [f5(2, "1 + 3/4 = □/4"), f5(2, "11/3 = □ + 2/3")],
        apprends: fracApprends({
          fiche: "F5",
          manipule: pourApprendre(f5(2, "2 + 2/3 = □/3")),
          represente: pourApprendre(f5(2, "9/4 = □ + 1/4")),
          ecris: pourApprendre(f5(2, "3 + 4/5 = □/5")),
          consigne: "4 quarts font une unité.",
          consigneEcris: "3 + 4/5 = ?/5",
          etapes: [["3 = ?/5", 15], ["15/5 + 4/5 = ?/5", 19]],
          morceaux: [{ecrit: 3, texte: "15/5"}, {bas: true}],
          bilan: "2 = 6/3. 2 + 2/3 = 6/3 + 2/3 = 8/3."
        })
      }
      // (Lot « couverture », 06/11/2026 : l'ancien niveau 3, encadrer, est
      // dans le niveau 2. Les identifiants restent : F5-3 n'existe plus.)
    ]
  };

  // ------------------------------------------------ F6 : fractions égales
  //
  // a/d irréductible, d de 2 à 9, un coefficient k ≥ 2, le dénominateur
  // d'arrivée au plus 30 (les parts se comptent), jamais 10 (F1, D1) ;
  // jamais une égalité aux dénominateurs 2 et 4 (F2).
  // Lot 7e (programme du CE2 : dénominateurs ≤ 12, fractions ≤ 1) : le
  // niveau 1, dans les bases, ne garde que les égalités jusqu'à 12 parts ;
  // les autres « multiplier » vont au niveau 2 (cours moyen).
  const F6_CODES = Object.freeze({multiplier: 1, diviser: 2, "diviser-den": 3, denominateur: 4, "denominateur-gauche": 5, "multiplier-gauche": 6});
  function f6Calcul(niveau, forme, a, d, k) {
    const A = k * a;
    const D = k * d;
    const textes = {
      multiplier: `${a}/${d} = ${CASE}/${D}`,
      diviser: `${A}/${D} = ${CASE}/${d}`,
      "diviser-den": `${A}/${D} = ${a}/${CASE}`,
      denominateur: `${a}/${d} = ${A}/${CASE}`,
      "denominateur-gauche": `${a}/${CASE} = ${A}/${D}`,
      // Lot 7e : l'écriture du programme du CE2 (« ?/8 = 1/2 »).
      "multiplier-gauche": `${CASE}/${D} = ${a}/${d}`
    };
    const c = fracCalcul("F6", niveau, forme, textes[forme], F6_CODES[forme]);
    const ajoute = {multiplier: a + D - d, diviser: A - (D - d), "diviser-den": D - (A - a), denominateur: d + (A - a), "denominateur-gauche": D - (A - a), "multiplier-gauche": a + D - d}[forme];
    const recopie = {multiplier: a, diviser: A, "diviser-den": D, denominateur: d, "denominateur-gauche": D, "multiplier-gauche": a}[forme];
    return finirCalcul(c, {a, d, k, ajoute: sansPareil(c, ajoute), recopie: sansPareil(c, recopie), coef: sansPareil(c, k)});
  }
  function f6Triplets() {
    const liste = [];
    entre(2, 9).forEach(d => entre(1, d - 1).forEach(a => {
      if (pgcd(a, d) !== 1) return;
      entre(2, 15).forEach(k => {
        const D = k * d;
        if (D > 30 || D === 10 || (d === 2 && D === 4)) return;
        liste.push([a, d, k]);
      });
    }));
    return liste;
  }
  const F6_TRIPLETS = Object.freeze(f6Triplets());
  // Lot « couverture » : des fractions plus grandes que 1 (?/8 = 7/2, CM1 ;
  // 21/? = 7/3, CM2), quand elles tiennent sur la barre.
  const F6_GRANDES = Object.freeze((() => {
    const liste = [];
    entre(2, 6).forEach(d => entre(d + 1, 3 * d - 1).forEach(a => {
      if (pgcd(a, d) !== 1) return;
      entre(2, 5).forEach(k => { if (tientSurLaBarre(a / d, k * d) && !(d === 2 && k === 2) && k * d !== 10) liste.push([a, d, k]); });
    }));
    return liste;
  })());
  // (15 égalités, et autant écrites à l'envers comme au programme :
  // « ?/8 = 1/2 ».)
  const F6_CE2 = Object.freeze(F6_TRIPLETS.filter(([, d, k]) => k * d <= 12));
  const F6_AU_DELA = Object.freeze(F6_TRIPLETS.filter(([, d, k]) => k * d > 12));
  const F6_VIVIERS = Object.freeze({
    1: Object.freeze({multiplier: F6_CE2.map(([a, d, k]) => f6Calcul(1, "multiplier", a, d, k)),
      "multiplier-gauche": F6_CE2.map(([a, d, k]) => f6Calcul(1, "multiplier-gauche", a, d, k))}),
    2: Object.freeze({diviser: F6_TRIPLETS.map(([a, d, k]) => f6Calcul(2, "diviser", a, d, k)), "diviser-den": F6_TRIPLETS.map(([a, d, k]) => f6Calcul(2, "diviser-den", a, d, k)),
      multiplier: [...F6_AU_DELA, ...F6_GRANDES].map(([a, d, k]) => f6Calcul(2, "multiplier", a, d, k))}),
    3: Object.freeze({denominateur: F6_TRIPLETS.map(([a, d, k]) => f6Calcul(3, "denominateur", a, d, k)), "denominateur-gauche": F6_TRIPLETS.map(([a, d, k]) => f6Calcul(3, "denominateur-gauche", a, d, k)),
      grandes: F6_GRANDES.map(([a, d, k]) => f6Calcul(3, "denominateur-gauche", a, d, k))})
  });
  const f6 = (niveau, texte) => trouverDans(F6_VIVIERS, "F6", niveau, texte);
  const F6_RANGS = Object.freeze({multiplier: 0, diviser: 0, "diviser-den": 1, denominateur: 0, "denominateur-gauche": 1, "multiplier-gauche": 1});
  const f6Difficulte = calcul => F6_RANGS[calcul.forme] * 1000 + calcul.donnees.k * calcul.donnees.d * 10 + calcul.donnees.k;
  const F6_MULTIPLIE = Object.freeze({multiplier: true, denominateur: true, "denominateur-gauche": true, "multiplier-gauche": true});
  const F6_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "ajouté au lieu de multiplié",
      test: sauf((calcul, reponse) => calcul.donnees.ajoute > 0 && memeNombre(reponse, calcul.donnees.ajoute)),
      retour: (calcul, reponse) => fr(F6_MULTIPLIE[calcul.forme]
        ? `${f(reponse)} : tu as ajouté le même nombre en haut et en bas. Pour une fraction égale, on multiplie en haut et en bas par le même nombre.`
        : `${f(reponse)} : tu as retiré le même nombre en haut et en bas. Pour une fraction égale, on divise en haut et en bas par le même nombre.`),
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "un nombre recopié",
      test: sauf((calcul, reponse) => calcul.donnees.recopie > 0 && memeNombre(reponse, calcul.donnees.recopie)),
      retour: (calcul, reponse) => {
        const k = calcul.donnees.k;
        const verbe = F6_MULTIPLIE[calcul.forme] ? "multiplié" : "divisé";
        const auDen = calcul.lu.cache.part === "d";
        return fr(`${f(reponse)} : tu as recopié le ${auDen ? "dénominateur" : "numérateur"}. Quand le ${auDen ? "numérateur" : "dénominateur"} est ${verbe} par ${k}, le ${auDen ? "dénominateur" : "numérateur"} aussi.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "le nombre par lequel on multiplie (ou divise)",
      test: sauf((calcul, reponse) => calcul.donnees.coef > 0 && memeNombre(reponse, calcul.donnees.coef)),
      retour: (calcul, reponse) => {
        const multiplie = F6_MULTIPLIE[calcul.forme];
        const auDen = calcul.lu.cache.part === "d";
        return fr(`${f(reponse)} : c’est le nombre par lequel on ${multiplie ? "multiplie" : "divise"}. Le ${auDen ? "dénominateur" : "numérateur"} aussi est ${multiplie ? "multiplié" : "divisé"} par ${f(reponse)}.`);
      },
      gras: 0
    })
  ]);
  // Lot 3b (règle de Gwenaël du 12/11/2026) : au-delà de 12 parts, plus de
  // barre ; le calcul « × 4 en haut et en bas » se dessine (deux flèches, le
  // même nombre). `vus` : ce qui est écrit (J'écris) — haut, bas, la case.
  const F6_PLACES = Object.freeze({multiplier: "dn", diviser: "dn", "diviser-den": "dd", denominateur: "dd", "denominateur-gauche": "gd", "multiplier-gauche": "gn"});
  function f6Schema(calcul, {revele = false, haut = revele, bas = revele, trouve = false, trouveHaut = false, trouveBas = false} = {}) {
    const {a, d, k} = calcul.donnees;
    const petit = [a, d];
    const grand = [k * a, k * d];
    const divise = calcul.forme === "diviser" || calcul.forme === "diviser-den";
    return Object.freeze({
      outil: "fois-fraction", op: divise ? "÷" : "×", k,
      gauche: Object.freeze(divise ? grand : petit), droite: Object.freeze(divise ? petit : grand),
      cache: F6_PLACES[calcul.forme], montre: revele || trouve, trouve, haut, bas, trouveHaut, trouveBas
    });
  }
  const f6Image = calcul => (f6Grand(calcul) ? f6Schema(calcul, {revele: true}) : fracImage(calcul));
  const f6Aide = calcul => (f6Grand(calcul) ? f6Schema(calcul) : fracAide(calcul));
  // J'écris au-delà de 12 parts : le schéma se remplit étape par étape —
  // `morceaux` : {bas: true} (la flèche du dénominateur), {haut: true}, {case: true}.
  function f6EcrisSchema(apprends, calcul, morceaux) {
    const dessin = (vus, revele = false) => {
      const vu = cle => revele || vus.some(m => m[cle]);
      return f6Schema(calcul, {haut: vu("haut"), bas: vu("bas"), trouve: vu("case") && !revele, revele,
        trouveHaut: vu("haut") && !revele, trouveBas: vu("bas") && !revele});
    };
    const relier = dessinsDe(morceaux, morceaux.length, dessin);
    return Object.freeze(Object.assign({}, apprends, {
      ecris: Object.freeze(Object.assign({}, apprends.ecris, {
        dessins: relier.dessins,
        solution: Object.freeze(Object.assign({}, apprends.ecris.solution, {image: relier.revele}))
      }))
    }));
  }

  const F6 = {
    id: "F6", nom: "Fractions égales", exemple: "2/3 = ?/15",
    famille: "F", construit: true,
    aide_entraine: "barre-droite",
    erreurs: F6_ERREURS, image: f6Image, aide: f6Aide, phrase: fracPhrase, difficulte: f6Difficulte,
    // Les niveaux 2 et 3 n'ont pas de bandes à manipuler (décision du 04/11) ;
    // lot 3b : ni au-delà de 12 parts (le dessin du calcul à la place).
    manipulation: calcul => (calcul.niveau === 1 && !f6Grand(calcul) ? fracManipulation(calcul) : null),
    niveaux: [
      {
        n: 1, titre: "en multipliant", nom: "Fractions égales : multiplier", palier: 1, type: "P",
        composer: vivierNiveau(F6_VIVIERS[1], [6, 4]),
        imposes: [f6(1, "2/3 = □/9"), f6(1, "5/6 = □/12")],
        // Lot 7e (programme du CE2) : jusqu'à 12 parts, tout se dessine ;
        // J'écris revient sur les bandes (chaque quart coupé en 2), avec la
        // même ligne qu'au-delà : « 3/4 = (3 × 2)/(4 × 2) ».
        apprends: fracApprends({
          fiche: "F6",
          manipule: pourApprendre(f6(1, "3/4 = □/12")),
          represente: pourApprendre(f6(1, "2/3 = □/12")),
          ecris: pourApprendre(f6(1, "3/4 = □/8")),
          consigne: "Chaque tiers est coupé en 4.",
          consigneEcris: "3/4 = (3 × 2)/(4 × 2)",
          etapes: [["4 × ? = 8", 2], ["3 × 2 = ?", 6], ["3/4 = ?/8", 6]],
          morceaux: [{gros: 2}, {}, {bas: true}],
          bilan: "Chaque quart coupé en 3 : 3/4 = 9/12 (× 3 en haut et en bas)."
        })
      },
      {
        n: 2, titre: "en divisant", nom: "Fractions égales : diviser", palier: 3, type: "P",
        composer: vivierNiveau(F6_VIVIERS[2], [5, 3, 2]),
        imposes: [f6(2, "6/9 = □/3"), f6(2, "8/12 = 2/□")],
        apprends: f6EcrisSchema(fracApprends({
          fiche: "F6",
          represente: pourApprendre(f6(2, "9/12 = □/4")),
          ecris: pourApprendre(f6(2, "10/15 = □/3")),
          consigne: "3 douzièmes font un quart.",
          consigneEcris: "10/15 = (10 ÷ 5)/(15 ÷ 5)",
          etapes: [["15 ÷ ? = 3", 5], ["10 ÷ 5 = ?", 2], ["10/15 = ?/3", 2]],
          morceaux: [{}, {}, {bas: true}],
          bilan: "9/12 = 3/4 (÷ 3 en haut et en bas)."
        }), pourApprendre(f6(2, "10/15 = □/3")), [{bas: true}, {haut: true}, {case: true}])
      },
      {
        n: 3, titre: "le dénominateur manquant", nom: "Fractions égales : le dénominateur", palier: 3, type: "P",
        composer: vivierNiveau(F6_VIVIERS[3], [5, 3, 2]),
        imposes: [f6(3, "2/3 = 8/□"), f6(3, "3/□ = 9/15")],
        apprends: f6EcrisSchema(fracApprends({
          fiche: "F6",
          represente: pourApprendre(f6(3, "2/3 = 6/□")),
          ecris: pourApprendre(f6(3, "5/8 = 15/□")),
          consigne: "Chaque tiers est coupé en 3.",
          consigneEcris: "5/8 = (5 × 3)/(8 × 3)",
          etapes: [["5 × ? = 15", 3], ["8 × 3 = ?", 24], ["5/8 = 15/?", 24]],
          morceaux: [{}, {}, {bas: true}],
          bilan: "2/3 = 6/9 (× 3 en haut et en bas)."
        }), pourApprendre(f6(3, "5/8 = 15/□")), [{haut: true}, {bas: true}, {case: true}])
      }
    ]
  };

  // ------------------------------------------- F8 : même dénominateur
  //
  // Niveaux 1 et 2 : dénominateurs 3, 5 à 10, 12 (jamais 2 et 4 : F2) ;
  // niveau 3 : des soustractions seulement (« 3 + 2/5 », c'est F5-2),
  // dénominateurs de 2 à 9 (jamais 10 : D1), au plus 30 parts.
  // Lot 7e-2 (choix de Gwenaël du 15/11 ; programme du cycle 3, p. 6 ;
  // exemples de réussite du CM1, p. 5-6) : le niveau 3 passe au CM1 et
  // reçoit les sommes et différences au-delà de 1 (5/3 + 2/3, 7/5 − 3/5),
  // sur la barre avec l'unité marquée — dénominateurs 3, 5 à 9 (2 et 4 :
  // F2 ; 10 : D1). Le niveau 1 reçoit les sommes qui tombent pile sur 1
  // (2/5 + 3/5 = □) : au cycle 2, rien au-delà de 1.
  const F8_CODES = Object.freeze({somme: 1, difference: 2, "un-moins": 3, complement: 4, "entier-moins": 5, "moins-entier": 6, unitaires: 7, fois: 8, "un-moins-plusieurs": 9});
  function f8Calcul(niveau, forme, texte) {
    const c = fracCalcul("F8", niveau, forme, texte, F8_CODES[forme]);
    const lu = c.lu;
    const g = lu.cotes[0];
    const d = {un: -1, entier: -1, sens: -1, tout: -1};
    if (forme === "somme") d.sens = sansPareil(c, Math.abs(g[0].n - g[1].n));
    if (forme === "difference") d.sens = sansPareil(c, g[0].n + g[1].n);
    if (forme === "un-moins") Object.assign(d, {un: sansPareil(c, g[1].n - 1), sens: sansPareil(c, g[1].d + g[1].n)});
    if (forme === "complement") d.tout = sansPareil(c, g[0].d);
    if (forme === "entier-moins") Object.assign(d, {entier: sansPareil(c, g[0].n - g[1].n), sens: sansPareil(c, g[0].n * g[1].d + g[1].n)});
    if (forme === "moins-entier") Object.assign(d, {entier: sansPareil(c, g[0].n - g[1].n), sens: sansPareil(c, g[0].n + g[1].n * g[0].d)});
    return finirCalcul(c, d);
  }
  const F8_DENS = Object.freeze([3, 5, 6, 7, 8, 9, 10, 12]);
  // « 3 × 1/6 » (lot « couverture », programme de CE1) : le calcul de
  // « 1/6 + 1/6 + 1/6 », écrit avec « × ».
  function f8Fois(niveau, k, d) {
    const c = f8Calcul(niveau, "fois", Array.from({length: k}, () => `1/${d}`).join(" + ") + ` = ${CASE}/${d}`);
    return Object.freeze(Object.assign({}, c, {texte: `${k} × 1/${d} = ${CASE}/${d}`, cle: `F8-${niveau}-8-${k}-${d}`}));
  }
  function f8Vivier(niveau) {
    if (niveau === 1) {
      const sommes = [];
      const differences = [];
      F8_DENS.forEach(d => entre(1, d - 2).forEach(a => entre(1, d - 1 - a).forEach(b => sommes.push(f8Calcul(1, "somme", `${a}/${d} + ${b}/${d} = ${CASE}/${d}`)))));
      // Lot 7e-2 : pile sur 1 (« 2/5 + 3/5 = □ », la réponse est 1).
      F8_DENS.forEach(d => entre(1, d - 1).forEach(a => sommes.push(f8Calcul(1, "somme", `${a}/${d} + ${d - a}/${d} = ${CASE}`))));
      F8_DENS.forEach(d => entre(2, d - 1).forEach(a => entre(1, a - 1).forEach(b => differences.push(f8Calcul(1, "difference", `${a}/${d} − ${b}/${d} = ${CASE}/${d}`)))));
      // Lot « couverture » (CE1) : 1/8 + 1/8 + 1/8 = □/8, et 3 × 1/8.
      const unitaires = [];
      const fois = [];
      F8_DENS.forEach(d => entre(3, Math.min(5, d - 1)).forEach(k => {
        unitaires.push(f8Calcul(1, "unitaires", Array.from({length: k}, () => `1/${d}`).join(" + ") + ` = ${CASE}/${d}`));
        fois.push(f8Fois(1, k, d));
      }));
      return Object.freeze({somme: sommes, difference: differences, unitaires, fois});
    }
    if (niveau === 2) {
      return Object.freeze({
        "un-moins": F8_DENS.flatMap(d => entre(1, d - 1).map(a => f8Calcul(2, "un-moins", `1 − ${a}/${d} = ${CASE}/${d}`))),
        complement: F8_DENS.flatMap(d => entre(1, d - 1).map(a => f8Calcul(2, "complement", `${a}/${d} + ${CASE}/${d} = 1`))),
        // Lot « couverture » (CE2) : 1 − 1/10 − 3/10 − 2/10 = □/10.
        "un-moins-plusieurs": [5, 6, 8, 10, 12].flatMap(d => entre(1, d - 3).flatMap(a => entre(1, d - 2 - a).filter(b => (a + b) % 2 === d % 2).map(b => f8Calcul(2, "un-moins-plusieurs", `1 − ${a}/${d} − ${b}/${d} − 1/${d} = ${CASE}/${d}`))))
      });
    }
    const entierMoins = [];
    const moinsEntier = [];
    entre(2, 9).forEach(d => {
      entre(2, 5).forEach(n => { if (n * d <= FRAC_BARRE_MAX) entre(1, d - 1).forEach(c => entierMoins.push(f8Calcul(3, "entier-moins", `${n} − ${c}/${d} = ${CASE}/${d}`))); });
      entre(d + 1, 6 * d - 1).forEach(a => {
        if (a % d === 0 || !tientSurLaBarre(a / d, d)) return;
        entre(1, Math.floor(a / d)).forEach(n => moinsEntier.push(f8Calcul(3, "moins-entier", `${a}/${d} − ${n} = ${CASE}/${d}`)));
      });
    });
    // Lot 7e-2 : au-delà de 1, toujours sur la barre (30 parts au plus) ;
    // jamais un entier pile (6/3 : « entier moins une fraction » s'en
    // charge), ni un terme entier.
    const sommes = [];
    const differences = [];
    const rompu = (x, d) => x % d !== 0;
    [3, 5, 6, 7, 8, 9].forEach(d => {
      const termes = entre(1, 2 * d - 1).filter(x => rompu(x, d));
      termes.forEach(a => termes.forEach(b => {
        if (a + b > d && rompu(a + b, d) && tientSurLaBarre((a + b) / d, d)) sommes.push(f8Calcul(3, "somme", `${a}/${d} + ${b}/${d} = ${CASE}/${d}`));
      }));
      entre(d + 1, 3 * d - 1).filter(a => rompu(a, d) && tientSurLaBarre(a / d, d)).forEach(a => {
        entre(1, a - 1).filter(b => rompu(b, d)).forEach(b => differences.push(f8Calcul(3, "difference", `${a}/${d} − ${b}/${d} = ${CASE}/${d}`)));
      });
    });
    return Object.freeze({"entier-moins": entierMoins, "moins-entier": moinsEntier, somme: sommes, difference: differences});
  }
  const F8_VIVIERS = Object.freeze({1: f8Vivier(1), 2: f8Vivier(2), 3: f8Vivier(3)});
  const f8 = (niveau, texte) => trouverDans(F8_VIVIERS, "F8", niveau, texte);
  const F8_RANGS = Object.freeze({somme: 0, difference: 1, "un-moins": 0, complement: 1, "entier-moins": 0, "moins-entier": 1, unitaires: 0, fois: 1, "un-moins-plusieurs": 1});
  function f8Difficulte(calcul) {
    const dens = densDe(calcul.lu);
    return F8_RANGS[calcul.forme] * 1000 + Math.max(...dens) * 20 + calcul.reponse;
  }
  const F8_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "1 compté comme un numérateur",
      test: sauf((calcul, reponse) => calcul.donnees.un > 0 && memeNombre(reponse, calcul.donnees.un)),
      retour: (calcul, reponse) => {
        const t = calcul.lu.cotes[0][1];
        return fr(`${f(reponse)}, c’est ${t.n} − 1. Mais 1, c’est ${enParts(t.d, t.d)} : écris 1 en ${nomDe(t.d)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "l’entier retiré du numérateur",
      test: sauf((calcul, reponse) => calcul.donnees.entier > 0 && memeNombre(reponse, calcul.donnees.entier)),
      retour: (calcul, reponse) => {
        const [p, q] = calcul.lu.cotes[0];
        const [n, d] = calcul.forme === "entier-moins" ? [p.n, q.d] : [q.n, p.d];
        return fr(`${f(reponse)}, c’est ${p.n} − ${q.n}. Mais ${enUnites(n)}, c’est ${enParts(n * d, d)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "le mauvais sens",
      test: sauf((calcul, reponse) => calcul.donnees.sens > 0 && memeNombre(reponse, calcul.donnees.sens)),
      retour: (calcul, reponse) => {
        const t = calcul.lu.cotes[0][1];
        return calcul.forme === "somme"
          ? fr(`${f(reponse)} : tu as retiré. Ici, on ajoute ${ecrireTermeF(t)}.`)
          : fr(`${f(reponse)} : tu as ajouté. Ici, on enlève ${ecrireTermeF(t)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 4, nom: "le tout écrit, pas ce qui manque",
      test: sauf((calcul, reponse) => calcul.donnees.tout > 0 && memeNombre(reponse, calcul.donnees.tout)),
      retour: (calcul, reponse) => {
        const t = calcul.lu.cotes[0][0];
        return fr(`${f(reponse)}, c’est le tout : 1 = ${t.d}/${t.d}. Cherche ce qui manque pour aller jusqu’à 1.`);
      },
      gras: 0
    })
  ]);
  const F8 = {
    id: "F8", nom: "Additionner, soustraire : même dénominateur", exemple: "3/7 + 3/7",
    famille: "F", construit: true,
    aide_entraine: "barre-droite",
    erreurs: F8_ERREURS, image: fracImage, aide: fracAide, phrase: fracPhrase, difficulte: f8Difficulte,
    // Le niveau 3 n'a pas de bandes à manipuler (décision du 04/11).
    manipulation: calcul => (calcul.niveau === 3 ? null : fracManipulation(calcul)),
    niveaux: [
      {
        n: 1, titre: "même dénominateur", nom: "Fractions : même dénominateur", palier: 1, type: "P",
        composer: vivierNiveau(F8_VIVIERS[1], [5, 3, 1, 1]),
        imposes: [f8(1, "2/7 + 3/7 = □/7"), f8(1, "9/10 − 4/10 = □/10")],
        apprends: fracApprends({
          fiche: "F8",
          manipule: pourApprendre(f8(1, "3/8 + 3/8 = □/8")),
          represente: pourApprendre(f8(1, "5/8 − 2/8 = □/8")),
          ecris: pourApprendre(f8(1, "4/9 + 3/9 = □/9")),
          consigne: "On enlève 2 huitièmes.",
          consigneEcris: "4/9 + 3/9 = ?/9",
          etapes: [["4 + 3 = ?", 7], ["4/9 + 3/9 = ?/9", 7]],
          morceaux: [{}, {bas: true}],
          bilan: "3 huitièmes et 3 huitièmes, c’est 6 huitièmes : 3/8 + 3/8 = 6/8."
        })
      },
      {
        n: 2, titre: "1 moins une fraction", nom: "1 moins une fraction", palier: 1, type: "P",
        composer: vivierNiveau(F8_VIVIERS[2], [5, 4, 1]),
        imposes: [f8(2, "1 − 4/5 = □/5"), f8(2, "3/7 + □/7 = 1")],
        apprends: fracApprends({
          fiche: "F8",
          manipule: pourApprendre(f8(2, "1 − 2/3 = □/3")),
          represente: pourApprendre(f8(2, "1 − 3/8 = □/8")),
          ecris: pourApprendre(f8(2, "1 − 5/12 = □/12")),
          consigne: "Une unité, c’est 8 huitièmes.",
          consigneEcris: "1 − 5/12 = ?/12",
          etapes: [["1 = ?/12", 12], ["12/12 − 5/12 = ?/12", 7]],
          morceaux: [{ecrit: 1, texte: "12/12"}, {bas: true}],
          bilan: "1 = 3/3. 1 − 2/3 = 3/3 − 2/3 = 1/3."
        })
      },
      {
        // Lot 7e-2 : au CM1 (palier 2), avec les sommes et différences
        // au-delà de 1 ; d'où son nom.
        n: 3, titre: "au-delà de 1\u00a0: entier moins une fraction, sommes, différences", nom: "Fractions au-delà de 1", palier: 2, type: "P",
        composer: vivierNiveau(F8_VIVIERS[3], [4, 2, 2, 2]),
        imposes: [f8(3, "3 − 1/2 = □/2"), f8(3, "11/3 − 2 = □/3")],
        apprends: fracApprends({
          fiche: "F8",
          represente: pourApprendre(f8(3, "2 − 1/4 = □/4")),
          ecris: pourApprendre(f8(3, "3 − 2/5 = □/5")),
          consigne: "Une unité, c’est 4 quarts.",
          consigneEcris: "3 − 2/5 = ?/5",
          etapes: [["3 = ?/5", 15], ["15/5 − 2/5 = ?/5", 13]],
          morceaux: [{ecrit: 3, texte: "15/5"}, {bas: true}],
          bilan: "2 = 8/4. 2 − 1/4 = 8/4 − 1/4 = 7/4."
        })
      }
    ]
  };

  // ============================================ modules lot 6b (05/11/2026)
  //
  // F1 et F3 : la fin des fractions du palier 2 (le lot 6a a fait F2, F5,
  // F6, F8). Décisions de Gwenaël du 04/11 (fichier DECISIONS du dossier du
  // lot, planches choix-6 et choix-7, retouches de 20 h 15) :
  //  - F1 : les dixièmes avec des bandes de 1/10 posées sur la droite, le
  //    centième avec le carré de 100 de D1, le millième avec le tableau de
  //    numération ; 1/2, 1/4, 3/4, les demis, les cinquièmes : les bandes du
  //    site sur la droite, les décimaux écrits sous les graduations
  //    franchies, « ? » sur celle qu'on cherche ; 2 demis se fondent en
  //    « 1 ». La touche « , » quand la réponse est un décimal.
  //  - F3 : la barre du tout en haut (« 60 kg » écrit dedans), collée à la
  //    barre des d parts ; la part cherchée en bleu clair, entourée de bleu,
  //    le « ? » dedans. Les billes « façon Singapour » (un toucher sur le
  //    tas = une bille dans chaque case), jusqu'à 30 objets et un résultat
  //    entier. La touche « , » au niveau 3 seulement (une touche par niveau).

  // ------------------------------------------------ F1 : fractions et décimaux
  //
  // Quatre écritures (au plus quatre par niveau : chacune se voit dans les
  // 12 premiers calculs d'un entraînement), une seule case :
  //  - « decimal » : 3/4 = □ (la réponse est un décimal), et à l'envers,
  //    □ = 3/4 ;
  //  - « numerateur » : 0,75 = □/4 ;
  //  - « denominateur » : 0,25 = 1/□, et à l'envers, 1/□ = 0,25 ;
  //  - « centiemes » : 1/4 = □/100, 1/2 = □/10 (le carré de 100).
  // (Le sens de l'écriture est dans la clé : 1 et 2, 4 et 5.)
  // Les voisins : D1 a « 0,3 = □/10 », « 27/10 = □ », « k/100 = □ » (k ≥ 2)
  // — F1 ne les prend jamais ; F2 a les égalités tout en demis et quarts.
  const F1_CODES = Object.freeze({decimal: 1, "decimal-envers": 2, numerateur: 3, denominateur: 4, "denominateur-gauche": 5, centiemes: 6, fois: 7});
  const F1_PUISSANCES = Object.freeze({10: 1, 100: 2, 1000: 3});
  const ecrireDen = d => f(d);
  const F1_FORMES = Object.freeze({decimal: "decimal", "decimal-envers": "decimal", numerateur: "numerateur", denominateur: "denominateur", "denominateur-gauche": "denominateur", centiemes: "centiemes", fois: "numerateur"});
  function f1Calcul(niveau, ecriture, x) {
    const forme = ecriture;
    const {a = 0, d = 1, v = 0, n = 0, D = 1} = x;
    // (x.ecrit : « 1/10 » écrit en fraction dans « 1/10 = □ × 1/100 ».)
    let texte;
    let reponse;
    let morceaux;
    if (forme === "decimal" || forme === "decimal-envers") {
      reponse = exact(a / d);
      texte = forme === "decimal" ? `${a}/${ecrireDen(d)} = ${CASE}` : `${CASE} = ${a}/${ecrireDen(d)}`;
      morceaux = forme === "decimal" ? [a, d, "x"] : ["x", a, d];
    } else if (forme === "numerateur") {
      reponse = Math.round(v * d);
      texte = `${f(v)} = ${CASE}/${ecrireDen(d)}`;
      morceaux = [cleNombre(v), "x", d];
    } else if (forme === "fois") {
      // Lot « couverture » (automatisme de 6e) : « 1 = □ × 1/10 »,
      // « 1/10 = □ × 1/100 » — combien de dixièmes dans 1.
      reponse = Math.round(v * d);
      texte = `${x.ecrit || f(v)} = ${CASE} × 1/${ecrireDen(d)}`;
      morceaux = [cleNombre(v), "x", d];
    } else if (forme === "denominateur" || forme === "denominateur-gauche") {
      reponse = Math.round(n / v);
      texte = forme === "denominateur" ? `${f(v)} = ${n}/${CASE}` : `${n}/${CASE} = ${f(v)}`;
      morceaux = forme === "denominateur" ? [cleNombre(v), n, "x"] : [n, "x", cleNombre(v)];
    } else {
      reponse = Math.round(a * D / d);
      texte = `${a}/${d} = ${CASE}/${ecrireDen(D)}`;
      morceaux = [a, d, "x", D];
    }
    const valeur = forme === "decimal" || forme === "decimal-envers" ? reponse : forme === "centiemes" ? exact(a / d) : forme === "numerateur" ? v : v;
    const k = F1_PUISSANCES[forme === "centiemes" ? D : forme === "decimal" || forme === "decimal-envers" ? d : reponse] || 0;
    const donnees = {r: reponse, v: valeur, a, d, n, D, k,
      // 3/4 → 3,4 : le numérateur et le dénominateur écrits avec une virgule.
      colle: (forme === "decimal" || forme === "decimal-envers") && d < 10 ? Number(`${a}.${d}`) : -1,
      // 1/4 → 0,4 : le dénominateur après la virgule.
      den: (forme === "decimal" || forme === "decimal-envers") && d < 10 ? Number(`0.${d}`) : -1,
      // Un rang de trop ou de moins (1/100 → 0,1 ; 0,03 = 3/□ → 1 000).
      plus: k ? exact(reponse * 10) : -1,
      moins: k && (forme !== "denominateur" && forme !== "denominateur-gauche" || reponse >= 100) ? exact(reponse / 10) : -1,
      // 0,25 = 1/□ → 25 : les chiffres après la virgule.
      chiffres: (forme === "denominateur" || forme === "denominateur-gauche" || forme === "numerateur") && v < 1 ? Number(String(f(v)).split(",")[1] || -1) : -1
    };
    const c = {texte, reponse, forme: F1_FORMES[ecriture], module: "F1", niveau, cle: `F1-${niveau}-${F1_CODES[ecriture]}-${morceaux.join("-")}`, f1: Object.freeze({a, d, v, n, D, fois: forme === "fois"})};
    // « 1 = □ × 1/10 » : rangé avec « 1 = □/10 », avec son annonce.
    if (forme === "fois") Object.assign(c, {annonce: `on cherche combien de fois 1/${ecrireDen(d)}`});
    return finirCalcul(c, donnees);
  }
  const f1Dec = (niveau, a, d, envers = false) => f1Calcul(niveau, envers ? "decimal-envers" : "decimal", {a, d});
  const f1Num = (niveau, v, d) => f1Calcul(niveau, "numerateur", {v, d});
  const f1Den = (niveau, v, n, gauche = false) => f1Calcul(niveau, gauche ? "denominateur-gauche" : "denominateur", {v, n});
  const f1Cent = (niveau, a, d, D) => f1Calcul(niveau, "centiemes", {a, d, D});
  function f1Vivier(niveau) {
    const decimaux = niveau === 1 ? [...entre(1, 9).map(a => [a, 10]), [1, 100]]
      : niveau === 2 ? [[1, 2], [1, 4], [3, 4], [3, 2], [4, 2], [5, 2], [7, 2], [9, 2], [1, 1000]]
        : entre(1, 9).filter(a => a !== 5).map(a => [a, 5]);
    const inverses = niveau === 1 ? [...entre(1, 9).map(n => [exact(n / 10), n]), ...entre(1, 9).map(n => [exact(n / 100), n])]
      : niveau === 2 ? [[0.5, 1], [0.25, 1], [0.001, 1]]
        : [[0.2, 1], [0.4, 2], [0.6, 3], [0.8, 4]];
    const viviers = {decimal: [...decimaux.map(([a, d]) => f1Dec(niveau, a, d)), ...decimaux.map(([a, d]) => f1Dec(niveau, a, d, true))]};
    if (niveau === 2) viviers.numerateur = [[0.25, 4], [0.75, 4], [0.5, 4], [0.5, 2], [1.5, 2], [2.5, 2], [3.5, 2], [4.5, 2]].map(([v, d]) => f1Num(2, v, d));
    if (niveau === 3) viviers.numerateur = [0.2, 0.4, 0.6, 0.8, 1.2, 1.4, 1.6, 1.8].map(v => f1Num(3, v, 5));
    viviers.denominateur = [...inverses.map(([v, n]) => f1Den(niveau, v, n)), ...inverses.map(([v, n]) => f1Den(niveau, v, n, true))];
    if (niveau === 2) viviers.centiemes = [[1, 2, 10], [1, 2, 100], [1, 4, 100], [3, 4, 100], [3, 2, 10], [3, 2, 100], [5, 2, 10], [5, 2, 100]].map(([a, d, D]) => f1Cent(2, a, d, D));
    if (niveau === 3) viviers.centiemes = entre(1, 9).filter(a => a !== 5).flatMap(a => [f1Cent(3, a, 5, 10), f1Cent(3, a, 5, 100)]);
    // Lot « couverture » : les faits fermés de CM2 qui manquaient (1 = □/1 000,
    // 1/2, 1/4, 3/4 en millièmes, 2 = □/2), et au niveau 3 (6e) 1 = □ × 1/10.
    if (niveau === 2) {
      viviers.numerateur.push(f1Num(2, 1, 1000), f1Num(2, 2, 2));
      viviers.centiemes.push(f1Cent(2, 1, 2, 1000), f1Cent(2, 1, 4, 1000), f1Cent(2, 3, 4, 1000));
    }
    // (Lot 3a, décision 11 : plus de « 1 = □ × 1/10 » ici — combien de
    // dixièmes dans 1, c'est « Écritures d'un décimal ».)
    return Object.freeze(viviers);
  }
  const F1_VIVIERS = Object.freeze({1: f1Vivier(1), 2: f1Vivier(2), 3: f1Vivier(3)});
  const f1 = (niveau, texte) => trouverDans(F1_VIVIERS, "F1", niveau, texte);

  // Les dessins de F1.
  //  - un décimal cherché (1/2, 3/4, 5/2, 6/5, 3/10) : les bandes du site
  //    posées sur la droite ; une unité pleine se fond en « 1 » (sauf les
  //    dixièmes : moins d'une unité) ; les décimaux sous les graduations
  //    franchies, « ? » où arrivent les bandes ;
  //  - 1/100 : le carré de 100 de D1 (une bande de 1/100 ferait 3 pixels) ;
  //    1/1 000 : le tableau de numération ;
  //  - « 0,75 = □/4 », « 0,25 = 1/□ » : le schéma en barres sur la droite,
  //    les décimaux sous les graduations jusqu'au nombre donné ;
  //  - « 0,03 = 3/□ » (dixièmes, centièmes, millièmes) : le tableau de
  //    numération, le numérateur rangé dans sa colonne ;
  //  - « 1/4 = □/100 » : le carré de 100 colorié.
  const f1Bandes = (a, d) => [...Array.from({length: d === 10 ? 0 : Math.floor(a / d)}, () => Object.freeze({d: 1, de: d})), ...Array.from({length: d === 10 ? a : a % d}, () => Object.freeze({d}))];
  const f1Decimaux = (d, jusqua, a) => {
    const nombres = [];
    for (let k = 0; k <= a * d; k += 1) if (k % d === 0 || k <= jusqua) nombres.push(Object.freeze({k, texte: f(exact(k / d))}));
    return Object.freeze(nombres);
  };
  function f1Barre(calcul, revele) {
    const {v, d, n} = calcul.f1;
    if (calcul.forme === "numerateur") {
      const pris = Math.round(v * d);
      const a = Math.max(1, Math.ceil(v - 1e-9));
      return {outil: "barre-droite", a, d, pris, retire: 0, haut: Object.freeze([]), cache: null,
        bas: Object.freeze({de: 0, a: pris, texte: `${revele ? pris : "?"}/${d}`, cherche: !revele}), nombres: f1Decimaux(d, pris, a)};
    }
    const parts = calcul.reponse;
    return {outil: "barre-droite", a: 1, d: parts, pris: n, retire: 0, haut: Object.freeze([]), cache: null,
      bas: Object.freeze({de: 0, a: n, texte: `${n}/${revele ? parts : "?"}`, cherche: !revele}),
      nombres: Object.freeze([{k: 0, texte: "0"}, {k: n, texte: f(v)}, {k: parts, texte: "1"}].map(Object.freeze))};
  }
  function f1Tableau(calcul, revele) {
    const {a, d, v, n} = calcul.f1;
    if (calcul.forme === "decimal") {
      const k = F1_PUISSANCES[d];
      return {outil: "numeration", lignes: [Object.freeze({nombre: a, unite: -k, texte: `${a}/${f(d)}`})], resultat: {nombre: calcul.reponse, unite: 0, texte: ""}, inconnue: !revele};
    }
    // « 1 = □/1 000 », « 1/10 = □ × 1/100 » (lot « couverture ») : la ligne
    // du nombre, et dessous le numérateur cherché, à son rang.
    if (calcul.forme === "numerateur") {
      const k = F1_PUISSANCES[d];
      return {outil: "numeration", lignes: [Object.freeze({nombre: v, unite: 0, texte: f(v)})], resultat: {nombre: calcul.reponse, unite: -k, texte: revele ? `${f(calcul.reponse)}/${f(d)}` : "?"}, inconnue: !revele};
    }
    // « 0,03 = 3/□ » : la ligne de 0,03, et dessous le numérateur rangé à
    // son rang : sa colonne dit le dénominateur.
    const k = F1_PUISSANCES[calcul.reponse];
    return {outil: "numeration", lignes: [Object.freeze({nombre: v, unite: 0, texte: f(v)})], resultat: {nombre: n, unite: -k, texte: `${n}/${revele ? f(calcul.reponse) : "?"}`}, inconnue: false};
  }
  const f1AuTableau = calcul => (calcul.forme === "decimal" ? calcul.f1.d === 1000
    : calcul.forme === "numerateur" ? calcul.f1.d >= 100 || calcul.f1.fois
      : calcul.forme === "denominateur" && Boolean(F1_PUISSANCES[calcul.reponse]));
  function f1Dessin(calcul, revele) {
    const {a, d} = calcul.f1;
    if (f1AuTableau(calcul)) return f1Tableau(calcul, revele);
    if (calcul.forme === "centiemes") return d1Carre(exact(a / d));
    if (calcul.forme === "numerateur" || calcul.forme === "denominateur") return f1Barre(calcul, revele);
    // Un décimal cherché.
    if (d === 100) return revele ? f1Tableau(calcul, true) : d1Carre(calcul.reponse);
    return {outil: "bandes-droite", pieces: Object.freeze(f1Bandes(a, d)), a: Math.max(1, Math.ceil(a / d - 1e-9)), grad: d, decimaux: true, revele: revele ? f(calcul.reponse) : null};
  }
  const f1Aide = calcul => Object.freeze(f1Dessin(calcul, false));
  const f1Image = calcul => Object.freeze(f1Dessin(calcul, true));
  const f1Phrase = calcul => fr(`Regarde : ${sansEspace(calcul.texte).replace(CASE, f(calcul.reponse))}.`);

  // Les bandes à poser (Je manipule, et l'entraînement après deux
  // erreurs) : un toucher par bande (« Pose 3 fois 1/4 »), puis chaque
  // unité pleine se fond en « 1 » ; les décimaux s'écrivent sous les
  // graduations franchies, « ? » à l'arrivée. 1/100 : le carré à colorier
  // (un petit carré). Au plus 8 gestes.
  function f1Manipulation(calcul) {
    if (calcul.forme !== "decimal") return null;
    const {a, d} = calcul.f1;
    const calc = `${a}/${f(d)}`;
    const trace = Object.freeze({attente: `${calc} = …`, texte: `${calc} = ${f(calcul.reponse)}`});
    if (d === 100) {
      return Object.freeze(Object.assign(d1Carre(calcul.reponse), {
        texte: calc, consigne: fr("Colorie 1 centième : un petit carré, c’est un centième."), refus: null,
        traces: Object.freeze([Object.freeze(Object.assign({apres: 1}, trace))])
      }));
    }
    if (d === 1000) return null;
    const unites = d === 10 ? 0 : Math.floor(a / d);
    const etapes = [];
    for (let k = 0; k < a; k += 1) etapes.push({geste: "poser", d, n: 1, consigne: `Pose ${a} fois 1/${d} : où arrive la bande ?`});
    for (let k = 0; k < unites; k += 1) etapes.push({geste: "fondre", piece: k, n: d, d: 1, consigne: "Une unité est faite : touche le paquet."});
    if (etapes.length > FRAC_GESTES_MAX) return null;
    return Object.freeze({
      outil: "bandes", a: Math.max(1, Math.ceil(a / d - 1e-9)), grad: d, texte: calc, decimaux: true, arrivee: a,
      depart: Object.freeze([]),
      etapes: Object.freeze(etapes.map(e => Object.freeze(Object.assign({}, e, {consigne: fr(e.consigne)})))),
      reserve: Object.freeze([d]),
      consigne: fr(etapes[0].consigne), refus: null,
      traces: Object.freeze([Object.freeze(Object.assign({apres: etapes.length}, trace))])
    });
  }

  // Du plus simple au plus dur : l'écriture, puis le sens (« □ = 3/4 »
  // après « 3/4 = □ »), le centième après le dixième, le millième après
  // le reste, puis la valeur.
  const F1_RANGS = Object.freeze({decimal: 0, numerateur: 1, centiemes: 2, denominateur: 3});
  const f1Difficulte = calcul => F1_RANGS[calcul.forme] * 1000 + (/^(□|\d+\/□)/.test(calcul.texte) ? 500 : 0)
    + (calcul.f1.d === 1000 || calcul.reponse === 1000 ? 300 : calcul.f1.d === 100 || calcul.reponse === 100 ? 150 : 0) + Math.min(calcul.reponse, 999) / 10 + calcul.donnees.v;

  // Les erreurs connues (DECISIONS, F1).
  const F1_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "le numérateur et le dénominateur écrits avec une virgule",
      test: sauf((calcul, reponse) => calcul.donnees.colle > 0 && memeNombre(reponse, calcul.donnees.colle)),
      retour: (calcul, reponse) => {
        const {a, d} = calcul.f1;
        return fr(`${f(reponse)} : la barre de fraction n’est pas une virgule. ${a}/${d}, c’est ${enParts(a, d)} : ${a} fois 1/${d}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "un rang de trop ou de moins",
      test: sauf((calcul, reponse) => ["plus", "moins"].some(cle => calcul.donnees[cle] > 0 && memeNombre(reponse, calcul.donnees[cle]))),
      retour: (calcul, reponse) => {
        const {a, d, v, n} = calcul.f1;
        const sens = reponse > calcul.reponse ? "trop" : "moins";
        if (calcul.forme === "decimal") return fr(`${f(reponse)} : un rang de ${sens}. ${a}/${f(d)}, c’est ${enRang(a, F1_PUISSANCES[d])}.`);
        if (calcul.forme === "centiemes") return fr(`${f(reponse)} : un rang de ${sens}. Ici, on compte des ${nomRangs(F1_PUISSANCES[calcul.f1.D])}.`);
        return fr(`${f(reponse)} : un rang de ${sens}. Dans ${f(v)}, regarde dans quelle colonne est le ${n}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "le dénominateur recopié après la virgule",
      test: sauf((calcul, reponse) => calcul.donnees.den > 0 && memeNombre(reponse, calcul.donnees.den)),
      retour: (calcul, reponse) => {
        const {a, d} = calcul.f1;
        return fr(`${f(reponse)} : tu as écrit le dénominateur après la virgule. ${a}/${d}, c’est ${enParts(a, d)}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 4, nom: "les chiffres après la virgule, pris pour le nombre de parts",
      test: sauf((calcul, reponse) => calcul.donnees.chiffres > 0 && memeNombre(reponse, calcul.donnees.chiffres)),
      retour: (calcul, reponse) => {
        const {v, d} = calcul.f1;
        return calcul.forme === "numerateur"
          ? fr(`${f(reponse)}, ce sont les chiffres après la virgule de ${f(v)}. Ici, on compte des ${nomDe(d)}.`)
          : fr(`${f(reponse)}, ce sont les chiffres après la virgule de ${f(v)}. Cherche en combien de parts égales l’unité est coupée.`);
      },
      gras: 0
    })
  ]);

  // J'apprends de F1 : les bandes (ou le carré) sur le premier calcul, le
  // dessin du deuxième, et J'écris sur le troisième, avec son dessin qui
  // se remplit : `dessins` (fonction (k, revele) → le dessin après k étapes).
  function f1Apprends({manipule, represente, ecris, consigne, consigneEcris, etapes, dessins, bilan}) {
    const n = etapes.length;
    const liste = Array.from({length: n + 1}, (_, k) => Object.freeze(dessins(k, false)));
    return Object.freeze({
      exemple: Object.freeze({texte: manipule.texte.replace(CASE, "?"), reponse: manipule.reponse}),
      manipule: f1Manipulation(manipule),
      represente: Object.freeze({
        outil: f1Aide(represente).outil, consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: f1Aide(represente),
        solution: Object.freeze({image: f1Image(represente), phrase: f1Phrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        consigne: fr(consigneEcris),
        etapes: etapesEcris(etapes), reponse: ecris.reponse,
        solution: Object.freeze({image: f1Image(ecris), phrase: f1Phrase(ecris)})
      }, {dessins: Object.freeze(liste), revele: Object.freeze(dessins(n, true))}),
      bilan: frBilan(bilan),
      image: f1Image(manipule || represente),  // lot 3a : le calcul montré
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: manipule, ecris: ecris}),
      textes: Object.freeze([manipule.texte, represente.texte, ecris.texte])
    });
  }

  const F1 = {
    id: "F1", nom: "Fractions usuelles et décimaux", exemple: "1/10 =\u00a0?",
    famille: "F", construit: true, virgule: true,
    aide_entraine: "bandes-droite",
    erreurs: F1_ERREURS, image: f1Image, aide: f1Aide, phrase: f1Phrase, manipulation: f1Manipulation, difficulte: f1Difficulte,
    niveaux: [
      {
        n: 1, titre: "1/10 et 1/100", nom: "Dixième, centième\u00a0: en décimal", palier: 2, type: "F",
        composer: vivierNiveau(F1_VIVIERS[1], [6, 6]),
        imposes: [f1(1, "7/10 = □"), f1(1, "0,1 = 1/□")],
        apprends: f1Apprends({
          manipule: pourApprendre(f1(1, "3/10 = □")),
          represente: pourApprendre(f1(1, "1/100 = □")),
          ecris: pourApprendre(f1(1, "0,7 = 7/□")),
          consigne: "Un petit carré sur 100.",
          consigneEcris: "0,7 = 7/?",
          etapes: [["7/10 = ?", 0.7], ["0,7 = 7/?", 10]],
          // Le tableau : la ligne de 0,7, le 7 rangé aux dixièmes ; la
          // 2e étape écrit « 7/10 » en vert (lot 3a : des dixièmes, comme la leçon).
          dessins: (k, revele) => {
            const tableau = f1Tableau(pourApprendre(f1(1, "0,7 = 7/□")), revele || k >= 2);
            return k >= 2 && !revele ? Object.assign(tableau, {resultat: Object.assign({}, tableau.resultat, {trouve: true})}) : tableau;
          },
          bilan: "1/10 = 0,1. 3/10 = 0,3."
        })
      },
      {
        n: 2, titre: "1/1\u00a0000, 1/2, 1/4, 3/4, 3/2, 4/2, 5/2 (dans les deux sens)", nom: "Demis, quarts, millième\u00a0: en décimal", palier: 3, type: "F",
        composer: vivierNiveau(F1_VIVIERS[2], [4, 3, 2, 3]),
        imposes: [f1(2, "1/4 = □"), f1(2, "0,5 = 1/□")],
        apprends: f1Apprends({
          manipule: pourApprendre(f1(2, "3/4 = □")),
          represente: pourApprendre(f1(2, "5/2 = □")),
          ecris: pourApprendre(f1(2, "3/4 = □/100")),
          consigne: "2 demis font une unité.",
          consigneEcris: "3/4 = ?/100",
          etapes: [["1/4 = ?/100", 25], ["3/4 = ?/100", 75]],
          // Le carré de 100 (lot 3a : J'écris sur 3/4) : vide, puis le quart
          // colorié, puis les trois quarts.
          dessins: (k, revele) => (revele || k >= 2 ? d1Carre(0.75) : k === 1 ? d1Carre(0.25) : d1Carre(0)),
          bilan: "3/4 = 75/100 = 0,75."
        })
      },
      {
        n: 3, titre: "cinquièmes", nom: "Cinquièmes\u00a0: en décimal", palier: 4, type: "F",
        composer: vivierNiveau(F1_VIVIERS[3], [4, 3, 2, 2]),
        imposes: [f1(3, "3/5 = □"), f1(3, "1/5 = □/10")],
        apprends: f1Apprends({
          manipule: pourApprendre(f1(3, "2/5 = □")),
          represente: pourApprendre(f1(3, "6/5 = □")),
          ecris: pourApprendre(f1(3, "3/5 = □")),
          consigne: "5 cinquièmes font une unité.",
          consigneEcris: "3/5 = 3 × 1/5",
          etapes: [["1/5 = ?", 0.2], ["3/5 = ?", 0.6]],
          // La barre de 3/5 (lot 3a) : la 1re étape écrit 0,2 sous la
          // première graduation, la 2e remplit l'accolade (0,6).
          dessins: (k, revele) => {
            const fini = revele || k >= 2;
            const nombres = [{k: 0, texte: "0"}, ...(revele || k >= 1 ? [{k: 1, texte: "0,2", trouve: !revele}] : []), {k: 5, texte: "1"}];
            return {outil: "barre-droite", a: 1, d: 5, pris: 3, retire: 0, haut: Object.freeze([]), cache: null,
              bas: Object.freeze(Object.assign({de: 0, a: 3, texte: fini ? "0,6" : "?", cherche: !revele}, k >= 2 && !revele ? {trouve: true} : {})),
              nombres: Object.freeze(nombres.map(Object.freeze))};
          },
          bilan: "1/5 = 0,2. 2/5 = 0,4."
        })
      }
    ]
  };

  // ------------------------------------------------ F3 : fraction unitaire d'une quantité
  //
  // « 1/4 de 12 billes, c’est □ billes. », « 1/5 de 60 kg, c’est □ kg. »
  // (lot 7e-2, choix de Gwenaël du 15/11 : en mots, sans signe =, comme
  // l'exemple de réussite du CM1, p. 6) : l'unité après la case, pour les
  // objets comme pour les mesures. Une écriture par partage (« part-4 » :
  // on partage en 4). La clé : l'unité (son numéro), d, N.
  const F3_UNITES = Object.freeze(["billes", "élèves", "g", "kg", "m", "€", "L", "cm"]);
  const F3_OBJETS = Object.freeze(["billes", "élèves"]);
  const F3_MESURES = Object.freeze(["g", "kg", "m", "€", "L", "cm"]);
  function f3Calcul(niveau, d, N, unite) {
    const objet = F3_OBJETS.includes(unite);
    // (Lot 7e-2 : un nombre et son unité ne se séparent jamais.)
    const tout = `${f(N)}\u00a0${unite}`;
    const texte = `1/${d} de ${tout}, c’est ${CASE}\u00a0${unite}.`;
    const r = exact(N / d);
    const q = Math.floor(N / d);
    const reste = N - q * d;
    const pas = (calcul, valeur) => (valeur > 0 && !memeNombre(valeur, calcul.reponse) ? exact(valeur) : -1);
    const c = {texte, reponse: r, forme: `part-${d}`, module: "F3", niveau, cle: `F3-${niveau}-${F3_UNITES.indexOf(unite) + 1}-${d}-${cleNombre(N)}-x`,
      f3: Object.freeze({d, N, unite, tout, objet})};
    return finirCalcul(c, {
      fois: pas(c, N * d),
      moitie: d > 2 ? pas(c, N / 2) : -1,
      restants: d > 2 ? pas(c, N - N / d) : -1,
      oubli: reste ? pas(c, q) : -1,
      apres: reste && d < 10 ? pas(c, q + reste / 10) : -1
    });
  }
  // Une unité pour chaque calcul, à tour de rôle : des billes jusqu'à 30
  // (on peut les partager à la main), une mesure ou des élèves au-delà ;
  // au niveau 3 (résultat décimal), une mesure.
  const F3_SANS_69 = N => !String(N).includes("69");
  function f3Unite(niveau, d, N, rang) {
    if (niveau === 3) return F3_MESURES[(rang + d) % 5 + 1];
    if (N <= 30) return "billes";
    return [...F3_MESURES, "élèves"][(rang + d) % 7];
  }
  function f3Liste(niveau, d, nombres) {
    return nombres.filter(F3_SANS_69).map((N, rang) => f3Calcul(niveau, d, N, f3Unite(niveau, d, N, rang)));
  }
  function f3Vivier(niveau) {
    if (niveau === 1) {
      return Object.freeze({
        "part-2": f3Liste(1, 2, [...entre(4, 40, 2), ...entre(50, 200, 10)]),
        "part-4": f3Liste(1, 4, [...entre(8, 40, 4), 60, 80, 100, 200, 400]),
        "part-10": [...f3Liste(1, 10, [...entre(20, 100, 10), 150, 200, 250, 300, 400, 500]), f3Calcul(1, 10, 1000, "g")]
      });
    }
    if (niveau === 2) {
      return Object.freeze({
        "part-3": f3Liste(2, 3, [...entre(2, 12).map(q => 3 * q), 60, 90, 300]),
        "part-5": f3Liste(2, 5, [...entre(2, 12).map(q => 5 * q), 100, 150, 200, 250, 500]),
        "part-6": f3Liste(2, 6, entre(2, 12).map(q => 6 * q)),
        "part-8": f3Liste(2, 8, entre(2, 12).map(q => 8 * q))
      });
    }
    return Object.freeze({
      "part-2": f3Liste(3, 2, entre(3, 39, 2)),
      "part-4": f3Liste(3, 4, entre(5, 39).filter(N => N % 4)),
      "part-5": f3Liste(3, 5, entre(6, 49).filter(N => N % 5)),
      "part-10": f3Liste(3, 10, entre(11, 99).filter(N => N % 10 && N % 3 === 1))
    });
  }
  const F3_VIVIERS = Object.freeze({1: f3Vivier(1), 2: f3Vivier(2), 3: f3Vivier(3)});
  // (Lot 7e-2 : un calcul du vivier par son début, « 1/2 de 14 billes ».)
  const f3 = (niveau, debut) => {
    const trouve = Object.values(F3_VIVIERS[niveau]).flat().find(c => sansEspace(c.texte).startsWith(`${debut},`));
    if (!trouve) throw new Error(`F3-${niveau} : ${debut}`);
    return trouve;
  };

  // Les dessins : le tout en haut, les parts dessous, la 1re part cherchée.
  const f3Aide = calcul => Object.freeze({outil: "tout-parts", tout: calcul.f3.tout, d: calcul.f3.d, trouve: null});
  const f3Image = calcul => Object.freeze({outil: "tout-parts", tout: calcul.f3.tout, d: calcul.f3.d, trouve: Object.freeze({texte: f(calcul.reponse), vert: false})});
  const f3Phrase = calcul => fr(`Regarde : ${sansEspace(calcul.texte).replace(CASE, f(calcul.reponse))}`);
  // Les billes (Je manipule, et l'entraînement après deux erreurs) : jusqu'à
  // 30 objets, un résultat entier, jamais au niveau 3.
  const F3_BILLES_MAX = 30;
  function f3Manipulation(calcul) {
    const {d, N, unite, tout} = calcul.f3;
    if (calcul.niveau === 3 || N > F3_BILLES_MAX || !Number.isInteger(calcul.reponse)) return null;
    const calc = `1/${d} de ${tout}`;
    return Object.freeze({
      outil: "billes", n: N, d, tout, texte: calc,
      consigne: fr(`Partage en ${d} parts égales : touche le tas.`),
      consigneFin: fr(`1/${d}, c’est une part sur ${d}.`), refus: null,
      // (Lot 7e-2 : en mots, sans signe =.)
      traces: Object.freeze([Object.freeze({apres: N / d, attente: `${calc}, c’est …`, texte: `${calc}, c’est ${f(calcul.reponse)} ${unite}.`})])
    });
  }
  const f3Difficulte = calcul => calcul.f3.d * 1000 + calcul.f3.N;
  const F3_ERREURS = Object.freeze([
    Object.freeze({
      c: 1, nom: "multiplié au lieu de partager",
      test: sauf((calcul, reponse) => calcul.donnees.fois > 0 && memeNombre(reponse, calcul.donnees.fois)),
      retour: (calcul, reponse) => fr(`${f(reponse)} : tu as multiplié. 1/${calcul.f3.d} de ${calcul.f3.tout}, c’est une seule part quand on partage ${calcul.f3.tout} en parts égales.`),
      gras: 0
    }),
    Object.freeze({
      c: 2, nom: "la moitié au lieu de la part",
      test: sauf((calcul, reponse) => calcul.donnees.moitie > 0 && memeNombre(reponse, calcul.donnees.moitie)),
      retour: (calcul, reponse) => fr(`${f(reponse)}, c’est la moitié de ${f(calcul.f3.N)}. Ici, on cherche 1/${calcul.f3.d}.`),
      gras: 0
    }),
    Object.freeze({
      c: 3, nom: "les autres parts, pas celle qu’on cherche",
      test: sauf((calcul, reponse) => calcul.donnees.restants > 0 && memeNombre(reponse, calcul.donnees.restants)),
      retour: (calcul, reponse) => fr(`${f(reponse)}, c’est ce qui reste quand on enlève 1/${calcul.f3.d}. On cherche 1/${calcul.f3.d} : une seule part.`),
      gras: 0
    }),
    Object.freeze({
      c: 4, nom: "le reste oublié",
      test: sauf((calcul, reponse) => calcul.donnees.oubli > 0 && memeNombre(reponse, calcul.donnees.oubli)),
      retour: (calcul, reponse) => {
        const {d, N, unite} = calcul.f3;
        const reste = N - Math.floor(N / d) * d;
        return fr(`${f(reponse)} : tu as oublié le reste. ${f(N)} ÷ ${d} = ${Math.floor(N / d)}, reste ${reste} : ${reste} ${unite} se partage${reste > 1 && F3_OBJETS.includes(unite) ? "nt" : ""} aussi en ${d}.`);
      },
      gras: 0
    }),
    Object.freeze({
      c: 5, nom: "le reste écrit après la virgule",
      test: sauf((calcul, reponse) => calcul.donnees.apres > 0 && memeNombre(reponse, calcul.donnees.apres)),
      retour: (calcul, reponse) => {
        const {d, N, unite} = calcul.f3;
        const reste = N - Math.floor(N / d) * d;
        return fr(`${f(reponse)} : le reste ne s’écrit pas après la virgule. Le reste, ${reste} ${unite}, se partage aussi en ${d} parts égales.`);
      },
      gras: 0
    })
  ]);

  // Lot 7e-2 (choix de Gwenaël du 15/11) : J'écris en mots, sans signe =.
  // « Je partage 500 g en 10 parts égales. » puis « Une part, c'est □ g. »
  // et « 1/10 de 500 g, c'est □ g. » ; un quart (niveau 3) : la moitié de
  // la moitié (« La moitié de 14 L, c'est □ L. », « La moitié de 7 L… »).
  // null : ce calcul ne se fait pas ainsi (un reste, un quart qui
  // demanderait des centièmes). Les mots d'une étape gardent leurs espaces
  // insécables : un morceau par colonne, la case sous la case.
  function f3EnMots(calcul, quart = false) {
    const {d, N, unite} = calcul.f3;
    const lie = texte => texte.replace(/ /g, "\u00a0");
    const avec = x => `${f(x)}\u00a0${unite}`;
    const fin = `? ${lie(`${unite}.`)}`;
    if (quart) {
      if (d !== 4 || N % 4 !== 2) return null;
      return {
        consigneEcris: "Un quart, c’est la moitié de la moitié.",
        etapes: [[`${lie(`La moitié de ${avec(N)}, c’est`)} ${fin}`, N / 2], [`${lie(`La moitié de ${avec(N / 2)}, c’est`)} ${fin}`, exact(N / 4)],
          [`${lie(`1/4 de ${avec(N)}, c’est`)} ${fin}`, exact(N / 4)]]
      };
    }
    if (N % d) return null;
    return {
      consigneEcris: `Je partage ${avec(N)} en ${d} parts égales.`,
      etapes: [[`${lie("Une part, c’est")} ${fin}`, N / d], [`${lie(`1/${d} de ${avec(N)}, c’est`)} ${fin}`, N / d]]
    };
  }

  // J'apprends de F3 : les billes sur le premier calcul (niveaux 1 et 2),
  // (Dans les étapes de J'écris, « 500 g » s'écrit avec une espace
  // insécable : un seul morceau, et le « = » reste sous le « = ».)
  // le schéma sur le deuxième, J'écris sur le troisième — la part cherchée
  // se remplit, en vert, à la dernière étape.
  function f3Apprends({manipule = null, represente, ecris, consigne, consigneEcris, etapes, bilan}) {
    const premier = manipule || represente;
    const n = etapes.length;
    const dessin = (k, revele) => Object.freeze(Object.assign({}, f3Aide(ecris), revele || k >= n ? {trouve: Object.freeze({texte: f(ecris.reponse), vert: !revele})} : {}));
    return Object.freeze({
      exemple: Object.freeze({texte: premier.texte.replace(CASE, "?"), reponse: premier.reponse}),
      manipule: manipule ? f3Manipulation(manipule) : null,
      represente: Object.freeze({
        outil: "tout-parts", consigne: fr(consigne),
        texte: represente.texte, reponse: represente.reponse,
        image: f3Aide(represente),
        solution: Object.freeze({image: f3Image(represente), phrase: f3Phrase(represente)})
      }),
      ecris: ecrisAvecDessins({
        consigne: fr(consigneEcris),
        etapes: etapesEcris(etapes), reponse: ecris.reponse,
        solution: Object.freeze({image: f3Image(ecris), phrase: f3Phrase(ecris)})
      }, {dessins: Object.freeze(Array.from({length: n + 1}, (_, k) => dessin(k, false))), revele: dessin(n, true)}),
      bilan: frBilan(bilan),
      image: f3Image(manipule || represente),  // lot 3a : le calcul montré
      // Lot 3a : les calculs de « On te montre » et de J'écris (pour les tests).
      calculs: Object.freeze({montre: manipule || represente, ecris: ecris}),
      textes: Object.freeze([...(manipule ? [manipule.texte] : []), represente.texte, ecris.texte])
    });
  }

  const F3 = {
    id: "F3", nom: "Fraction unitaire d’une quantité", exemple: "1/4 de 12 billes",
    famille: "F", construit: true,
    aide_entraine: "tout-parts",
    erreurs: F3_ERREURS, image: f3Image, aide: f3Aide, phrase: f3Phrase, manipulation: f3Manipulation, difficulte: f3Difficulte,
    niveaux: [
      {
        n: 1, titre: "demi, quart, dixième", nom: "Demi, quart, dixième d’une quantité", palier: 2, type: "P",
        composer: vivierNiveau(F3_VIVIERS[1], [4, 3, 3]),
        imposes: [f3(1, "1/2 de 14 billes"), f3(1, "1/10 de 80 m")],
        apprends: f3Apprends({
          manipule: pourApprendre(f3Calcul(1, 4, 12, "billes")),
          represente: pourApprendre(f3Calcul(1, 2, 18, "billes")),
          ecris: pourApprendre(f3Calcul(1, 10, 500, "g")),
          consigne: "18\u00a0billes partagées en 2 parts égales.",
          // Lot 7e-2 (choix de Gwenaël) : en mots — « Je partage 500 g en
          // 10 parts égales : une part, c'est … g. »
          ...f3EnMots(f3Calcul(1, 10, 500, "g")),
          bilan: "Pour 1/4 de 12\u00a0billes, je partage en 4 parts égales : une part, c’est 3\u00a0billes."
        })
      },
      {
        n: 2, titre: "tiers, cinquième, sixième…", nom: "Tiers, cinquième… d’une quantité", palier: 2, type: "P",
        composer: vivierNiveau(F3_VIVIERS[2], [3, 3, 2, 2]),
        imposes: [f3(2, "1/3 de 21 billes"), f3(2, "1/8 de 40 L")],
        apprends: f3Apprends({
          manipule: pourApprendre(f3Calcul(2, 3, 18, "billes")),
          represente: pourApprendre(f3Calcul(2, 5, 60, "kg")),
          ecris: pourApprendre(f3Calcul(2, 6, 42, "€")),
          consigne: "60\u00a0kg partagés en 5 parts égales.",
          ...f3EnMots(f3Calcul(2, 6, 42, "€")),
          bilan: "Pour 1/3 de 18\u00a0billes, je partage en 3 parts égales : une part, c’est 6\u00a0billes."
        })
      },
      {
        n: 3, titre: "résultat non entier", nom: "Part d’une quantité\u00a0: résultat décimal", palier: 2, type: "P", virgule: true,
        composer: vivierNiveau(F3_VIVIERS[3], [3, 3, 2, 2]),
        imposes: [f3(3, "1/4 de 6 kg"), f3(3, "1/5 de 8 €")],
        apprends: f3Apprends({
          represente: pourApprendre(f3Calcul(3, 4, 10, "m")),
          ecris: pourApprendre(f3Calcul(3, 4, 14, "L")),
          consigne: "Un quart, c’est la moitié de la moitié.",
          // Lot 7e-2 (choix de Gwenaël, exemple de réussite du CM1, p. 6) :
          // 1/4 de 10 m, la moitié puis la moitié (10 m → 5 m → 2,5 m).
          ...f3EnMots(f3Calcul(3, 4, 14, "L"), true),
          bilan: "Pour 1/4 de 10\u00a0m, je prends la moitié de la moitié : 10\u00a0m → 5\u00a0m → 2,5\u00a0m."
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
      // (Lot « couverture » : 4 niveaux → 2 ; « 524 − 44 + 176 − 56 »
      // relève du cycle 4, il sort.)
      {n: 1, titre: "entiers, trois ou quatre termes", palier: 3, type: "P", exemple: "27 + 48 + 73"},
      {n: 2, titre: "avec des décimaux", palier: 4, type: "P", exemple: "3,7 + 0,3 + 2,5 + 1,2"}
    ]),
    M4,
    M1,
    M2,
    M3,
    M5,
    M6,
    M13,
    M7,
    M8,
    reserve("M9", "Distributivité : retrancher", "45 × 9", [
      // (Lot « couverture » : 3 niveaux → 2.)
      {n: 1, titre: "× 9, × 19", palier: 4, type: "P", exemple: "45 × 9"},
      {n: 2, titre: "× 99, × 98", palier: 4, type: "P", exemple: "7 × 99"}
    ]),
    M10,
    reserve("M11", "Quotient et reste", "17 = 3 × 5 + ?", [
      {n: 1, titre: "tables de 2 à 5", palier: 3, type: "P", exemple: "17 = 3 × 5 + ?"},
      {n: 2, titre: "toutes les tables", palier: 3, type: "P", exemple: "47 = 6 × ? + 5"}
    ]),
    M12,
    C1,
    C3,
    reserve("C4", "Remonter un calcul", "(2 × ?) − 5 = 23", [
      {n: 1, titre: "deux opérations", palier: 3, type: "P", exemple: "(2 × ?) − 5 = 23"},
      {n: 2, titre: "réponse décimale", palier: 3, type: "P", exemple: "8 + (2 × ?) = 11"}
    ]),
    D1,
    D2,
    D3,
    D4,
    D5,
    D6,
    D7,
    D8,
    D9,
    F2,
    F1,
    F3,
    reserve("F4", "Fraction d’une quantité", "2/3 de 12 œufs", [
      {n: 1, titre: "résultat entier", palier: 3, type: "P", exemple: "2/3 de 12 œufs"},
      {n: 2, titre: "résultat décimal", palier: 4, type: "P", exemple: "3/4 de 10 m"}
    ]),
    F5,
    F6,
    F8,
    reserve("F9", "Dénominateurs multiples", "3/2 + 7/4", [
      // (Lot « couverture » : CM1 — 3/2 + 7/4, 1/3 + 1/6.)
      {n: 1, titre: "l’un est le double de l’autre", palier: 2, type: "P", exemple: "3/2 + 7/4"},
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
      niveau.imposes ? {imposes: Object.freeze(niveau.imposes.slice())} : {},
      niveau.apprends ? {apprends: representeAEtapes(niveau.apprends)} : {}))))
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

  // ------------------------------------------------------------------ les sortes
  //
  // Lot 1 « la séance » (12/11/2026, règle des « sortes », décidée par Claude
  // après la question de Gwenaël « un calcul, ça suffit ? ») : chaque niveau
  // déclare ses SORTES de calculs, 2 à 4, du plus simple au plus dur, avec un
  // nom court (« × 10 », « × 100 », « × 1 000 »). Une sorte n'est pas une
  // écriture (`forme`) : « 37 + □ = 100 » et « □ + 37 = 100 » sont la même
  // sorte quand la méthode est la même ; « + 19 » et « + 39 » en sont deux.
  //  - le test « Tu connais déjà ? » prend un calcul par sorte, du plus
  //    simple au plus dur (3 au moins) ; après un faux, un de la sorte ratée ;
  //  - Je m'entraîne n'est réussi que si les justes « seul » de la fin
  //    couvrent toutes les sortes ;
  //  - Mes calculs du jour : la sorte change d'un retour à l'autre.
  // Chaque sorte : [nom, test(calcul, donnees)] ; un calcul est de la
  // première sorte dont le test répond vrai (la dernière prend le reste).
  const toutes = () => true;
  const formeEst = (...formes) => calcul => formes.includes(calcul.forme);
  const decimales = x => { const t = String(x); return t.includes(".") ? t.split(".")[1].length : 0; };
  const centaineFranchie = (a, b) => Math.floor(a / 100) !== Math.floor(b / 100);
  const parFormes = (...paires) => paires.map(([nom, ...formes], i) => [nom, i === paires.length - 1 ? toutes : formeEst(...formes)]);
  const SORTES = Object.freeze({
    "A1-1": parFormes(["a + b", "somme"], ["a + □ = 10", "complement"], ["10 = a + □", "complement-egal"]),
    // (Lot 3b : les presque-doubles, une sorte à part — décision 4 du lot 3.)
    "A1-2": [["un nombre est 10", (c, d) => d.n === 10 || d.d === 10], ["on passe 10", (c, d) => Math.abs(d.n - d.d) !== 1],
      ["les deux nombres se suivent", toutes]],
    "A1-3": parFormes(["a − b", "difference"], ["a + □ = b", "complement"], ["b = a + □", "complement-egal"]),
    "A10-1": [["jusqu’à la dizaine", (c, d) => d.m % 10 === 0], ["à 2 chiffres", (c, d) => d.n < 100], ["à 3 chiffres", toutes]],
    "A11-1": [["jusqu’à la dizaine", (c, d) => d.m % 10 === 0], ["à 2 chiffres", (c, d) => d.n < 100], ["à 3 chiffres", toutes]],
    "A10-2": [["à 2 chiffres", (c, d) => d.n < 100], ["à 3 chiffres", toutes]],
    "A11-2": [["depuis une dizaine", (c, d) => d.n % 10 === 0], ["à 2 chiffres", (c, d) => d.n < 100], ["à 3 chiffres", toutes]],
    "A10-3": [["jusqu’à la centaine", (c, d) => d.m % 100 === 0], ["après la centaine", (c, d) => d.m < 1000], ["après 1 000", toutes]],
    "A11-3": [["depuis une centaine", (c, d) => d.n % 100 === 0], ["à 3 chiffres", (c, d) => d.n < 1000], ["à 4 chiffres", toutes]],
    "M1-1": parFormes(["double", "double"], ["moitié", "moitie"], ["double de □", "trou-double"], ["moitié de □", "moitie-de-trou"]),
    "A2-1": [["à 2 chiffres", (c, d) => d.a < 100], ["à 3 chiffres", toutes]],
    "A3-1": [["+ dizaines", (c, d) => c.forme === "somme" && Math.abs(d.d) < 100], ["− dizaines", (c, d) => c.forme === "difference" && Math.abs(d.d) < 100],
      ["+ centaines", (c, d) => c.forme === "somme"], ["− centaines", toutes]],
    "M4-1": parFormes(["a × b", "produit"], ["a × □ = c", "trou-facteur"], ["c = □ × b", "trou-egal"], ["c ÷ b", "division"]),
    "A2-2": [["dizaines", (c, d) => d.a % 10 === 0], ["en 5", toutes]],
    "M2-1": [["× 10", (c, d) => d.p === 10], ["× 100", toutes]],
    "A4-1": [["+ 1 dizaine et des unités", (c, d) => d.d < 20], ["+ des dizaines et des unités", toutes]],
    "A4-2": [["sans 9 aux unités", (c, d) => d.n % 10 !== 9 && d.d % 10 !== 9], ["un nombre en 9", toutes]],
    "A5-1": [["en passant la centaine", (c, d) => centaineFranchie(d.n, d.n + d.a)], ["à 2 chiffres", (c, d) => d.n < 100], ["à 3 chiffres", toutes]],
    "A6-1": [["en passant la centaine", (c, d) => centaineFranchie(d.n, d.n - d.a)], ["à 2 chiffres", (c, d) => d.n < 100], ["à 3 chiffres", toutes]],
    "M4-2": parFormes(["a × b", "produit"], ["a × □ = c", "trou-facteur"], ["c = □ × b", "trou-egal"], ["c ÷ b", "division"]),
    "A2-3": parFormes(["a + □ = 100", "complement", "complement-gauche"], ["100 − a", "difference"]),
    "A3-2": parFormes(["+ dizaines", "somme"], ["− dizaines", "difference"]),
    "F8-1": parFormes(["a/b + c/b", "somme"], ["deux fois la même", "fois"], ["parts une à une", "unitaires"], ["a/b − c/b", "difference"]),
    "A7-1": [["à 2 chiffres", (c, d) => d.n < 100], ["à 3 chiffres", toutes]],
    "M1-2": parFormes(["double", "double", "double-fois"], ["moitié", "moitie"]),
    "F8-2": parFormes(["1 − a/b", "un-moins"], ["a/b + □ = 1", "complement"], ["1 − a/b − c/b", "un-moins-plusieurs"]),
    "A5-2": [["+ 19", (c, d) => d.a === 19], ["+ 29", (c, d) => d.a === 29], ["+ 39", toutes]],
    "A6-2": [["− 19", (c, d) => d.a === 19], ["− 29", (c, d) => d.a === 29], ["− 39", toutes]],
    "M3-1": [["petit produit", (c, d) => d.t < 10], ["produit à 2 chiffres", toutes]],
    "A7-2": [["depuis une dizaine", (c, d) => d.n % 10 === 0], ["à 2 chiffres", (c, d) => d.n < 100], ["à 3 chiffres", toutes]],
    "M5-1": parFormes(["a × b", "produit"], ["a × □ = c", "trou-facteur"], ["c = a × □", "trou-egal"], ["c ÷ b", "division"]),
    "A4-3": [["les unités font 10", (c, d) => (d.n % 10) + (d.d % 10) === 10], ["sans retenue aux unités", (c, d) => (d.n % 10) + (d.d % 10) < 10],
      ["avec retenue aux unités", toutes]],
    "M6-1": [["jusqu’à 25", (c, d) => d.n <= 25], ["au-delà de 25", toutes]],
    "A8-1": [["écart de 1 à 3", (c, d) => d.d <= 3], ["écart de 4 et plus", toutes]],
    // (Lot 3b, règle du 12/11 : le dessin jusqu'à 12 parts, puis le calcul.)
    "A5-3": [["+ 8", (c, d) => d.a === 8], ["+ 18", (c, d) => d.a === 18], ["+ 28", (c, d) => d.a === 28], ["+ 38", toutes]],
    "M8-1": [["× 11", (c, d) => d.b === 11], ["× 12 à 19", toutes]],
    "M1-3": parFormes(["double", "double"], ["moitié", "moitie", "division"]),
    "M6-2": [["jusqu’à 25", (c, d) => d.n <= 25], ["au-delà de 25", toutes]],
    "M8-2": [["jusqu’à 50", (c, d) => d.b <= 50], ["au-delà de 50", toutes]],
    "A2-4": parFormes(["a + □ = 1 000", "complement", "complement-gauche"], ["1 000 − a", "difference"]),
    "A6-3": [["− 8", (c, d) => d.a === 8], ["− 18", (c, d) => d.a === 18], ["− 28", (c, d) => d.a === 28], ["− 38", toutes]],
    "D1-1": parFormes(["a/10 en décimal", "fraction"], ["a + b/10", "entier-fraction"], ["décimal en dixièmes", "numerateur"]),
    "M2-2": parFormes(["a × 10", "produit"], ["a ÷ 10", "division"], ["□ × 10 = b", "trou-nombre"], ["a × □ = b", "trou-facteur"]),
    "F2-1": parFormes(["demis, quarts égaux", "egale"], ["a + b", "somme"], ["1 − a", "difference"]),
    // (Lot 3a : passer le millier ; les sortes lisent le saut sans son signe.)
    "A3-3": [["+ dizaines", (c, d) => c.forme === "somme" && Math.abs(d.d) < 100], ["+ centaines", (c, d) => c.forme === "somme"],
      ["− dizaines", (c, d) => Math.abs(d.d) < 100], ["− centaines", toutes]],
    "D2-1": [["1 décimale", (c, d) => decimales(d.n) <= 1], ["2 décimales", toutes]],
    "D3-1": [["un entier", (c, d) => Number.isInteger(d.m)], ["un décimal", toutes]],
    "M7-1": [["jusqu’à 50", (c, d) => d.n <= 50], ["au-delà de 50", toutes]],
    "A7-3": [["depuis une dizaine", (c, d) => d.n % 10 === 0], ["en passant la centaine", toutes]],
    "F1-1": parFormes(["fraction en décimal", "decimal"], ["le dénominateur", "denominateur"]),
    "A2-5": parFormes(["jusqu’à une centaine", "complement", "complement-gauche"], ["la soustraction", "difference"]),
    "M3-2": [["× centaines", (c, d) => Math.max(d.x, d.y) < 1000], ["× milliers", toutes]],
    "D1-2": parFormes(["a/100 en décimal", "fraction"], ["a + b/100", "entier-fraction"], ["dixièmes + centièmes", "fractions"], ["décimal en centièmes", "numerateur"]),
    "F3-1": parFormes(["1/2 de", "part-2"], ["1/4 de", "part-4"], ["1/10 de", "part-10"]),
    "A4-4": [["sans retenue", (c, d) => (d.n % 10) + (d.d % 10) < 10], ["retenue aux unités", toutes]],
    "M7-2": [["un nombre pair", (c, d) => d.n % 2 === 0], ["un nombre impair", toutes]],
    "D4-1": parFormes(["on ajoute", "plus"], ["on ajoute une fraction", "plus-fraction"], ["on retire", "moins"]),
    "F3-2": parFormes(["1/3 de", "part-3"], ["1/5 de", "part-5"], ["1/6 de", "part-6"], ["1/8 de", "part-8"]),
    "C1-1": parFormes(["a × (b − c)", "fois-par"], ["(b − c) × a", "par-fois"], ["a − (b − c)", "moins-par"]),
    "A8-2": [["autour d’une centaine", (c, d) => c.forme === "ecart" && Math.max(d.n, d.m) < 1000], ["autour d’un millier", formeEst("ecart")],
      ["a − □ = b", toutes]],
    "F5-1": [["1 + □", (c, d) => d.quotient === 1], ["2 et plus", toutes]],
    "M8-3": [["× 11", (c, d) => c.forme !== "trou" && (d.a === 11 || d.b === 11)], ["× 12, × 21, × 31", (c, d) => c.forme !== "trou"], ["à compléter", toutes]],
    "C3-1": parFormes(["a = b + □", "egal"], ["□ − b = a", "depart"], ["a − □ = b", "retire"], ["un calcul de l’autre côté", "retire-produit", "difference-quotient"]),
    "M10-1": parFormes(["2 × a × 5", "regrouper"], ["on coupe un facteur", "couper", "couper-gauche"], ["2 × a × 5 = a × □", "trou-regroupe"]),
    "F3-3": parFormes(["1/2 de", "part-2"], ["1/4 de", "part-4"], ["1/5 de", "part-5"], ["1/10 de", "part-10"]),
    "C3-2": parFormes(["a + b = c + □", "egalite-somme"], ["a − b = □ − c", "egalite-difference"]),
    "F5-2": parFormes(["a + b/c = □/c", "recomposer"], ["a/b = □ + c/b", "entier"], ["encadrer", "encadrer", "encadrer-bas"]),
    "M12-1": [["dizaines ÷ a", (c, d) => c.forme === "division" && d.n < 1000], ["centaines ÷ a", formeEst("division")], ["a × □ = b", toutes]],
    "A5-4": [["+ …9", (c, d) => d.a % 10 === 9], ["+ …8", toutes]],
    "A6-4": [["− …9", (c, d) => d.a % 10 === 9], ["− …8", toutes]],
    "D2-2": [["× 100", (c, d) => d.p === 100], ["× 1 000", toutes]],
    "D3-2": [["÷ 100", (c, d) => d.p === 100], ["÷ 1 000", toutes]],
    "M3-3": [["dizaines × dizaines", (c, d) => c.forme === "produit" && Math.max(d.x, d.y) < 100], ["centaines, milliers", formeEst("produit")], ["a × □ = b", toutes]],
    "F2-2": parFormes(["a + b", "somme"], ["1 − a", "difference"], ["a + □ = b", "complement"]),
    "D1-3": parFormes(["a/1 000 en décimal", "fraction"], ["a + b/1 000", "entier-fraction"], ["en désordre", "fractions"], ["décimal en millièmes", "numerateur"]),
    "D2-3": [["× 100", (c, d) => d.p === 100], ["× 1 000", toutes]],
    "D3-3": [["÷ 10", (c, d) => d.p === 10], ["÷ 100", (c, d) => d.p === 100], ["÷ 1 000", toutes]],
    "F1-2": parFormes(["fraction en décimal", "decimal"], ["décimal en fraction", "numerateur"], ["en centièmes", "centiemes"], ["le dénominateur", "denominateur"]),
    "M7-3": [["un nombre pair", (c, d) => d.n % 2 === 0], ["un nombre impair", toutes]],
    "D4-2": parFormes(["on ajoute", "plus"], ["on ajoute une fraction", "plus-fraction"], ["on retire", "moins"]),
    "F6-1": parFormes(["a/b = □/c", "multiplier"], ["□/c = a/b", "multiplier-gauche"]),
    "F6-2": parFormes(["a/b = □/c", "diviser"], ["a/b = c/□", "diviser-den"], ["multiplier", "multiplier"]),
    "A3-4": [["dizaines", (c, d) => Math.abs(d.d) < 100], ["centaines", (c, d) => Math.abs(d.d) < 1000], ["milliers", toutes]],
    "D4-3": parFormes(["on ajoute un décimal", "plus"], ["on ajoute une fraction", "plus-fraction"]),
    "C1-2": parFormes(["(a − b) × (c + d)", "fois-paires"], ["(a × b) − (c + d)", "moins-paires"]),
    "M10-2": parFormes(["4 × a × 25", "regrouper"], ["on coupe un facteur", "couper", "couper-gauche"], ["4 × a × 25 = a × □", "trou-regroupe"]),
    // Lot 7e-2 : au-delà de 1 (5/3 + 2/3, 7/5 − 3/5), au CM1.
    "F8-3": parFormes(["a/b + c/b", "somme"], ["a/b − c/b", "difference"], ["entier − a/b", "entier-moins"], ["a/b − entier", "moins-entier"]),
    "F6-3": parFormes(["a/b = c/□", "denominateur"], ["a/□ = c/d", "denominateur-gauche"]),
    "C3-3": parFormes(["a + b = □ + c", "egalite-somme-grande"], ["a − b = □ − c", "egalite-difference-grande"]),
    "M12-2": [["dividende à 2 chiffres", (c, d) => c.forme === "division" && d.n < 100], ["dividende à 3 chiffres", formeEst("division")], ["a × □ = b", toutes]],
    "C1-3": parFormes(["a × (b − (c + d))", "fois-emboite"], ["a − (b × (c − d))", "moins-emboite"]),
    "D2-4": parFormes(["on cherche le nombre", "trou-nombre", "trou-nombre-gauche"], ["on cherche par combien", "trou-facteur"], ["l’égalité à l’envers", "trou-egal"]),
    "F1-3": parFormes(["fraction en décimal", "decimal"], ["décimal en fraction", "numerateur"], ["en centièmes", "centiemes"], ["le dénominateur", "denominateur"]),
    "M10-3": [["jusqu’à 50", (c, d) => d.xy <= 50], ["au-delà de 50", toutes]],
    "M12-3": parFormes(["a ÷ b", "division"], ["a × □ = b", "trou-facteur"]),
    // Lot 7a : D5, D6, D7.
    "D5-1": D5_SORTES, "D5-2": D5_SORTES,
    "D6-1": D6_SORTES[1], "D6-2": D6_SORTES[2], "D6-3": D6_SORTES[3],
    "D7-1": D7_SORTES[1], "D7-2": D7_SORTES[2], "D7-3": D7_SORTES[3],
    // Lot 7b : D8, D9, M13 (les familles du rapport de Codex du 14/11).
    "D8-1": parFormes(["moitié de n", "moitie", "division"], ["2 × □ = n", "trou-double"]),
    "D8-2": parFormes(["double", "double", "double-fois"], ["moitié", "moitie", "division"]),
    "D8-3": [["double", formeEst("double", "double-fois")], ["moitié aux centièmes", (c, d) => !d.zero], ["moitié qui fait des centièmes", toutes]],
    "D9-1": [["chiffre de droite pair", (c, d) => dernierChiffre(d.n) % 2 === 0], ["chiffre de droite impair", toutes]],
    "D9-2": [["dixièmes", (c, d) => decimalesDe(d.n) === 1], ["centièmes", toutes]],
    "M13-1": parFormes(["a ÷ 4", "division"], ["4 × □ = b", "trou-facteur"]),
    "M13-2": parFormes(["a ÷ 8", "division"], ["8 × □ = b", "trou-facteur"]),
    "M13-3": [["÷ 4", (c, d) => d.d === 4], ["÷ 8", toutes]]
  });

  // Les cartes « par cœur » (lot 2 « J'apprends en une étape », 12/11/2026,
  // décision 8 de « fonctionnement 3 », planche 5 ; les 15 niveaux « par
  // cœur » choisis par Gwenaël) : À retenir montre TOUS les calculs du
  // niveau sur une seule carte, à la place du dessin. Une carte : un titre et
  // des blocs — un tableau (`table` : la première ligne et la première
  // colonne sont les en-têtes ; `ligneTete` : seulement la première ligne)
  // ou une liste de calculs (`liste`, en `colonnes`). Contenu de leçon : à revoir au lot 3 « Les leçons ».
  const rangee = (a, b) => Array.from({length: b - a + 1}, (_, i) => a + i);
  const tableFois = (lignes, colonnes) => [["×", ...colonnes], ...lignes.map(l => [l, ...colonnes.map(c => l * c)])];
  const tablePlus = (lignes, colonnes) => [["+", ...colonnes], ...lignes.map(l => [l, ...colonnes.map(c => l + c)])];
  const paires10 = avecZero => rangee(avecZero ? 0 : 1, avecZero ? 10 : 9).map(a => `${a} + ${10 - a} = 10`);
  const nb = formaterNombre;
  const gele = objet => { Object.values(objet).forEach(v => { if (v && typeof v === "object") gele(v); }); return Object.freeze(objet); };
  // Lot 7e-2 (choix de Gwenaël du 15/11 ; inventaire dans la notice du
  // lot) : une carte a deux parties. « Je le sais par cœur » : le socle des
  // textes (calcul mental CP-CM2, p. 3-10 ; exemples de réussite CM1 p. 8,
  // CM2 p. 8). « Je le retrouve » : ce que l'appli demande en plus, avec le
  // petit calcul qui y mène (`chemin`, écrit au-dessus de son bloc). Un bloc
  // porte sa partie (`partie`) ; une carte sans extension n'a qu'une partie
  // (sans titre). « Différences et trous jusqu'à 20 » et « Compléments à la
  // dizaine » sont des procédures (calcul mental CP, p. 3 et 4) : plus de
  // carte. Puis « Compléments à 100 : dizaines » aussi (choix de Gwenaël
  // du 15/11 après la planche : aucun texte ne les liste) — 12 cartes.
  const coeurDe = blocs => blocs.map(bloc => Object.assign({partie: "coeur"}, bloc));
  const retrouveDe = blocs => blocs.map(bloc => Object.assign({partie: "retrouve"}, bloc));
  const doubles = ligne => ({table: [ligne, ligne.map(n => 2 * n)], ligneTete: true});
  const PAR_COEUR = gele({
    // Lot 3b (écarts relevés par le 3a) : chaque carte montre tous les
    // calculs que le niveau demande — les sommes jusqu'à 10 (4 + 3), « + 10 »,
    // les différences de 1 (7 − 6) ; × 1 et × 10 aux tables ; les sommes
    // de quarts qui passent 1 ; les centièmes, millièmes, dixièmes.
    // (A1-1 : la table jusqu'à 10, les paires qui font 10 en couleur.)
    "A1-1": {titre: "Les sommes jusqu’à 10", blocs: coeurDe([{liste: ["En orange, les paires qui font 10."], colonnes: 1},
      {table: tablePlus(rangee(0, 10), rangee(0, 10)).map((l, i) => l.map((v, j) => (!i || !j ? v : v > 10 ? "" : v === 10 ? {texte: "10", fort: true} : v)))}])},
    "A1-2": {titre: "La table d’addition", blocs: coeurDe([{table: tablePlus(rangee(1, 10), rangee(1, 10))}])},
    "M1-1": {titre: "Sous chaque nombre, son double", blocs: coeurDe([
      {table: [rangee(1, 10), rangee(1, 10).map(n => 2 * n)], ligneTete: true},
      {table: [rangee(11, 20), rangee(11, 20).map(n => 2 * n)], ligneTete: true},
      // (Lot 3a : 25, 35, 45 aussi — l'appli demande la moitié de 50, 70, 90.)
      {table: [[25, 30, 35, 40, 45, 50], [50, 60, 70, 80, 90, 100]], ligneTete: true}])},
    // Lot 3a : tous les doubles que l'appli demande (70, les centaines, 750,
    // 1 000…), comme la carte du niveau 1 : sous chaque nombre, son double.
    // Lot 7e-2 : le socle du CE2 (calcul mental, p. 10), puis le reste.
    "M1-2": {titre: "Sous chaque nombre, son double", blocs: [
      ...coeurDe([doubles([25, 35, 45, 60, 75, 100, 150]), doubles([200, 250, 300, 400, 500, 600])]),
      ...retrouveDe([
        {chemin: `double\u00a0de\u00a0${nb(2500)}\u00a0= ${"double de 2000 + double de 500".replace(/ /g, "\u00a0").replace("2000", nb(2000))}`, ...doubles([70, 80, 90, 350, 450, 750])},
        doubles([700, 800, 900, 1000, 1500, 2500])])]},
    "M4-1": {titre: "Les tables de 2, 3, 4 et 5", blocs: coeurDe([{table: tableFois([2, 3, 4, 5], rangee(1, 10))}, {liste: ["Fois 1, le nombre ne change pas : 7 × 1 = 7"], colonnes: 1}])},
    "M4-2": {titre: "Les tables de 6, 7, 8 et 9", blocs: coeurDe([{table: tableFois([6, 7, 8, 9, 10], [6, 7, 8, 9, 10])}])},
    "M5-1": {titre: "Les repères 25, 60, 100", blocs: [
      ...coeurDe([{table: tableFois([25], rangee(2, 4))},
        {liste: ["60 = 2 × 30 = 3 × 20 = 4 × 15 = 5 × 12 = 6 × 10", "100 = 4 × 25 = 2 × 50"], colonnes: 1}]),
      ...retrouveDe([{chemin: "6 × 25 = 4 × 25 + 2 × 25 = 150", table: tableFois([25], rangee(5, 8))},
        {liste: ["100 = 5 × 20, car 5 × 2 = 10"], colonnes: 1}])]},
    "F2-1": {titre: "Demis et quarts", blocs: [
      ...coeurDe([{liste: ["1 = 2/2 = 4/4", "1/2 = 2/4", "1/2 + 1/2 = 1", "1/4 + 1/4 = 1/2", "1 − 1/2 = 1/2", "1/2 − 1/4 = 1/4"], colonnes: 2}]),
      ...retrouveDe([{liste: ["1 − 1/4 − 1/4 = 1 − 1/2 = 1/2", "1/4 + 1/4 + 1/4 + 1/4 = 4/4 = 1"], colonnes: 1}])]},
    "F2-2": {titre: "Demis et quarts, avec 3/4", blocs: [
      ...coeurDe([{liste: ["3/4 = 1/2 + 1/4", "1/4 + 1/4 + 1/4 = 3/4", "3/4 + 1/4 = 1", "1 − 1/4 = 3/4", "1 − 3/4 = 1/4", "3/4 − 1/2 = 1/4", "3/4 − 1/4 = 1/2"], colonnes: 2}]),
      ...retrouveDe([{liste: ["3/4 + 1/2 = 3/4 + 2/4 = 5/4", "3/4 + 3/4 = 6/4 = 3/2"], colonnes: 1}])]},
    "F1-1": {titre: "Dixièmes et centièmes", blocs: [
      ...coeurDe([{liste: ["1/10 = 0,1", "1/100 = 0,01"], colonnes: 2}]),
      ...retrouveDe([
        // (Un seul petit calcul : les centièmes se retrouvent de même.)
        {chemin: "7/10 = 7 × 1/10 = 0,7", liste: rangee(2, 9).map(n => `${n}/10 = 0,${n}`), colonnes: 4},
        {liste: rangee(2, 9).map(n => `${n}/100 = 0,0${n}`), colonnes: 3}])]},
    "F1-2": {titre: "Demis, quarts, millième", blocs: [
      ...coeurDe([{liste: ["1/2 = 0,5", "1/4 = 0,25", "3/4 = 0,75", "3/2 = 1,5", "4/2 = 2", "5/2 = 2,5"], colonnes: 3},
        {liste: [`1/${nb(1000)} = 0,001`, `1/2 = 5/10 = 50/100 = 500/${nb(1000)}`, `1/4 = 25/100 = 250/${nb(1000)}`, `3/4 = 75/100 = 750/${nb(1000)}`], colonnes: 1}]),
      ...retrouveDe([{liste: ["7/2 = 3 + 1/2 = 3,5", "9/2 = 4 + 1/2 = 4,5"], colonnes: 2},
        {liste: ["3/2 = 1,5 = 15/10 = 150/100", "5/2 = 2,5 = 25/10 = 250/100"], colonnes: 1}])]},
    // Lot 7b : la moitié des impairs jusqu'à 15 (calcul mental CM2, p. 16) —
    // tout est socle.
    // (`moitie` : sous chaque nombre, sa moitié — pour les tests.)
    "D8-1": {titre: "Sous chaque nombre, sa moitié", blocs: coeurDe([{table: [[1, 3, 5, 7], [0.5, 1.5, 2.5, 3.5]], ligneTete: true, moitie: true},
      {table: [[9, 11, 13, 15], [4.5, 5.5, 6.5, 7.5]], ligneTete: true, moitie: true}])},
    "F1-3": {titre: "Cinquièmes", blocs: [
      ...coeurDe([{liste: ["1/5 = 2/10 = 20/100 = 0,2"], colonnes: 1}]),
      ...retrouveDe([{chemin: "6/5 = 6 × 1/5 = 12/10 = 1,2", liste: [2, 3, 4, 6, 7, 8, 9].map(n => `${n}/5 = ${2 * n}/10 = ${nb(n / 5)}`), colonnes: 2}])]}
  });
  // Lot 3b (demande de Gwenaël du 13/11/2026) : le petit schéma d'À retenir
  // d'un niveau « par cœur », au-dessus de sa carte — le dessin du calcul
  // montré ; des paires du boulier, seulement la sienne.
  function schemaParCoeur(apprends) {
    const image = apprends && apprends.image;
    if (!image) return null;
    // Le double sur le rekenrek (M1-1, lot 3a) : ses rangées déjà poussées.
    const manipule = apprends.manipule;
    if (manipule && manipule.rangees && !(manipule.gestes || []).length) return Object.freeze({outil: "rekenrek", rangees: manipule.rangees.slice()});
    if (image.outil !== "paires") return image;
    // Des paires : seulement celle du calcul montré, en perles (une perle
    // pour 10 quand le tout est 100).
    const montre = apprends.calculs && apprends.calculs.montre;
    const cherche = montre ? [montre.reponse, image.total - montre.reponse] : [];
    const paire = image.paires.find(([a, b]) => cherche.includes(a) && cherche.includes(b));
    return Object.freeze(Object.assign({}, image, {perles: true, pas: image.total / 10, paires: Object.freeze([paire || image.paires[0]])}));
  }
  // La carte d'un niveau « par cœur » (« M4-1 »), ou null.
  function carteParCoeur(cleNiveau) {
    return Object.prototype.hasOwnProperty.call(PAR_COEUR, cleNiveau) ? PAR_COEUR[cleNiveau] : null;
  }

  // Les sortes d'un niveau (« A5-2 ») : [{n, nom}], du plus simple au plus
  // dur — et celles qu'on voit vraiment (lues sur un grand tirage : une sorte
  // déclarée que le niveau ne tire jamais est retirée). Sans déclaration, une
  // seule sorte : le niveau.
  const SORTES_VUES = new Map();
  function sortesDe(cleNiveau) {
    if (SORTES_VUES.has(cleNiveau)) return SORTES_VUES.get(cleNiveau);
    const declarees = SORTES[cleNiveau] || [];
    const trouve = niveauDe(cleNiveau);
    let liste = [];
    if (declarees.length && trouve && typeof trouve.niveau.composer === "function") {
      const vues = new Set();
      for (let graine = 1; graine <= 5; graine += 1) {
        trouve.niveau.composer(mulberry32((graine * 2654435761) >>> 0), 60, []).forEach(calcul => vues.add(sorteBrute(cleNiveau, calcul)));
      }
      liste = declarees.map(([nom], n) => ({n, nom})).filter(sorte => vues.has(sorte.n));
    }
    if (!liste.length) liste = [{n: 0, nom: ""}];
    const figee = Object.freeze(liste.map(sorte => Object.freeze(sorte)));
    SORTES_VUES.set(cleNiveau, figee);
    return figee;
  }

  function sorteBrute(cleNiveau, calcul) {
    const declarees = SORTES[cleNiveau];
    if (!declarees || !calcul) return 0;
    const donnees = calcul.donnees || {};
    const n = declarees.findIndex(([, test]) => test(calcul, donnees));
    return n < 0 ? declarees.length - 1 : n;
  }

  // La sorte d'un calcul : son numéro dans les sortes déclarées de son niveau.
  function sorteDe(calcul) {
    if (!calcul) return 0;
    return sorteBrute(`${calcul.module}-${calcul.niveau}`, calcul);
  }

  // Lot 3b « Chaque sorte annoncée » (13/11/2026, cahier du lot 3) : une
  // SORTE qui change la méthode est annoncée à l'entraînement, comme une
  // écriture nouvelle (« Nouveau : × 100, chaque chiffre glisse de 2
  // colonnes. »), et l'aide revient pour son premier calcul. Les sortes où
  // seuls les nombres grandissent ne le sont pas. Une ligne : [la sorte (son
  // nom dans SORTES) ou un test (calcul) => vrai, le texte]. Le premier
  // calcul vu d'une sorte annoncée l'annonce ; la sorte de la leçon est déjà
  // vue.
  // Fractions égales (règle du 12/11) : le dessin tant qu'il a 12 parts au
  // plus, puis le calcul « × 4 en haut et en bas ».
  const F6_PARTS_DESSIN = 12;
  const f6Parts = calcul => {
    const {a, d, k} = calcul.donnees;
    return Math.max(1, Math.ceil(a / d - 1e-9)) * k * d;
  };
  const f6Grand = calcul => calcul.module === "F6" && f6Parts(calcul) > F6_PARTS_DESSIN;
  const f6Verbe = calcul => (F6_MULTIPLIE[calcul.forme] ? "je multiplie" : "je divise");
  const glisseDe = (signe, p, colonnes) => `${signe} ${formaterNombre(p)}, chaque chiffre glisse de ${colonnes} colonnes`;
  const NOUVEAUTES = Object.freeze({
    // Lot 7e-2 (choix de Gwenaël) : la moitié en découpant, avec son dessin.
    "M1-3": [["moitié", "la moitié, je coupe en morceaux"]],
    // Lot 7e-2 : les fractions qui tombent pile sur 1 (les bases), puis
    // celles qui passent 1 (CM1), sur la barre avec l'unité marquée.
    "F8-1": [[c => c.forme === "somme" && c.lu && c.lu.cache && c.lu.cache.part === "n" && c.lu.cotes[1][0].d === 1,
      calcul => `j’arrive pile sur 1 : ${enParts(calcul.lu.cotes[0][0].d, calcul.lu.cotes[0][0].d)} font une unité`]],
    "F8-3": [["a/b + c/b", calcul => `la somme passe 1 : ${enParts(calcul.lu.cotes[0][0].d, calcul.lu.cotes[0][0].d)} font une unité`],
      ["a/b − c/b", calcul => `on part d’au-delà de 1 : ${enParts(calcul.lu.cotes[0][0].d, calcul.lu.cotes[0][0].d)} font une unité`]],
    "A1-2": [["un nombre est 10", "on ajoute 10 : le chiffre des unités ne change pas"], ["les deux nombres se suivent", "les deux nombres se suivent"]],
    "A2-2": [["en 5", "un nombre en 5 : je vais d’abord à la dizaine"]],
    // Lot 7e : arriver pile sur la dizaine change deux chiffres.
    "A10-1": [["jusqu’à la dizaine", "j’arrive pile sur la dizaine : 10 unités font 1 dizaine"]],
    "A3-1": [["+ centaines", "on ajoute des centaines : seul le chiffre des centaines change"],
      ["− dizaines", "on retire des dizaines : seul le chiffre des dizaines change"],
      ["− centaines", "on retire des centaines : seul le chiffre des centaines change"]],
    "A3-2": [["− dizaines", "on retire des dizaines : je retire d’abord les dizaines qui mènent à la centaine, puis le reste"]],
    "A3-3": [["+ centaines", "on ajoute des centaines et on passe le millier"],
      ["− dizaines", "on retire des dizaines et on passe sous le millier"],
      ["− centaines", "on retire des centaines et on passe sous le millier"]],
    "M2-1": [["× 100", glisseDe("×", 100, 2)]],
    // Lot 7e : × 1 000 arrive au CM1 (niveau 2), quelle que soit l'écriture.
    "M2-2": [[c => c.donnees && c.donnees.p === 1000, calcul => glisseDe(calcul.forme === "division" ? "÷" : "×", 1000, 3)]],
    "D2-2": [["× 1 000", glisseDe("×", 1000, 3)]],
    "D2-3": [["× 1 000", glisseDe("×", 1000, 3)]],
    "D3-2": [["÷ 1 000", glisseDe("÷", 1000, 3)]],
    "D3-3": [["÷ 100", glisseDe("÷", 100, 2)], ["÷ 1 000", glisseDe("÷", 1000, 3)]],
    "C3-1": [["un calcul de l’autre côté", "un calcul de l’autre côté : je le calcule d’abord"]],
    // Lot 7e : au niveau 2, « multiplier » au-delà de 12 parts a sa propre
    // annonce (la leçon divise).
    "F6-2": [[c => f6Grand(c) && F6_MULTIPLIE[c.forme], calcul => `trop de parts pour les dessiner : ${f6Verbe(calcul)} en haut et en bas`],
      [f6Grand, calcul => `trop de parts pour les dessiner : ${f6Verbe(calcul)} en haut et en bas`]],
    "F6-3": [[f6Grand, calcul => `trop de parts pour les dessiner : ${f6Verbe(calcul)} en haut et en bas`]],
    // Lot 7a : D6, D7.
    "D6-2": [["résultat entier", "10 dixièmes font 1 unité : le résultat n’a pas de virgule"]],
    "D7-2": [["unités et dixièmes", "les unités d’abord, puis je casse une unité"], ["d’un entier", "pas de dixièmes : je casse une unité, elle fait 10 dixièmes"]],
    "D7-3": [["unités et centièmes", "les unités d’abord, puis je casse une unité"], ["d’un entier", "pas de centièmes : je casse une unité, elle fait 100 centièmes"]],
    // Lot 7b : la moitié, annoncée avec son dessin (comme M1-3) ; 8,10 ÷ 2
    // (évaluation de 6e, Q13) : les centièmes.
    "D8-2": [["moitié", "la moitié, je coupe aussi les deux morceaux"]],
    "D8-3": [["moitié aux centièmes", "la moitié, je coupe aussi les deux morceaux"],
      ["moitié qui fait des centièmes", calcul => `${f(calcul.donnees.dec)}0, c’est ${f(calcul.donnees.dec * 100)} centièmes\u00a0: leur moitié, c’est ${f(calcul.donnees.dec * 50)} centièmes`]]
  });
  const memeNom = (a, b) => String(a).replace(/\s/g, " ") === String(b).replace(/\s/g, " ");
  // La nouveauté d'un calcul dans un niveau (« M2-1 ») : {cle, texte}, ou
  // null quand sa sorte n'est pas annoncée. Le niveau est celui du calcul,
  // ou celui qu'on donne (les calculs de la leçon sont au niveau 0).
  function nouveauteDe(calcul, cleNiveau = null) {
    if (!calcul) return null;
    const cle = cleNiveau || `${calcul.module}-${calcul.niveau}`;
    const lignes = NOUVEAUTES[cle];
    if (!lignes) return null;
    const sorte = (SORTES[cle] || [])[sorteBrute(cle, calcul)];
    const i = lignes.findIndex(([qui]) => (typeof qui === "function" ? qui(calcul) : Boolean(sorte) && memeNom(sorte[0], qui)));
    if (i < 0) return null;
    const texte = lignes[i][1];
    return Object.freeze({cle: `${cle}:${i}`, texte: `Nouveau : ${typeof texte === "function" ? texte(calcul) : texte}.`});
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

  // Du plus simple au plus dur, et les écritures nouvelles annoncées.
  // Relecture 2 (08/11/2026, choix de Gwenaël) : l'élève rapide finit son
  // entraînement en 7 calculs (2 justes avec l'outil, puis 5 sans) ; avant,
  // la première écriture prenait les 6 premières places et ses calculs les
  // plus durs arrivaient tard (A2-2 : jamais de nombre en 5 avant le 9e
  // calcul ; 31 niveaux sur 95 gardaient une écriture après le 7e). Dans
  // les 7 premiers calculs, chaque écriture arrive au moins une fois (son
  // calcul le plus simple), et la première écriture y montre toute son
  // étendue (du plus simple au plus dur, à intervalles réguliers) ; la
  // suite reste par difficulté.
  const ORDRE_SERIE = Object.freeze({fenetre: 7, premiereMini: 2});
  function etales(liste, nombre) {
    if (nombre >= liste.length) return liste.slice();
    if (nombre <= 1) return liste.slice(0, nombre);
    const rangs = new Set(Array.from({length: nombre}, (_, i) => Math.round(i * (liste.length - 1) / (nombre - 1))));
    return liste.filter((_, i) => rangs.has(i));
  }
  function ordonnerSerie(calculs) {
    const tries = calculs.map((calcul, rang) => ({calcul, rang})).sort((a, b) => difficulte(a.calcul) - difficulte(b.calcul) || a.rang - b.rang).map(({calcul}) => calcul);
    const formes = [...new Set(tries.map(calcul => calcul.forme))];
    // Relecture 2b : un calcul qu'une fiche dit « tardif » (M4-2 : × 10)
    // n'entre pas dans les premiers calculs de l'étendue.
    const tardif = calcul => { const fiche = moduleDe(calcul.module); return Boolean(fiche && typeof fiche.tardif === "function" && fiche.tardif(calcul)); };
    const premiere = tries.filter(calcul => calcul.forme === formes[0] && !tardif(calcul));
    const place = Math.max(ORDRE_SERIE.premiereMini, ORDRE_SERIE.fenetre - (formes.length - 1));
    const debut = etales(premiere, Math.min(place, premiere.length));
    const pris = new Set(debut);
    const nouvelles = formes.slice(1).map(forme => tries.find(calcul => calcul.forme === forme && !pris.has(calcul))).filter(Boolean);
    nouvelles.forEach(calcul => pris.add(calcul));
    return [...debut, ...nouvelles, ...tries.filter(calcul => !pris.has(calcul))];
  }

  // Le test d'entrée en escalier (« Tu connais déjà ? ») : une marche par
  // niveau, sans imposé. Lot 1 « la séance » : un calcul PAR SORTE, du plus
  // simple au plus dur (la sorte la plus simple d'abord, son calcul le plus
  // simple), complété jusqu'à 3 par d'autres calculs du niveau ; et, pour
  // chaque sorte, un calcul de RÉSERVE (le calcul de plus après un faux, de
  // la sorte ratée). Chaque calcul porte son niveau. Rend
  // [{niveau, calculs, reserves: {sorte: calcul}}] ; `calculs[i].sorte` dit
  // sa sorte.
  function genererTest(id, {graine = 1} = {}) {
    const fiche = moduleDe(id);
    if (!fiche || !fiche.construit) return [];
    return fiche.niveaux.map(niveau => {
      const cle = `${id}-${niveau.n}`;
      const sortes = sortesDe(cle).map(sorte => sorte.n);
      // Une sorte rare (A11-3 : les nombres à 4 chiffres) peut manquer à un
      // tirage : d'autres tirages, de la même graine, jusqu'à les avoir toutes.
      let brut = genererSerie(cle, {graine: (graine + niveau.n * 7919) >>> 0, genre: "entraine", total: 30, ordonne: false});
      for (let essai = 1; essai <= 8 && sortes.some(n => !brut.some(calcul => sorteDe(calcul) === n)); essai += 1) {
        const vus = new Set(brut.map(calcul => calcul.cle));
        brut = brut.concat(genererSerie(cle, {graine: (graine + niveau.n * 7919 + essai * 104729) >>> 0, genre: "entraine", total: 30, ordonne: false})
          .filter(calcul => !vus.has(calcul.cle) && sortes.some(n => sorteDe(calcul) === n && !brut.some(autre => sorteDe(autre) === n))));
      }
      const serie = brut
        .map((calcul, rang) => ({calcul, rang})).sort((a, b) => difficulte(a.calcul) - difficulte(b.calcul) || a.rang - b.rang)
        .map(({calcul}) => Object.assign({}, calcul, {sorte: sorteDe(calcul)}));
      const pris = new Set();
      const calculs = [];
      sortes.forEach(n => {
        // Le calcul du milieu de sa sorte : ni le plus facile ni le plus dur.
        const deLaSorte = serie.filter(calcul => calcul.sorte === n);
        const choisi = deLaSorte[Math.floor((deLaSorte.length - 1) / 2)];
        if (choisi) { calculs.push(choisi); pris.add(choisi); }
      });
      // Moins de 3 sortes tirées : on complète, de la plus simple à la plus dure.
      for (let tour = 0; calculs.length < TEST_MINIMUM && tour < sortes.length * 4; tour += 1) {
        const n = sortes[tour % sortes.length];
        const autre = serie.filter(calcul => calcul.sorte === n && !pris.has(calcul)).slice(-1)[0];
        if (autre) { calculs.push(autre); pris.add(autre); }
      }
      if (calculs.length < TEST_MINIMUM) serie.filter(calcul => !pris.has(calcul)).slice(0, TEST_MINIMUM - calculs.length).forEach(calcul => { calculs.push(calcul); pris.add(calcul); });
      calculs.sort((a, b) => sortes.indexOf(a.sorte) - sortes.indexOf(b.sorte) || difficulte(a) - difficulte(b));
      const reserves = {};
      sortes.forEach(n => {
        const reserve = serie.find(calcul => calcul.sorte === n && !pris.has(calcul)) || serie.find(calcul => !pris.has(calcul));
        if (reserve) reserves[n] = reserve;
      });
      return {niveau: niveau.n, calculs, reserves};
    });
  }
  const TEST_MINIMUM = 3;

  // Un seul calcul d'un niveau (Mes calculs du jour en tirent un par
  // compétence), tiré au hasard dans le niveau — pas le plus simple.
  // `tour` (un entier, le jour) choisit la SORTE à tour de rôle (lot 1 : de
  // retour en retour, chaque sorte revient), puis, dans la sorte, l'écriture
  // à tour de rôle (31/10 : « 37 + ? = 100 », puis « ? + 37 = 100 »…).
  // `autreQue` (le 2e calcul après un faux) : un calcul d'une autre sorte que
  // celui-là, sinon d'une autre écriture, sinon un autre calcul.
  function genererUn(cleNiveau, graine, {tour = null, autreQue = null} = {}) {
    const serie = genererSerie(cleNiveau, {graine, genre: "entraine", total: TOTAUX.P, ordonne: false});
    if (!serie.length) return null;
    if (autreQue) {
      const sorte = sorteDe(autreQue);
      return serie.find(calcul => sorteDe(calcul) !== sorte)
        || serie.find(calcul => calcul.forme !== autreQue.forme)
        || serie.find(calcul => calcul.texte !== autreQue.texte) || serie[0];
    }
    if (!Number.isInteger(tour)) return serie[0];
    const sortes = sortesDe(cleNiveau).map(sorte => sorte.n);
    const voulue = sortes[((tour % sortes.length) + sortes.length) % sortes.length];
    const dansLaSorte = serie.filter(calcul => sorteDe(calcul) === voulue);
    const liste = dansLaSorte.length ? dansLaSorte : serie;
    const formes = [...new Set(liste.map(calcul => calcul.forme))].sort();
    const forme = formes[((Math.floor(tour / sortes.length) % formes.length) + formes.length) % formes.length];
    return liste.find(calcul => calcul.forme === forme) || liste[0];
  }

  // Relecture 2b (11/11/2026, remarque 56 de Gwenaël : « tout se décale »
  // pendant la frappe) : la case de la réponse a, dès le début, la largeur
  // de la plus longue réponse DU NIVEAU — pas celle de la réponse cherchée,
  // qui dirait le nombre de chiffres. `modelesReponse` rend les FORMES des
  // réponses du niveau, chiffres remplacés par des 0, écrites comme l'appli
  // écrit un nombre (« 0 000 », « 0,000 ») : la page les mesure toutes et
  // garde la plus large. Lues sur cinq grands tirages et les imposés,
  // gardées une fois lues. `enPlus` : d'autres réponses (celles de
  // J'apprends, au niveau 0). `modeleReponse` : la plus longue (en
  // caractères), pour les tests.
  const REPONSES_DU_NIVEAU = new Map();
  function modelesReponse(cleNiveau, enPlus = []) {
    if (!REPONSES_DU_NIVEAU.has(cleNiveau)) {
      const trouve = niveauDe(cleNiveau);
      const reponses = [];
      if (trouve && typeof trouve.niveau.composer === "function") {
        for (let graine = 1; graine <= 5; graine += 1) trouve.niveau.composer(mulberry32(graine * 7919), 60, []).forEach(calcul => reponses.push(calcul.reponse));
        (trouve.niveau.imposes || []).forEach(calcul => reponses.push(calcul.reponse));
      }
      REPONSES_DU_NIVEAU.set(cleNiveau, reponses);
    }
    const formes = new Set();
    REPONSES_DU_NIVEAU.get(cleNiveau).concat(enPlus).forEach(r => {
      if (typeof r === "number" && Number.isFinite(r)) formes.add(formaterNombre(r).replace(/\d/g, "0"));
    });
    return [...formes].sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
  }
  function modeleReponse(cleNiveau, enPlus = []) {
    return modelesReponse(cleNiveau, enPlus)[0] || "";
  }

  // L'outil du début de l'entraînement, et ce qui revient après une erreur
  // (la droite dessinée avec ses sauts « + ? », le tableau avec ses « ? ») ;
  // null quand le module n'en a pas.
  // `nouveau` (lot 7e-2) : le calcul annonce une sorte nouvelle — le dessin
  // de l'annonce, quand le module en a un (M1 : la moitié découpée, chaque
  // morceau déjà coupé en deux ; reste à les réunir).
  function aideDe(calcul, {nouveau = false} = {}) {
    const fiche = calcul ? moduleDe(calcul.module) : null;
    if (nouveau && fiche && typeof fiche.aideNouveau === "function") {
      const aide = fiche.aideNouveau(calcul);
      if (aide) return aide;
    }
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
    "double-fois": "le double s’écrit avec «\u00a0×\u00a0»",
    // Modules lot 4.
    "trou-regroupe": "on cherche par quoi multiplier",
    couper: "un facteur se coupe en deux",
    "couper-gauche": "un facteur se coupe en deux",
    "moitie-double": "la moitié d’un côté, le double de l’autre",
    "par-fois": "la parenthèse est devant",
    "moins-par": "on retire ce qui est entre parenthèses",
    "moins-paires": "on retire une parenthèse",
    "fois-emboite": "une parenthèse dans la parenthèse",
    retire: "on cherche ce qu’on a retiré",
    depart: "on cherche le nombre de départ",
    "egalite-difference": "c’est une soustraction",
    "egalite-difference-grande": "c’est une soustraction",
    // Modules lot 5.
    fraction: "le nombre s’écrit en fraction",
    fractions: "des fractions à ranger",
    numerateur: "on cherche le numérateur",
    plus: "c’est une addition",
    "plus-fraction": "le nombre ajouté s’écrit en fraction",
    moins: "c’est une soustraction",
    // Modules lot 6 : les fractions.
    egale: "deux écritures de la même fraction",
    decomposer: "on cherche les parts qui restent",
    multiplier: "on cherche une fraction égale",
    diviser: "on cherche une fraction égale",
    recomposer: "on écrit tout en parts",
    entier: "on cherche l’entier",
    encadrer: "on cherche l’entier d’après",
    "encadrer-bas": "on cherche l’entier d’avant",
    "diviser-den": "la case est au dénominateur",
    denominateur: "la case est au dénominateur",
    "denominateur-gauche": "la case est à gauche, au dénominateur",
    "un-moins": "on part de 1",
    "entier-moins": "on part d’un entier",
    "moins-entier": "on retire un entier",
    // Modules lot 6b : F1, F3.
    decimal: "on cherche l’écriture décimale",
    centiemes: "on écrit en dixièmes ou en centièmes",
    "part-2": "on partage en 2",
    "part-3": "on partage en 3",
    "part-4": "on partage en 4",
    "part-5": "on partage en 5",
    "part-6": "on partage en 6",
    "part-8": "on partage en 8",
    "part-10": "on partage en 10",
    // Lot « couverture » (06/11/2026).
    "complement-gauche-egal": "la case est devant",
    "trou-egal-gauche": "la case est devant",
    "double-de-trou": "on cherche le nombre qu’on a doublé",
    "moitie-de-trou": "on cherche le nombre qu’on a coupé en deux",
    "retire-produit": "un calcul de chaque côté",
    "difference-quotient": "un calcul de chaque côté",
    decompose: "on cherche un chiffre de la décomposition",
    "plus-entier": "on ajoute un nombre entier",
    "moins-entier": "on retire un nombre entier",
    fois: "une part répétée",
    unitaires: "on ajoute des parts une à une",
    "un-moins-plusieurs": "on retire plusieurs fractions"
  });
  // La touche « , » : dans les modules à décimales, sauf quand la case est
  // un numérateur (« 0,3 = □/10 » : la réponse est un entier, règle du 05/10
  // — décision du 04/11).
  // Modules lot 6 : ni quand elle est un dénominateur (« 4/7 = 12/□ »).
  // Modules lot 6b : une touche « , » par niveau — un `virgule` sur le
  // niveau l'emporte sur celui de la fiche (F3 : le niveau 3 seulement) ;
  // le niveau est celui du calcul, ou celui qu'on donne (J'apprends : ses
  // calculs sont au niveau 0). Une étape de J'écris écrit sa case « ? ».
  function virguleDe(calcul, niveau = null) {
    const fiche = calcul ? moduleDe(calcul.module) : null;
    if (!fiche) return false;
    const texte = String(calcul.texte || "");
    const n = Number.isInteger(niveau) && niveau > 0 ? niveau : calcul.niveau;
    const leNiveau = fiche.niveaux.find(x => x.n === n);
    const virgule = leNiveau && leNiveau.virgule !== undefined ? leNiveau.virgule : fiche.virgule;
    return Boolean(virgule) && ![CASE, "?"].some(c => texte.includes(`${c}/`) || texte.includes(`/${c}`));
  }
  function virguleDuTexte(module, texte, niveau = null) {
    return virguleDe({module, texte}, niveau);
  }

  function annonceDe(calcul) {
    // (Lot « couverture » : une écriture rangée avec une autre — pour que
    // l'élève voie toutes les écritures dans ses 12 premiers calculs — peut
    // garder sa propre annonce.)
    if (calcul && calcul.annonce) return `Nouveau\u00a0: ${calcul.annonce}.`;
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


  // ------------------------------------------------------------------
  // Lot 3c « J'écris sur des calculs qui changent » (13/11/2026, décision 10
  // du lot 3) : J'écris tire son calcul à chaque fois, dans la sorte de la
  // leçon (celle du J'écris de la leçon) et dans la même écriture, jamais
  // celui de « On te montre » ni un calcul déjà vu dans la série. Une
  // recette par niveau (rangées par famille de dessin) donne, pour ce
  // calcul, la consigne en égalité, les étapes et leurs réponses, et les
  // dessins étape par étape. Sur le calcul de la leçon, chaque recette
  // redonne exactement le J'écris de la leçon (tests du lot 3c).
  const etapeT = (texte, reponse) => Object.freeze({texte, reponse});
  const f3c = formaterNombre;
  function ecrisFait({consigne = null, etapes, reponse, image, phrase}, relier) {
    return ecrisAvecDessins(Object.assign({
      etapes: Object.freeze(etapes), reponse,
      solution: Object.freeze({image, phrase})
    }, consigne ? {consigne} : {}), relier);
  }
  const avecQuestion = calcul => calcul.texte.replace(CASE, "?");

  // La droite, deux sauts par la dizaine (la centaine…) : 236 + 7 = 236 + 4 + 3.
  function recettePlus(calcul) {
    const {n, d, m} = calcul.donnees;
    const {palier, sauts} = sautsDuCalcul(calcul);
    if (palier === null || estTrou(calcul) || sauts.length !== 2) return null;
    const op = signe(d);
    const [s0, s1] = sauts.map(s => f3c(Math.abs(s)));
    return ecrisFait({
      consigne: `${f3c(n)} ${op} ${f3c(Math.abs(d))} = ${f3c(n)} ${op} ${s0} ${op} ${s1}`,
      etapes: [etapeT(`${f3c(n)} ${op} ${s0} = ${CASE}`, palier), etapeT(`${f3c(palier)} ${op} ${s1} = ${CASE}`, m), etapeT(calcul.texte, m)],
      reponse: m, image: plusImage(calcul), phrase: plusPhrase(calcul)
    }, plusDessins(calcul, 3));
  }
  // Sans passage : seul le chiffre des unités change (254 + 3 = 250 + 4 + 3).
  function recetteUnites(calcul) {
    const {n, d, m} = calcul.donnees;
    const {palier} = sautsDuCalcul(calcul);
    const u = n % 10;
    if (palier !== null || estTrou(calcul) || u === 0 || u + d < 0 || u + d > 9) return null;
    const op = signe(d);
    return ecrisFait({
      consigne: `${f3c(n)} ${op} ${Math.abs(d)} = ${f3c(n - u)} + ${u} ${op} ${Math.abs(d)}`,
      etapes: [etapeT(`${u} ${op} ${Math.abs(d)} = ${CASE}`, u + d), etapeT(calcul.texte, m)],
      reponse: m, image: plusImage(calcul), phrase: plusPhrase(calcul)
    }, plusDessins(calcul, 2));
  }
  // Sommes jusqu'à 10 : 10 = 8 + □, sur le schéma en barres.
  function recetteDixBarres(calcul) {
    const {n, d, m} = calcul.donnees;
    if (m !== 10 || n <= 0 || d <= 0) return null;
    const barres = Object.freeze({outil: "deux-barres", sorte: "tout", haut: Object.freeze([10]), bas: Object.freeze([n, d]), cherche: Object.freeze(["bas", 1])});
    const relier = dessinsDe([{}, {}], 2, (vus, revele = false) => (revele
      ? barres
      : Object.freeze(Object.assign({}, barres, {masque: true, trouves: vus.length, fini: vus.length >= 1}))));
    return ecrisFait({
      consigne: avecQuestion(calcul),
      etapes: [etapeT(`${n} + ${CASE} = 10`, d), etapeT(calcul.texte, d)],
      reponse: d, image: barres, phrase: `${n} + ${d} = 10.`
    }, relier);
  }
  // Les compléments (A2) : déjà écrits sur le calcul (a2Etapes).
  function recetteComplement(calcul) {
    const etapes = a2Etapes(calcul);
    return ecrisFait({
      consigne: etapes.length > 1 ? avecQuestion(calcul) : null,
      etapes: [...etapes], reponse: calcul.reponse, image: a2Image(calcul), phrase: a2Phrase(calcul)
    }, a2Dessins(calcul));
  }
  // Ajouter 9, 19… (A5) et retrancher 9, 19… (A6) : le détour par la dizaine ronde.
  function recetteNeuf(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    return ecrisFait({
      consigne: `${f3c(n)} + ${a} = ${f3c(n)} + ${r} − ${r - a}`,
      etapes: [...a5Etapes(calcul)], reponse: calcul.reponse, image: a5Image(calcul), phrase: a5Phrase(calcul)
    }, droiteDessins({depart: n, sauts: [r, -(r - a)], direct: a, trou: false, etapes: 3}));
  }
  function recetteMoinsNeuf(calcul) {
    const {n, a} = calcul.donnees;
    const r = a5Arrondi(a);
    const etapes = a6Etapes(calcul);
    return ecrisFait({
      consigne: `${f3c(n)} − ${a} = ${f3c(n)} − ${r} + ${r - a}`,
      etapes: [...etapes], reponse: calcul.reponse, image: a6Image(calcul), phrase: a6Phrase(calcul)
    }, droiteDessins({depart: n, sauts: [-r, r - a], direct: -a, trou: false, etapes: etapes.length}));
  }
  // Garder le premier nombre (A4, A7) : les dizaines, puis les unités.
  function recetteChemin(calcul) {
    const {n, d, m} = calcul.donnees;
    const dz = dizainesDe(d);
    const u = d - dz;
    if (!dz || !u) return null;
    const op = signe(d);
    return ecrisFait({
      consigne: `${f3c(n)} ${op} ${f3c(Math.abs(d))} = ${f3c(n)} ${op} ${f3c(Math.abs(dz))} ${op} ${Math.abs(u)}`,
      etapes: [etapeT(`${f3c(n)} ${op} ${f3c(Math.abs(dz))} = ${CASE}`, n + dz), etapeT(`${f3c(n + dz)} ${op} ${Math.abs(u)} = ${CASE}`, m), etapeT(calcul.texte, m)],
      reponse: m, image: cheminImage(calcul), phrase: cheminPhrase(calcul)
    }, cheminDessins(calcul, 3));
  }
  // A3 en passant le rang : on complète la centaine (le millier), puis le reste.
  function recetteRang(calcul) {
    const {n, d, m, sauts} = calcul.donnees;
    if (sauts.length !== 2) return null;
    const op = signe(d);
    const [s0, s1] = sauts.map(s => f3c(Math.abs(s)));
    return ecrisFait({
      consigne: `${f3c(n)} ${op} ${f3c(Math.abs(d))} = ${f3c(n)} ${op} ${s0} ${op} ${s1}`,
      etapes: [etapeT(`${f3c(n)} ${op} ${s0} = ${CASE}`, n + sauts[0]), etapeT(`${f3c(n + sauts[0])} ${op} ${s1} = ${CASE}`, m), etapeT(calcul.texte, m)],
      reponse: m, image: cheminImage(calcul), phrase: cheminPhrase(calcul)
    }, cheminDessins(calcul, 3));
  }
  // A3 sans passage : seul le chiffre du rang change (« Dans 234, le chiffre
  // des dizaines est 3. »).
  const NOMS_CHIFFRE = Object.freeze({10: "dizaines", 100: "centaines", 1000: "milliers"});
  function recetteChiffre(calcul) {
    const {n, d, m, sauts} = calcul.donnees;
    const u = rangDe(d);
    const c = chiffreDe(n, u);
    const k = Math.abs(d) / u;
    if (sauts.length !== 1 || n < u || !Number.isInteger(k) || c + Math.sign(d) * k < 0 || c + Math.sign(d) * k > 9) return null;
    const op = signe(d);
    return ecrisFait({
      consigne: `Dans ${f3c(n)}, le chiffre des ${NOMS_CHIFFRE[u]} est ${c}.`,
      etapes: [etapeT(`${c} ${op} ${k} = ${CASE}`, c + Math.sign(d) * k), etapeT(calcul.texte, m)],
      reponse: m, image: cheminImage(calcul), phrase: cheminPhrase(calcul)
    }, cheminDessins(calcul, 2));
  }
  // L'écart (A8) : du petit au grand, par la dizaine (la centaine…).
  function recetteEcart(calcul) {
    const {n, d, m} = calcul.donnees;
    const {palier, sauts} = sautsDuCalcul(calcul);
    if (palier === null || sauts.length !== 2) return null;
    return ecrisFait({
      consigne: avecQuestion(calcul),
      etapes: [etapeT(`${f3c(n)} + ${CASE} = ${f3c(palier)}`, sauts[0]), etapeT(`${f3c(palier)} + ${CASE} = ${f3c(m)}`, sauts[1]), etapeT(calcul.texte, d)],
      reponse: d, image: plusImage(calcul), phrase: plusPhrase(calcul)
    }, plusDessins(calcul, 3));
  }

  // Les niveaux « sans manipulation » (M4, M5, M6, M8, M10, M12, C3) : la
  // consigne, les étapes (« ? » pour la case), et le dessin de la fiche.
  function ecrisSansManip(fiche, calcul, consigne, etapes, dessins) {
    return ecrisAvecDessins(Object.assign({
      etapes: etapesEcris(etapes), reponse: calcul.reponse,
      solution: Object.freeze({image: fiche.image(calcul), phrase: fiche.phrase(calcul)})
    }, consigne ? {consigne: fr(consigne)} : {}), dessins(calcul, etapes.length));
  }
  // Les tables : une division se lit « combien de fois » (54 ÷ 6 : 6 × □ = 54).
  function recetteDivisionTable(calcul) {
    const {a, b, p} = calcul.donnees;
    if (calcul.forme !== "division") return null;
    return ecrisSansManip(M4, calcul, `${f(p)} ÷ ${a} : combien de fois ${a} dans ${f(p)} ?`,
      [[`${a} × ? = ${f(p)}`, b], [`${f(p)} ÷ ${a} = ?`, b]], (c, n) => finiDessins(m4Image(c), n));
  }
  // Repères : 100 = 4 × 25 (6 × 25 = 4 × 25 + 2 × 25). Au-delà de 4 fois 25
  // seulement, et pas 8 fois (4 × 25 + 4 × 25 : la barre écrit déjà 100).
  function recetteVingtCinq(calcul) {
    const {a, b} = calcul.donnees;
    const devant = a !== 25;
    const k = devant ? a : b;
    if (k <= 4 || k >= 8) return null;
    const fois = x => (devant ? `${x} × 25` : `25 × ${x}`);
    return ecrisSansManip(M5, calcul, `${fois(k)} = ${fois(4)} + ${fois(k - 4)}`,
      [[`${fois(k - 4)} = ?`, (k - 4) * 25], [`${fois(k)} = ?`, k * 25]], (c, n) => partsDessins(m5Image(c), n, true));
  }
  // × 4, × 8 : le double du double (4 × 37 = 2 × 2 × 37). Lot 7e-2 : les
  // doubles successifs, chacun sur le résultat d'avant (2 × 37 = 74, puis
  // 2 × 74 = 148).
  function recetteDoubleDouble(calcul) {
    const {n, fois} = calcul.donnees;
    const deux = Array.from({length: Math.log2(fois)}, () => "2").join(" × ");
    const etapes = [];
    for (let k = 1; k < fois; k *= 2) etapes.push([`2 × ${f(k * n)} = ?`, 2 * k * n]);
    return ecrisSansManip(M6, calcul, `${fois} × ${f(n)} = ${deux} × ${f(n)}`, etapes, (c, k) => barresFoisDessins(m6Image(c), k));
  }
  // Décomposer (M8) : 6 × 14 = 10 × 6 + 4 × 6 ; 12 × 35 = 10 × 35 + 2 × 35.
  function recetteDecomposer(calcul) {
    const {a, b, r} = calcul.donnees;
    const [d, u] = [b - b % 10, b % 10];
    // (« 1 × 9 » n'est pas une étape : aux niveaux 1 et 2, pas de 41 ; au
    // niveau 3, × 21 et × 31 sont la leçon — « 21 fois 43, c'est 20 fois 43
    // plus 1 fois 43 ».)
    if (!d || !u || (u === 1 && calcul.niveau !== 3)) return null;
    const texte = calcul.forme === "produit-gauche" ? `${f(a)} × ${f(b)}` : `${f(b)} × ${f(a)}`;
    return ecrisSansManip(M8, calcul, `${texte} = ${f(d)} × ${f(a)} + ${u} × ${f(a)}`,
      [[`${f(d)} × ${f(a)} = ?`, d * a], [`${u} × ${f(a)} = ?`, u * a], [`${texte} = ?`, r]], (c, n) => rectangleDessins(m8Image(c), n));
  }
  // Regrouper (M10) : 2 × 38 × 5 = 2 × 5 × 38 ; 25 × 28 = 7 × 4 × 25.
  function recetteRegrouper(calcul) {
    const {facteurs, groupe, reste} = calcul.image || {};
    if (calcul.forme !== "regrouper" || !facteurs) return null;
    const [x, y, z] = facteurs.map(f);
    return ecrisSansManip(M10, calcul, `${x} × ${y} × ${z} = ${x} × ${z} × ${y}`,
      [[`${x} × ${z} = ?`, groupe], [`${y} × ${f(groupe)} = ?`, reste * groupe]], (c, n) => facteursDessins(m10Image(c), n));
  }
  function recetteQuart(calcul) {
    const {reste: q} = calcul.image;
    const a = q * 4;
    if (calcul.forme !== "produit-gauche" || !Number.isInteger(q)) return null;
    return ecrisSansManip(M10, calcul, `25 × ${f(a)} = ${f(q)} × 4 × 25`,
      [["4 × 25 = ?", 100], [`${f(q)} × 100 = ?`, q * 100]], (c, n) => facteursDessins(m10Image(c), n));
  }
  // Diviser en décomposant (M12) : 350 ÷ 7 = 35 ÷ 7 × 10 ; 135 ÷ 5 = 100 ÷ 5 + 35 ÷ 5.
  function recetteDizainesDivisees(calcul) {
    const {n, d, q, t, unite} = calcul.donnees;
    if (unite !== 10 || calcul.forme !== "division") return null;
    return ecrisSansManip(M12, calcul, `${f(n)} ÷ ${d} = ${f(t)} ÷ ${d} × 10`,
      [[`${f(t)} ÷ ${d} = ?`, t / d], [`${f(n)} ÷ ${d} = ?`, q]], (c, k) => partageDessins(m12Image(c), k));
  }
  function recettePartage(calcul) {
    const {n, d, q} = calcul.donnees;
    if (calcul.forme !== "division" || calcul.morceaux.length !== 2) return null;
    const [x, y] = calcul.morceaux;
    return ecrisSansManip(M12, calcul, `${f(n)} ÷ ${d} = ${f(x)} ÷ ${d} + ${f(y)} ÷ ${d}`,
      [[`${f(x)} ÷ ${d} = ?`, x / d], [`${f(y)} ÷ ${d} = ?`, y / d], [`${f(n)} ÷ ${d} = ?`, q]], (c, k) => partageDessins(m12Image(c), k));
  }
  // Égalités à trou (C3) : 684 = 300 + □ ; 365 + 9 = 362 + □ ; 256 + 198 = □ + 200.
  const c3Dessins = (c, n) => deuxBarresDessins(c3Image(c), n);
  function recetteEgal(calcul) {
    const {n, a} = calcul.donnees;
    return ecrisSansManip(C3, calcul, avecQuestion(calcul), [[`${f(n)} − ${f(a)} = ?`, n - a]], c3Dessins);
  }
  function recetteGarder(calcul) {
    const {a, b, c} = calcul.donnees;
    if (!(a > c)) return null;
    return ecrisSansManip(C3, calcul, avecQuestion(calcul), [[`${f(a)} − ${f(c)} = ?`, a - c], [`${f(b)} + ${f(a - c)} = ?`, calcul.reponse]], c3Dessins);
  }
  function recetteGarderGrand(calcul) {
    const {a, b, d} = calcul.donnees;
    if (!(d > b)) return null;
    return ecrisSansManip(C3, calcul, avecQuestion(calcul), [[`${f(d)} − ${f(b)} = ?`, d - b], [`${f(a)} − ${f(d - b)} = ?`, calcul.reponse]], c3Dessins);
  }
  // Le tableau à flèches (M2, D2, D3) : une seule égalité, le calcul.
  function recetteGlisse(calcul, texte = calcul.texte) {
    const etapes = [etapeDe(texte, calcul.reponse)];
    return ecrisAvecDessins({
      etapes: Object.freeze(etapes.map(e => Object.freeze(Object.assign({}, e)))), reponse: calcul.reponse,
      solution: Object.freeze({image: tableauDe(calcul), phrase: glissePhrase(calcul)})
    }, tableauDessins(glisseAide(calcul), tableauDe(calcul), etapes));
  }
  // × 10 (M2-1) : 38 × 10 = 38 dizaines.
  function recetteDizaines(calcul) {
    const {n, p} = calcul.donnees;
    if (p !== 10 || calcul.forme !== "produit") return null;
    return recetteGlisse(calcul, `${f(n)} × 10 = ${f(n)} dizaines = ${CASE}`);
  }
  // Tables étendues (M3) : 8 × 40 = 8 × 4 × 10.
  function recetteTableEtendue(calcul) {
    const {x, y, c1, c2, t, p, r} = calcul.donnees;
    const etapes = [[`${c1} × ${c2} = ?`, t], [`${f(x)} × ${f(y)} = ?`, r]];
    return ecrisAvecDessins({
      consigne: fr(`${f(x)} × ${f(y)} = ${c1} × ${c2} × ${f(p)}`),
      etapes: etapesEcris(etapes), reponse: r,
      solution: Object.freeze({image: m3Image(calcul), phrase: m3Phrase(calcul)})
    }, m3Dessins(calcul, etapes.length));
  }
  // × 5, × 50 (M7) : 5 × 58 = 58 × 10 ÷ 2. Lot 7e-2 : la moitié s'écrit
  // sur le résultat de × 10 (580 ÷ 2).
  function recetteDixFois(calcul) {
    const {n, fois, p, dix, r} = calcul.donnees;
    if (calcul.forme !== "produit-gauche") return null;
    const etapes = [[`${f(n)} × ${f(p)} = ?`, dix], [`${f(dix)} ÷ 2 = ?`, r]];
    return ecrisAvecDessins({
      consigne: fr(`${fois} × ${f(n)} = ${f(n)} × ${f(p)} ÷ 2`),
      etapes: etapesEcris(etapes), reponse: r,
      solution: Object.freeze({image: m7Image(calcul), phrase: m7Phrase(calcul)})
    }, dixFoisDessins(m7Image(calcul), etapes.length));
  }
  // Les doubles (M1) : chaque morceau doublé (double de 36 = 2 × 30 + 2 × 6).
  function recetteDouble(calcul, ecriture) {
    const {n, r} = calcul.donnees;
    const morceaux = morceauxDe(n);
    if (calcul.forme !== "double" || morceaux.length !== 2) return null;
    const consigne = {
      plus: `double de ${f(n)} = ${morceaux.map(m => `${f(m)} + ${f(m)}`).join(" + ")}`,
      fois: `double de ${f(n)} = 2 × ${f(n)}`,
      morceaux: `double de ${f(n)} = ${morceaux.map(m => `2 × ${f(m)}`).join(" + ")}`
    }[ecriture];
    const etapes = [...morceaux.map(m => [ecriture === "plus" ? `${f(m)} + ${f(m)} = ?` : `2 × ${f(m)} = ?`, 2 * m]), [`double de ${f(n)} = ?`, r]];
    return ecrisAvecDessins({
      consigne, etapes: etapesEcris(etapes), reponse: r,
      solution: Object.freeze({image: m1Image(calcul), phrase: m1Phrase(calcul)})
    }, barresDessins(m1Image(calcul), etapes.length));
  }

  // Écritures d'un décimal (D1) : 4 + 6/10 = □ — la fraction, puis le tout.
  function recetteEntierFraction(calcul) {
    const [entier, fraction] = calcul.termes || [];
    if (calcul.forme !== "entier-fraction" || !fraction || fraction.k < 1 || entier.k !== 0) return null;
    const k = fraction.k;
    const unites = Array.from({length: String(entier.num).length}, (_, i) => String(entier.num).length - 1 - i);
    const decimales = Array.from({length: k}, (_, i) => -(i + 1));
    const etapes = [[`${ecrireTerme(fraction)} = ?`, exact(fraction.num / 10 ** k)], [`${f(entier.num)} + ${ecrireTerme(fraction)} = ?`, calcul.reponse]];
    return ecrisAvecDessins({
      consigne: fr("Chaque morceau va dans sa colonne."),
      etapes: etapesEcris(etapes), reponse: calcul.reponse,
      solution: Object.freeze({image: Object.freeze(d1Image(calcul)), phrase: d1Phrase(calcul)})
    }, numerationDessins(d1Tableau(calcul, {inconnue: true}), [{rangs: decimales}, {rangs: [...unites, ...decimales]}]));
  }
  // Un rang qui change (D4) : 6,24 + 0,5 = 6,04 + 0,2 + 0,5 — le chiffre du
  // rang d'abord. (Une seule retenue, comme la leçon.)
  function recetteRang10(calcul) {
    const {n, d, rang, r} = calcul.donnees;
    if (calcul.forme !== "plus" || rang >= 0 || calcul.retenues.length > 1) return null;
    const c = chiffreAuRangDecimal(n, rang);
    const morceau = exact(c * 10 ** rang);
    const reste = exact(n - morceau);
    // (0,7 + 0,3 = 1 : la retenue dessinée écrirait la réponse, et un zéro
    // à écrire en plus — pas comme la leçon.)
    if (!c || !reste || Number.isInteger(exact((morceau + d) * 10 ** (-rang - 1)))) return null;
    const k = Math.max(decimalesDe(n), -rang);
    const entiers = String(Math.floor(r)).length;
    const rangs = [...Array.from({length: entiers}, (_, i) => entiers - 1 - i), ...Array.from({length: k}, (_, i) => -(i + 1))];
    const etapes = [[`${f(morceau)} + ${f(d)} = ?`, exact(morceau + d)], [`${f(n)} + ${f(d)} = ?`, r]];
    return ecrisAvecDessins({
      consigne: fr(`${f(n)} + ${f(d)} = ${f(reste)} + ${f(morceau)} + ${f(d)}`),
      etapes: etapesEcris(etapes), reponse: r,
      solution: Object.freeze({image: Object.freeze(d4Image(calcul)), phrase: d4Phrase(calcul)})
    }, numerationDessins(d4Tableau(calcul, {inconnue: true, ligneCachee: false}), [{rangs: [rang]}, {rangs}]));
  }
  // Parenthèses (C1) : les étapes viennent du calcul (c1Etapes).
  function recetteParentheses(calcul, consigne) {
    const etapes = c1Etapes(calcul);
    return ecrisAvecDessins({
      consigne: fr(consigne),
      etapes: etapesEcris(etapes), reponse: calcul.reponse,
      solution: Object.freeze({image: c1Image(calcul), phrase: c1Phrase(calcul)})
    }, escalierDessins(c1Image(calcul), etapes.length));
  }
  // Les fractions sur la barre (F2, F5, F8).
  function ecrisFraction(calcul, consigne, etapes, morceaux) {
    return ecrisAvecDessins({
      consigne: fr(consigne),
      etapes: etapesEcris(etapes), reponse: calcul.reponse,
      solution: Object.freeze({image: fracImage(calcul), phrase: fracPhrase(calcul)})
    }, fracEcrisDessins(calcul, etapes, morceaux));
  }
  const termesDe = calcul => (calcul.lu ? calcul.lu.cotes : [[], []]);
  const fracTexte = t => `${f(t.n)}/${f(t.d)}`;
  // a/d + b/d = □/d : les numérateurs s'ajoutent.
  function recetteMemeDenominateur(calcul) {
    const [gauche, droite] = termesDe(calcul);
    if (gauche.length !== 2 || gauche.some(t => t.s < 0 || t.d !== gauche[0].d || t.d === 1) || droite.length !== 1 || droite[0].d !== gauche[0].d) return null;
    const [x, y] = gauche;
    return ecrisFraction(calcul, avecQuestion(calcul), [[`${x.n} + ${y.n} = ?`, x.n + y.n], [avecQuestion(calcul), x.n + y.n]], [{}, {bas: true}]);
  }
  // e − a/d = □/d (1 − 5/12) : l'entier en parts, puis on retire.
  function recetteEntierMoins(calcul) {
    const [gauche, droite] = termesDe(calcul);
    if (gauche.length !== 2 || gauche[0].d !== 1 || gauche[1].s >= 0 || droite.length !== 1 || droite[0].d !== gauche[1].d) return null;
    const e = gauche[0].n;
    const {n: a, d} = gauche[1];
    return ecrisFraction(calcul, avecQuestion(calcul),
      [[`${e} = ?/${d}`, e * d], [`${e * d}/${d} − ${a}/${d} = ?/${d}`, e * d - a]],
      [{ecrit: e, texte: `${e * d}/${d}`}, {bas: true}]);
  }
  // e + a/d = □/d (F5-2) : l'entier en parts, puis on ajoute.
  function recetteRecomposer(calcul) {
    const [gauche, droite] = termesDe(calcul);
    if (gauche.length !== 2 || gauche[0].d !== 1 || gauche[1].s < 0 || droite.length !== 1 || droite[0].d !== gauche[1].d) return null;
    const e = gauche[0].n;
    const {n: a, d} = gauche[1];
    return ecrisFraction(calcul, avecQuestion(calcul),
      [[`${e} = ?/${d}`, e * d], [`${e * d}/${d} + ${a}/${d} = ?/${d}`, e * d + a]],
      [{ecrit: e, texte: `${e * d}/${d}`}, {bas: true}]);
  }
  // N/d = q + □/d (F5-1) : les parts de l'entier, puis ce qui reste.
  function recetteDecomposerFraction(calcul) {
    const [gauche, droite] = termesDe(calcul);
    if (gauche.length !== 1 || droite.length !== 2 || droite[0].d !== 1) return null;
    const {n: N, d} = gauche[0];
    const q = droite[0].n;
    if (q < 1 || N - q * d <= 0 || N - q * d >= d) return null;
    return ecrisFraction(calcul, avecQuestion(calcul),
      [[`${q} = ?/${d}`, q * d], [`${N}/${d} = ${q * d}/${d} + ?/${d}`, N - q * d], [avecQuestion(calcul), N - q * d]],
      [{ecrit: q, texte: `${q * d}/${d}`}, {bas: true}, {}]);
  }
  // Demis et quarts (F2) : 1/2 s'écrit 2/4, puis on ajoute les quarts.
  function recetteDemiEnQuarts(calcul) {
    const [gauche, droite] = termesDe(calcul);
    if (gauche.length !== 2 || droite.length !== 1 || gauche.some(t => t.s < 0)) return null;
    const i = gauche.findIndex(t => t.d === 2 && t.n === 1);
    const autre = gauche[1 - i];
    if (i < 0 || autre.d !== 4) return null;
    const somme = autre.n + 2;
    const enQuarts = gauche.map((t, k) => (k === i ? "2/4" : fracTexte(t))).join(" + ");
    if (droite[0].d === 1) {
      if (somme !== 4) return null;
      return ecrisFraction(calcul, `${ecrireCote(gauche)} = ${enQuarts}`,
        [["1/2 = ?/4", 2], [`${enQuarts} = ?/4`, 4], [avecQuestion(calcul), 1]],
        [{haut: i, texte: "2/4"}, {}, {bas: true}]);
    }
    if (droite[0].d !== 4) return null;
    return ecrisFraction(calcul, avecQuestion(calcul),
      [["1/2 = ?/4", 2], [`${enQuarts} = ?/4`, somme]],
      [{haut: i, texte: "2/4"}, {bas: true}]);
  }
  // Fractions égales au-delà de 12 parts (F6) : « × 4 en haut et en bas ».
  function recetteFoisFraction(calcul) {
    // Lot 7e : jusqu'à 12 parts (le niveau 1), les mêmes lignes, sur les
    // bandes (une part coupée en k, puis la réponse).
    if (!f6Grand(calcul) && calcul.forme === "multiplier" && calcul.donnees.a < calcul.donnees.d) {
      const {a, d, k} = calcul.donnees;
      if (a === 1) return null;
      return ecrisFraction(calcul, `${a}/${d} = (${a} × ${k})/(${d} × ${k})`,
        [[`${d} × ? = ${d * k}`, k], [`${a} × ${k} = ?`, a * k], [avecQuestion(calcul), a * k]], [{gros: k}, {}, {bas: true}]);
    }
    if (!f6Grand(calcul)) return null;
    const {a, d, k} = calcul.donnees;
    let consigne;
    let etapes;
    let morceaux;
    if (calcul.forme === "multiplier") {
      consigne = `${a}/${d} = (${a} × ${k})/(${d} × ${k})`;
      etapes = [[`${d} × ? = ${d * k}`, k], [`${a} × ${k} = ?`, a * k], [avecQuestion(calcul), a * k]];
      morceaux = [{bas: true}, {haut: true}, {case: true}];
    } else if (calcul.forme === "diviser") {
      consigne = `${a * k}/${d * k} = (${a * k} ÷ ${k})/(${d * k} ÷ ${k})`;
      etapes = [[`${d * k} ÷ ? = ${d}`, k], [`${a * k} ÷ ${k} = ?`, a], [avecQuestion(calcul), a]];
      morceaux = [{bas: true}, {haut: true}, {case: true}];
    } else if (calcul.forme === "denominateur") {
      consigne = `${a}/${d} = (${a} × ${k})/(${d} × ${k})`;
      etapes = [[`${a} × ? = ${a * k}`, k], [`${d} × ${k} = ?`, d * k], [avecQuestion(calcul), d * k]];
      morceaux = [{haut: true}, {bas: true}, {case: true}];
    } else return null;
    const dessin = (vus, revele = false) => {
      const vu = cle => revele || vus.some(m => m[cle]);
      return f6Schema(calcul, {haut: vu("haut"), bas: vu("bas"), trouve: vu("case") && !revele, revele,
        trouveHaut: vu("haut") && !revele, trouveBas: vu("bas") && !revele});
    };
    return ecrisAvecDessins({
      consigne: fr(consigne),
      etapes: etapesEcris(etapes), reponse: calcul.reponse,
      solution: Object.freeze({image: fracImage(calcul), phrase: fracPhrase(calcul)})
    }, dessinsDe(morceaux, morceaux.length, dessin));
  }
  // Fraction d'une quantité (F3, lot 7e-2) : en mots, comme la leçon —
  // « Je partage 42 € en 6 parts égales. », « Une part, c'est □ €. » ; au
  // niveau 3, un quart par la moitié de la moitié (14 L → 7 L → 3,5 L).
  function recetteQuantite(calcul, quart = false) {
    if (!calcul.f3) return null;
    const mots = f3EnMots(calcul, quart);
    if (!mots) return null;
    const n = mots.etapes.length;
    const dessin = (k, revele) => Object.freeze(Object.assign({}, f3Aide(calcul), revele || k >= n ? {trouve: Object.freeze({texte: f(calcul.reponse), vert: !revele})} : {}));
    return ecrisAvecDessins({
      consigne: fr(mots.consigneEcris),
      etapes: etapesEcris(mots.etapes), reponse: calcul.reponse,
      solution: Object.freeze({image: f3Image(calcul), phrase: f3Phrase(calcul)})
    }, {dessins: Object.freeze(Array.from({length: n + 1}, (_, k) => dessin(k, false))), revele: dessin(n, true)});
  }
  // Fractions usuelles et décimaux (F1).
  function ecrisF1(calcul, consigne, etapes, dessins) {
    const n = etapes.length;
    return ecrisAvecDessins({
      consigne: fr(consigne),
      etapes: etapesEcris(etapes), reponse: calcul.reponse,
      solution: Object.freeze({image: f1Image(calcul), phrase: f1Phrase(calcul)})
    }, {dessins: Object.freeze(Array.from({length: n + 1}, (_, k) => Object.freeze(dessins(k, false)))), revele: Object.freeze(dessins(n, true))});
  }
  // 0,7 = 7/□ : des dixièmes, comme la leçon.
  function recetteDixiemes(calcul) {
    const {v, n} = calcul.f1 || {};
    if (calcul.forme !== "denominateur" || calcul.reponse !== 10 || !n) return null;
    return ecrisF1(calcul, avecQuestion(calcul), [[`${n}/10 = ?`, v], [avecQuestion(calcul), 10]], (k, revele) => {
      const tableau = f1Tableau(calcul, revele || k >= 2);
      return k >= 2 && !revele ? Object.assign(tableau, {resultat: Object.assign({}, tableau.resultat, {trouve: true})}) : tableau;
    });
  }
  // 3/4 = □/100 : la fraction unitaire d'abord (1/4 = 25/100), sur le carré de 100.
  function recetteCentiemes(calcul) {
    const {a, d} = calcul.f1 || {};
    if (calcul.forme !== "centiemes" || !a || a < 2 || !/□\/100$/.test(calcul.texte)) return null;
    const unite = exact(1 / d);
    // Plus d'une unité (5/2) : la place de tous les carrés dès le début.
    const places = Math.ceil(a / d);
    const carre = v => (places > 1 ? Object.assign(d1Carre(v), {places}) : d1Carre(v));
    return ecrisF1(calcul, avecQuestion(calcul), [[`1/${d} = ?/100`, Math.round(100 / d)], [avecQuestion(calcul), calcul.reponse]],
      (k, revele) => (revele || k >= 2 ? carre(exact(a / d)) : k === 1 ? carre(unite) : carre(0)));
  }
  // 3/5 = □ : 3 × 1/5 (1/5 = 0,2), sur la barre des cinquièmes.
  function recetteCinquiemes(calcul) {
    const {a, d} = calcul.f1 || {};
    if (calcul.forme !== "decimal" || d !== 5 || !a || a < 2 || !/^\d+\/5 = □$/.test(calcul.texte)) return null;
    const unites = Math.ceil(a / 5);
    const r = calcul.reponse;
    return ecrisF1(calcul, `${a}/5 = ${a} × 1/5`, [["1/5 = ?", 0.2], [avecQuestion(calcul), r]], (k, revele) => {
      const fini = revele || k >= 2;
      const nombres = [{k: 0, texte: "0"}, ...(revele || k >= 1 ? [{k: 1, texte: "0,2", trouve: !revele}] : []),
        ...Array.from({length: unites}, (_, j) => ({k: 5 * (j + 1), texte: String(j + 1)}))];
      return {outil: "barre-droite", a: unites, d: 5, pris: a, retire: 0, haut: Object.freeze([]), cache: null,
        bas: Object.freeze(Object.assign({de: 0, a, texte: fini ? f(r) : "?", cherche: !revele}, k >= 2 && !revele ? {trouve: true} : {})),
        nombres: Object.freeze(nombres.map(Object.freeze))};
    });
  }

  // Les recettes, niveau par niveau.
  const RECETTES_ECRIS = Object.freeze({
    "A1-1": recetteDixBarres, "A1-2": recettePlus, "A1-3": recettePlus,
    "A10-1": recetteUnites, "A10-2": recettePlus, "A10-3": recettePlus,
    "A11-1": recetteUnites, "A11-2": recettePlus, "A11-3": recettePlus,
    "A2-1": recetteComplement, "A2-2": recetteComplement, "A2-3": recetteComplement, "A2-4": recetteComplement, "A2-5": recetteComplement,
    "A5-1": recetteNeuf, "A5-2": recetteNeuf, "A5-3": recetteNeuf, "A5-4": recetteNeuf,
    "A6-1": recetteMoinsNeuf, "A6-2": recetteMoinsNeuf, "A6-3": recetteMoinsNeuf, "A6-4": recetteMoinsNeuf,
    "A3-1": recetteChiffre, "A3-2": recetteRang, "A3-3": recetteRang, "A3-4": recetteChiffre,
    "A4-1": recetteChemin, "A4-2": recetteChemin, "A4-3": recetteChemin, "A4-4": recetteChemin,
    "A7-1": recetteChemin, "A7-2": recetteChemin, "A7-3": recetteChemin,
    "A8-1": recetteEcart, "A8-2": recetteEcart,
    "M1-1": c => recetteDouble(c, "plus"), "M1-2": c => recetteDouble(c, "fois"), "M1-3": c => recetteDouble(c, "morceaux"),
    "M4-1": recetteDivisionTable, "M4-2": recetteDivisionTable, "M5-1": recetteVingtCinq,
    "M6-1": recetteDoubleDouble, "M6-2": recetteDoubleDouble,
    "M8-1": recetteDecomposer, "M8-2": recetteDecomposer, "M8-3": recetteDecomposer,
    "M10-1": recetteRegrouper, "M10-2": recetteRegrouper, "M10-3": recetteQuart,
    "M12-1": recetteDizainesDivisees, "M12-2": recettePartage, "M12-3": recettePartage,
    "C3-1": recetteEgal, "C3-2": recetteGarder, "C3-3": recetteGarderGrand,
    "M2-1": recetteDizaines, "M2-2": c => recetteGlisse(c), "D2-1": c => recetteGlisse(c), "D2-2": c => recetteGlisse(c),
    "D2-3": c => recetteGlisse(c), "D2-4": c => recetteGlisse(c), "D3-1": c => recetteGlisse(c), "D3-2": c => recetteGlisse(c), "D3-3": c => recetteGlisse(c),
    "M3-1": recetteTableEtendue, "M3-2": recetteTableEtendue, "M3-3": recetteTableEtendue,
    "M7-1": recetteDixFois, "M7-2": recetteDixFois, "M7-3": recetteDixFois,
    "D1-1": recetteEntierFraction, "D1-2": recetteEntierFraction, "D1-3": recetteEntierFraction,
    "D4-1": recetteRang10, "D4-2": recetteRang10, "D4-3": recetteRang10,
    "C1-1": c => recetteParentheses(c, "D’abord la parenthèse."), "C1-2": c => recetteParentheses(c, "Chaque parenthèse d’abord."),
    "C1-3": c => recetteParentheses(c, "La parenthèse la plus à l’intérieur d’abord."),
    "F8-1": recetteMemeDenominateur, "F8-2": recetteEntierMoins, "F8-3": recetteEntierMoins,
    "F5-1": recetteDecomposerFraction, "F5-2": recetteRecomposer,
    "F2-1": recetteDemiEnQuarts, "F2-2": recetteDemiEnQuarts,
    "F6-1": recetteFoisFraction, "F6-2": recetteFoisFraction, "F6-3": recetteFoisFraction,
    "F3-1": c => recetteQuantite(c), "F3-2": c => recetteQuantite(c), "F3-3": c => recetteQuantite(c, true),
    "F1-1": recetteDixiemes, "F1-2": recetteCentiemes, "F1-3": recetteCinquiemes,
    // Lot 7a.
    "D5-1": d5Ecris, "D5-2": d5Ecris,
    "D6-1": deuxEcris, "D6-2": deuxEcris, "D6-3": deuxEcris, "D7-1": deuxEcris, "D7-2": deuxEcris, "D7-3": deuxEcris,
    // Lot 7b.
    "D8-1": d8Ecris, "D8-2": d8Ecris, "D8-3": d8Ecris,
    "D9-1": recetteDixFois, "D9-2": recetteDixFois,
    "M13-1": recetteMoitieMoitie, "M13-2": recetteMoitieMoitie, "M13-3": recetteMoitieMoitie
  });

  // Le J'écris d'un calcul dans un niveau (« A10-2 »), ou null quand la
  // recette ne s'applique pas à ce calcul.
  function ecrisDuCalcul(cleNiveau, calcul) {
    const recette = RECETTES_ECRIS[cleNiveau];
    return recette && calcul ? recette(calcul) : null;
  }
  // Même écriture : les nombres comptent pas, les mots et les signes oui
  // (« 1/10 de 500 g = □ g » et « 1/10 de 30 billes = □ » ne s'écrivent pas
  // pareil).
  // (Fraction d'une quantité : l'unité peut changer, la méthode est la même.)
  const UNITES_LIBRES = new Set(["F3-1", "F3-2", "F3-3"]);
  const gabaritDe = texte => String(texte).replace(/\d+(?:[\s  ]\d{3})*(?:,\d+)?/g, "#");
  // Une consigne ou une étape qui écrirait la réponse, par hasard (13 − 8 =
  // 13 − 3 − 5 : le saut vaut la réponse) : ce calcul n'est pas pris.
  const nombresDuTexte = texte => (String(texte).match(/\d+(?:[\s\u202f\u00a0]\d{3})*(?:,\d+)?/g) || [])
    .map(x => Number(x.replace(/[\s\u202f\u00a0]/g, "").replace(",", ".")));
  function devoile(calcul, ecris) {
    const r = Number(calcul.reponse);
    if (nombresDuTexte(calcul.texte).some(x => memeNombre(x, r))) return false;
    return [ecris.consigne || "", ...ecris.etapes.map(etape => etape.texte)].some(texte => nombresDuTexte(texte).some(x => memeNombre(x, r)));
  }
  // J'écris tiré : {calcul, ecris}, un calcul du niveau dans la sorte et
  // l'écriture du J'écris de la leçon, jamais un calcul de la leçon ni un
  // de `exclure` (textes ou clés : la série en cours). La même graine rend
  // le même calcul. null : le niveau n'a pas de recette (on garde le
  // J'écris de la leçon).
  function ecrisTire(cleNiveau, {graine = 1, exclure = []} = {}) {
    const trouve = niveauDe(cleNiveau);
    const lecon = trouve && trouve.niveau.apprends;
    if (!lecon || !lecon.calculs || !RECETTES_ECRIS[cleNiveau] || typeof trouve.niveau.composer !== "function") return null;
    const modele = lecon.calculs.ecris;
    const sorte = sorteBrute(cleNiveau, modele);
    const gabarit = gabaritDe(modele.texte);
    const interdits = new Set([...exclure, ...lecon.textes, lecon.calculs.montre.texte]);
    // (F1-1, « 0,7 = 7/□ » : la première étape, 7/10 = 0,7, écrit le 10
    // cherché — c'est la leçon qui le veut.)
    const voulu = devoile(modele, lecon.ecris);
    const rng = mulberry32(graine >>> 0);
    for (let essai = 0; essai < 12; essai += 1) {
      for (const calcul of melanger(rng, trouve.niveau.composer(rng, 40, []))) {
        if (interdits.has(calcul.texte) || interdits.has(calcul.cle)) continue;
        if (calcul.forme !== modele.forme || sorteBrute(cleNiveau, calcul) !== sorte) continue;
        if (!UNITES_LIBRES.has(cleNiveau) && gabaritDe(calcul.texte) !== gabarit) continue;
        const ecris = ecrisDuCalcul(cleNiveau, calcul);
        if (ecris && (voulu || !devoile(calcul, ecris))) return Object.freeze({calcul, ecris});
      }
    }
    return null;
  }

  return Object.freeze({
    PALIERS,
    CEINTURES,
    dessinCeinture,
    elementCeinture,
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
    sortesDe,
    sorteDe,
    // Lot 3a : la sorte d'un calcul de leçon (niveau 0) dans un niveau donné.
    sorteDansNiveau: sorteBrute,
    // Lot 3b : ce qu'on annonce quand une sorte nouvelle arrive.
    nouveauteDe,
    carteParCoeur,
    schemaParCoeur,
    modeleReponse,
    modelesReponse,
    aideDe,
    dessinAEtapes,
    dessinAEtapesDe: calcul => (calcul ? dessinAEtapes(aideDe(calcul), calcul.texte, calcul.reponse) : null),
    manipulationDe,
    annonceDe,
    virguleDe,
    virguleDuTexte,
    diagnostiquer,
    imageDe,
    tableARevoir,
    a2Sauts,
    // Lot 3c : J'écris sur un calcul tiré.
    ecrisDuCalcul,
    ecrisTire
  });
});
