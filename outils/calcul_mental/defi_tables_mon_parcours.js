(function initDefiTablesMonParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_TABLES_MON_PARCOURS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // Moteur de « Mon parcours » (logique pure, sans DOM) pour Défi tables.
  // Règles décidées le 29/08/2026 :
  //  - par table (2 à 10) : J'apprends (4 activités, 5 depuis le lot 4b), Je m'entraîne (3 entraînements
  //    différents), Acquise (validation 20 questions, 1 min 30, 2 erreurs max) ;
  //  - Mélange des tables acquises (dès 2 tables) : un ✓ « à jour » qui repasse
  //    « à refaire » à chaque nouvelle table acquise.
  // Lot 3 de Défi tables v2 « les règles » (décisions des 7 et 8/09/2026) :
  //  - le mélange est OBLIGATOIRE : dès 2 tables acquises, tant qu'il n'est
  //    pas réussi, « Je valide » des autres tables est verrouillé ; J'apprends
  //    et Je m'entraîne restent libres. Même format que la validation d'une
  //    table (20 questions = 14 produits + 6 trous, 1 min 30, 2 erreurs max),
  //    sur les tables acquises seulement, sans division — y compris le dernier,
  //    avec les 9 tables. Chaque nouvelle table le remet « à faire » ;
  //  - les étoiles n'arrivent qu'à la fin : 9 tables acquises ET dernier
  //    mélange réussi ouvrent l'escalier — 25 questions, produits + trous +
  //    divisions dès la première étoile, toutes les tables, 2 erreurs max, seule
  //    la durée change : ★ 2 min · ★★ 1 min 45 · ★★★ 1 min 30 · ★★★★ 1 min 15 ·
  //    👑 1 min (Légende des tables). Une étoile réussie valide les précédentes.
  //    L'ancien Expert « ouvert dès le début » et son raccourci « ★ valide les
  //    9 tables » n'existent plus ;
  //  - un RANG, qui ne redescend jamais : Bronze (1 table acquise) · Argent (3)
  //    · Or (6) · Platine (9 tables + dernier mélange) · Diamant (★★★★) ·
  //    Légende des tables (👑) ;
  //  - les JOURS travaillés (un jour compte dès qu'une série de la grille est
  //    jouée) : « N jours cette semaine », jamais de série à ne pas casser ;
  //  - le JOUR est le jour LOCAL de l'appareil (jourLocal), plus le jour UTC :
  //    à la Réunion, le jour UTC basculait à 4 h du matin ;
  //  - les parcours d'avant sont migrés une seule fois (version 2) : les tables
  //    acquises restent acquises, l'ancienne ★★★ (divisions en 2 min) devient
  //    la nouvelle ★, les anciennes ★ et ★★ ne valent rien, le mélange est remis
  //    « à faire ».
  // Lot 4b « les perles comptent » (10/09/2026) :
  //  - J'apprends a CINQ activités : « je pousse les perles » (le rekenrek du
  //    lot 4a) en première position, puis la bande (ex-bâton), la bande à
  //    trous, l'ordre, le désordre. Les activités sont rangées PAR NOM, jamais
  //    par rang : un parcours d'avant garde ses cases telles quelles, et la
  //    perle qui lui manque vaut simplement 0 — rien ne glisse d'un cran ;
  //  - l'étape conseillée d'une table (le rond bleu) : J'apprends tant que les
  //    cinq activités ne sont pas toutes terminées ET qu'aucun entraînement
  //    n'est réussi ; dès que l'un des deux est vrai, Je m'entraîne. « Finir un
  //    J'apprends ne veut pas dire qu'il connaît » ;
  //  - l'avis « le parcours a changé » du lot 3 est retiré : il n'y avait pas
  //    d'élèves avant le 8/09, il n'a servi à personne. La migration des
  //    données (★★★ → ★, mélange remis à faire) reste.
  // Lot 4 « Mes calculs » (29/08/2026, idée de Claire) :
  //  - grille des 36 faits 2×2 à 9×9, sens confondus (7×8 et 8×7 = un seul fait) ;
  //  - 3 cases par fait : +1 par bonne réponse, −1 par erreur ou question passée,
  //    su à 3 ; états : jamais vu / à travailler (0 après erreur) / en cours / su ;
  //  - la grille appartient au parcours : alimentée par Je m'entraîne, les
  //    validations, les mélanges, Expert et les révisions — jamais par
  //    J'apprends, Réglages ou l'évaluation CM1 ;
  //  - révision personnalisée : 10 questions sans chrono, priorité aux faits à
  //    0 case ratés récemment, puis 1, puis 2, puis les jamais vus des tables
  //    acquises, puis l'entretien, puis les jamais vus restants.
  // Lot MÉMOIRE « Mes calculs du jour » (décisions des 11 et 12/09/2026, après
  // la formation neurosciences de Gwenaël) : les trois cases deviennent CINQ
  // BOÎTES, et chaque calcul porte le jour où il REVIENT.
  //  - boîte 1 = à revoir (rouge), 2 et 3 = en route (bleu), 4 et 5 = su (vert)
  //    — les trois couleurs et les trois mots ne changent pas ;
  //  - un calcul monte d'une boîte quand il est DÛ (son jour de retour est
  //    arrivé) et réussi du premier coup, dans n'importe quelle série du
  //    parcours (entraînements, validations, mélanges, étoiles, révision) ;
  //    pas dû, une bonne réponse ne change rien. Cette règle remplace « au plus
  //    une case par jour » : « un calcul monte quand tu le réussis le jour où
  //    il revient » ;
  //  - à la montée, le calcul revient après 0 · 1 · 3 · 7 · 14 jours selon sa
  //    nouvelle boîte ; la boîte 5 est renouvelée à chaque réussite : c'est
  //    l'entretien de toute l'année, un calcul su ne disparaît plus jamais ;
  //  - une erreur = une boîte de moins (jamais de retour direct en boîte 1) et
  //    le calcul est dû aujourd'hui ; pas de regain le jour d'une erreur ;
  //    seule la première réponse d'une série compte ;
  //  - la révision = LES CALCULS DUS AUJOURD'HUI, pris dans toutes les boîtes
  //    à tour de rôle (les plus en retard d'abord dans chaque boîte) pour que
  //    chaque série mêle du dur et du facile — verts compris, 10 à la fois ;
  //    rien de dû = « Encore 10 calculs » si l'élève veut s'entraîner (les
  //    prochains à revenir), et rien ne monte : pas de triche ;
  //  - migration des grilles d'avant (version 2) : cases 0/1/2/3 → boîtes
  //    1/2/3/4 (rien de vert ne redevient bleu), échéance recalculée depuis la
  //    dernière date connue du calcul — dû aujourd'hui si elle manque.

  // Lot « Ma séance du jour » (lot 1, 02/10/2026 — conception de Gwenaël) :
  //  - la RANGÉE d'une table : dix cases, les résultats (3, 6, 9… 30). Les
  //    huit calculs de la grille suivent leurs boîtes (vide · entourée = boîte
  //    2 · pleine = boîte 3 ou plus) ; les deux bouts (× 1 et × 10) ne sont ni
  //    dans les boîtes ni dans la grille des 36 : ils se remplissent à la
  //    première réussite (« bouts », par table). La table de 10 n'a que des
  //    bouts. « Prête » = les dix cases pleines ;
  //  - l'ÉCHELLE À DÉCALAGE : huit marches par table (perles, je construis la
  //    bande, bande à trous, dans l'ordre, dans le désordre, nombres
  //    manquants, résultats et nombres manquants, je valide ma table). Une
  //    séance propose trois marches qui se suivent, à partir du « départ » de
  //    la table (« seance.depart », 1 à 6). Séance finie : le départ avance
  //    d'une marche, de deux si les marches du jour sont toutes sans faute.
  //    Une marche ratée (plus de 3 erreurs sur 10) : la marche d'en dessous,
  //    puis la marche ratée refaite, puis la suite ; ratée une seconde fois,
  //    la séance s'arrête et le départ redescend un cran sous la marche ratée ;
  //  - la marche 8 ne devient la validation que si la table est prête — ou
  //    par le RACCOURCI : 10 sur 10 à « Dans le désordre » ET 10 sur 10 à
  //    « Nombres manquants » (« sansFaute », par table) ; sinon un
  //    entraînement la remplace. Tant que le mélange est dû, pas de validation ;
  //  - une séance = Mes calculs du jour (10 au plus) s'il y en a, le mélange
  //    s'il est dû, puis les marches de la table ; « seances » garde le jour
  //    de chaque séance finie (« Cette semaine ●○○○ »).
  // Rien de tout cela ne change la version du parcours : des clés en plus,
  // et une clé absente vaut son départ (rien, 1, 0).

  // Version du parcours enregistré. 1 = jusqu'au lot 2 de Défi tables v2 ;
  // 2 = lot 3 (mélange obligatoire, escalier des étoiles, rang, jours) ;
  // 3 = lot mémoire (cinq boîtes et une échéance par calcul). Un parcours
  // d'une version plus basse est migré par normaliserParcours — donc à la
  // lecture de la case, à la fusion, à la sauvegarde — et jamais deux fois.
  // Le lot 4b n'a pas changé de version : il ajoute une activité (une clé de
  // plus dans « apprends »), et une clé absente vaut 0 — c'est déjà la règle.
  const VERSION = 3;
  const CLE_STOCKAGE = "mathsgo-defi-tables-parcours";
  const TABLES = Object.freeze(Array.from({length: 9}, (_, index) => index + 2));
  const ORDRE_CONSEIL = Object.freeze([2, 10, 5, 3, 4, 6, 7, 8, 9]);
  // Les activités de J'apprends, dans l'ordre où elles se proposent : les
  // perles (le rekenrek) d'abord, la bande ensuite. Ce sont des CLÉS, pas des
  // rangs : chaque case du parcours est rangée sous son nom.
  const ACTIVITES_APPRENDS = Object.freeze(["beads", "construct", "gaps", "ordered", "random"]);
  const ENTRAINEMENTS = Object.freeze(["desordre", "trous", "mixte"]);
  const PRENOM_MAX = 20;

  // Suivi de classe (lot C) : le code que le professeur remet sur papier.
  // Alphabet sans O, 0, I ni 1 — les seuls qu'on lit de travers en
  // majuscules (le L y est : même alphabet que le serveur, _serveur/public/lib/codes.php).
  const CLE_CODE = "mathsgo-suivi-code";
  const ALPHABET_CODE = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const LONGUEUR_CODE = 6;

  const SEUILS = Object.freeze({
    entrainement: Object.freeze({total: 10, erreursMax: 1}),
    // « boiteMin » (19/09/2026, décision de Gwenaël) : la validation n'est
    // CONSEILLÉE que quand les 8 calculs de la table sont en boîte 3 ou plus
    // — deux rendez-vous réussis, donc au plus tôt le lendemain des
    // entraînements. Un conseil, jamais un verrou : « Je valide » reste libre.
    validation: Object.freeze({total: 20, dureeMax: 90, erreursMax: 2, boiteMin: 3}),
    // Le mélange a le format de la validation : 20 questions (14 produits +
    // 6 trous) en 1 min 30, 2 erreurs max — dès 2 tables acquises.
    melange: Object.freeze({total: 20, dureeMax: 90, erreursMax: 2, tablesMin: 2}),
    // L'escalier des étoiles : 25 questions, toutes les tables, produits +
    // trous + divisions, 2 erreurs max ; une durée par marche, en secondes.
    etoile: Object.freeze({total: 25, erreursMax: 2, durees: Object.freeze([120, 105, 90, 75, 60])}),
    // La révision : 10 calculs à la fois ; cinq boîtes par calcul, et le
    // nombre de jours avant qu'un calcul revienne, par boîte (boîte 1 : le
    // jour même). « aRevoirMin » : dès 2 calculs rouges, une table acquise
    // porte le repère « à revoir ».
    revision: Object.freeze({total: 10, boites: 5, delais: Object.freeze([0, 1, 3, 7, 14]), aRevoirMin: 2}),
    // Les jours travaillés gardés dans le parcours (dates, sans heure).
    jours: Object.freeze({garder: 14}),
    // Ma séance du jour : trois marches par séance, un départ entre 1 et 6
    // (la séance 6-7-8 est la dernière), +2 quand tout est sans faute ;
    // « raté » = plus de 3 erreurs sur 10 (moins de 7 sur 10) ; l'objectif de
    // la semaine (4 jours, pas une limite) ; les séances gardées.
    seance: Object.freeze({marches: 3, departMax: 6, sansFaute: 2, erreursRate: 0.3, objectifSemaine: 4, garder: 60})
  });
  const ETOILES_MAX = SEUILS.etoile.durees.length;

  // Les rangs, dans l'ordre : l'indice est le niveau (0 = pas encore de rang).
  const RANGS = Object.freeze([
    Object.freeze({niveau: 0, cle: "", nom: ""}),
    Object.freeze({niveau: 1, cle: "bronze", nom: "Bronze"}),
    Object.freeze({niveau: 2, cle: "argent", nom: "Argent"}),
    Object.freeze({niveau: 3, cle: "or", nom: "Or"}),
    Object.freeze({niveau: 4, cle: "platine", nom: "Platine"}),
    Object.freeze({niveau: 5, cle: "diamant", nom: "Diamant"}),
    Object.freeze({niveau: 6, cle: "legende", nom: "Légende des tables"})
  ]);
  const SEUILS_RANG = Object.freeze({argent: 3, or: 6});

  // Les 36 faits de la grille « Mes calculs » : 2×2 à 9×9, sens confondus.
  const FAIT_MIN = 2;
  const FAIT_MAX = 9;
  const FAITS = Object.freeze((() => {
    const cles = [];
    for (let premier = FAIT_MIN; premier <= FAIT_MAX; premier += 1) {
      for (let second = premier; second <= FAIT_MAX; second += 1) cles.push(`${premier}-${second}`);
    }
    return cles;
  })());
  const FORMES_TROU = Object.freeze(["right", "left", "reverse-right", "reverse-left"]);
  const FORMES_DIVISION = Object.freeze(["division-quotient", "division-dividend", "division-divisor"]);

  const CONFIG_ENTRAINEMENTS = Object.freeze({
    desordre: Object.freeze({questionTypes: Object.freeze(["direct"])}),
    trous: Object.freeze({questionTypes: Object.freeze(["missing"])}),
    mixte: Object.freeze({questionTypes: Object.freeze(["direct", "missing"])})
  });

  const LIBELLES_ENTRAINEMENTS = Object.freeze({
    desordre: "produits dans le désordre",
    trous: "nombres manquants",
    mixte: "produits et nombres manquants"
  });

  const LIBELLES_APPRENDS = Object.freeze({
    beads: "je pousse les perles",
    construct: "je construis la bande",
    gaps: "je complète une bande à trous",
    ordered: "je réponds dans l’ordre",
    random: "je réponds dans le désordre"
  });

  // La même chose à l'impératif, pour « Table de 3 : pousse les perles ».
  const CONSIGNES_APPRENDS = Object.freeze({
    beads: "pousse les perles",
    construct: "construis la bande",
    gaps: "complète une bande à trous",
    ordered: "réponds dans l’ordre",
    random: "réponds dans le désordre"
  });

  function cloner(valeur) {
    return JSON.parse(JSON.stringify(valeur));
  }

  // Les clés du compteur « fois » : les cinq activités de J'apprends et les
  // trois entraînements (noms distincts, un seul objet plat par table).
  const CLES_FOIS = Object.freeze([...ACTIVITES_APPRENDS, ...ENTRAINEMENTS]);
  // Les deux entraînements du raccourci vers la validation (la validation
  // pose 14 calculs directs et 6 nombres manquants : il faut les deux formes).
  const CLES_SANS_FAUTE = Object.freeze(["desordre", "trous"]);

  function foisVides() {
    return Object.fromEntries(CLES_FOIS.map(cle => [cle, 0]));
  }

  function tableVide() {
    return {
      apprends: Object.fromEntries(ACTIVITES_APPRENDS.map(activite => [activite, 0])),
      entraine: {desordre: 0, trous: 0, mixte: 0, dernier: null},
      // Lot « dosage + validation » (19/09/2026) : combien de fois chaque
      // activité et chaque entraînement ont été FAITS jusqu'au bout (réussi
      // ou non). Un état 0/1/2 dit « fait ? » et cette question a une fin ;
      // un nombre dit « combien de fois ? » et n'en a pas — c'est lui que
      // l'accueil montre, pour qu'un élève ne lise jamais « terminé » et
      // refasse le rekenrek autant qu'il veut. Une clé absente vaut 0.
      fois: foisVides(),
      // Ma séance du jour (lot 1) : les bouts de la rangée déjà réussis
      // (× 1 et × 10 ; pour la table de 10, de × 1 à × 10), le départ de la
      // prochaine séance sur l'échelle et le nombre de séances qui l'ont
      // déplacé (« n » : à la fusion, le plus récent gagne), et les deux
      // entraînements déjà réussis sans faute (le raccourci vers la validation).
      // « dernier » (lot 2) : le jour de la dernière séance jouée sur cette
      // table — c'est elle que l'accueil rouvre le lendemain.
      bouts: [],
      seance: {depart: 1, n: 0, dernier: null},
      sansFaute: {desordre: 0, trous: 0},
      acquise: null
    };
  }

  function creerParcours() {
    const tables = {};
    TABLES.forEach(table => { tables[table] = tableVide(); });
    return {
      version: VERSION,
      // L'époque monte d'un cran à chaque « Recommencer à zéro » : à la fusion,
      // l'époque la plus haute gagne entièrement, sinon l'ancien parcours d'un
      // autre appareil ressusciterait ce que l'élève vient d'effacer.
      epoque: 0,
      prenom: "",
      tables,
      melange: {tables: [], aJour: false, aRefaireAvec: null, dernier: null},
      // etoiles : 0 à 5 (5 = 👑) ; couronne : le jour de la Légende.
      expert: {etoiles: 0, dernier: null, couronne: null},
      // Le meilleur rang atteint (0 à 6) : il ne redescend jamais.
      rang: 0,
      // Les jours travaillés (jour local, « AAAA-MM-JJ »), les 14 derniers.
      jours: [],
      // Le jour de chaque séance finie (un jour peut y être plusieurs fois).
      seances: [],
      calculs: {}
    };
  }

  // Plafond du compteur « fois » (un élève qui refait une activité mille fois
  // ne casse rien ; au-delà, le nombre ne monte plus).
  const FOIS_MAX = 9999;

  function entier(valeur, minimum, maximum, defaut = 0) {
    const nombre = Number(valeur);
    if (!Number.isInteger(nombre) || nombre < minimum || nombre > maximum) return defaut;
    return nombre;
  }

  // Une date est un jour, « AAAA-MM-JJ », rien d'autre : un JSON forgé ne peut
  // pas y glisser un texte qui serait réaffiché dans la fiche.
  function dateOuNull(valeur) {
    return typeof valeur === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valeur) ? valeur : null;
  }

  // LE jour du parcours : le jour local de l'appareil, « AAAA-MM-JJ ».
  // Jusqu'au lot 2, c'était le jour UTC (toISOString) : à la Réunion (UTC+4),
  // une journée basculait à 4 h du matin, et « reviens demain » voulait dire
  // « après 4 h ». Le jour local est celui que l'élève lit sur sa montre ; c'est
  // aussi celui que le serveur de suivi et la page du professeur affichent
  // (minuit, heure de la Réunion). Une seule définition, ici, pour la grille
  // (une case par jour), les jours travaillés, les dates d'acquisition.
  function jourLocal(instant = new Date()) {
    const d = instant instanceof Date && !Number.isNaN(instant.getTime()) ? instant : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function normaliserJours(liste) {
    const jours = new Set();
    (Array.isArray(liste) ? liste : []).forEach(valeur => {
      const jour = dateOuNull(valeur);
      if (jour) jours.add(jour);
    });
    return [...jours].sort().slice(-SEUILS.jours.garder);
  }

  // Les jours des séances finies : des dates, répétées quand il y a eu
  // plusieurs séances le même jour, les plus récentes gardées.
  function normaliserSeances(liste) {
    return (Array.isArray(liste) ? liste : []).map(dateOuNull).filter(Boolean).sort().slice(-SEUILS.seance.garder);
  }

  // Les multiplicateurs HORS GRILLE d'une table : × 1 et × 10 ; pour la table
  // de 10, tous (aucun de ses calculs n'est dans la grille des 36).
  function multiplicateursBouts(table) {
    return Number(table) === 10 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [1, 10];
  }

  function normaliserBouts(table, liste) {
    const permis = multiplicateursBouts(table);
    const lus = new Set((Array.isArray(liste) ? liste : []).map(Number));
    return permis.filter(multiplicateur => lus.has(multiplicateur));
  }

  // « AAAA-MM-JJ » + n jours, en jours locaux (midi, pour ignorer les
  // changements d'heure).
  function ajouterJours(jour, nombre) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    d.setDate(d.getDate() + nombre);
    return jourLocal(d);
  }

  // Le nombre de jours entre deux jours « AAAA-MM-JJ » (second − premier).
  function ecartJours(premier, second) {
    const a = new Date(`${premier}T12:00:00`);
    const b = new Date(`${second}T12:00:00`);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.round((b - a) / 86400000);
  }

  // Le jour où un calcul revient quand il vient d'entrer dans une boîte.
  function echeanceDeBoite(boite, jour) {
    const rang = entier(boite, 1, SEUILS.revision.boites, 1);
    return ajouterJours(jour, SEUILS.revision.delais[rang - 1]);
  }

  // Le miroir « cases » (0 à 3) d'une boîte (1 à 5), gardé dans chaque calcul
  // POUR LES APPAREILS RESTÉS SUR L'APPLI D'AVANT : un onglet ouvert depuis
  // vendredi lit encore « cases » — sans ce miroir il verrait 36 calculs à
  // zéro, jouerait, et renverrait cette grille vide au serveur, où la fusion
  // (le jour le plus récent gagne) l'emporterait sur la vraie. Avec lui, il
  // lit la bonne couleur ; ce qu'il renvoie est migré comme un parcours de
  // version 2 (boîte 5 → 4 au pire). À retirer quand plus aucun appareil ne
  // parle la version 2.
  function casesDeBoite(boite) {
    return Math.min(boite - 1, 3);
  }

  function normaliserParcours(brut) {
    const parcours = creerParcours();
    if (!brut || typeof brut !== "object") return parcours;
    // Un parcours sans version, ou de version 1, vient d'avant le lot 3 : ce
    // qu'il porte est lu à l'ancienne, puis migré une seule fois (plus bas).
    const versionLue = entier(brut.version, 1, 1000, 1);
    const ancienne = versionLue < 2;
    parcours.epoque = entier(brut.epoque, 0, 1000000);
    parcours.prenom = nettoyerPrenom(brut.prenom);
    TABLES.forEach(table => {
      const source = brut.tables && brut.tables[table];
      if (!source || typeof source !== "object") return;
      const cible = parcours.tables[table];
      ACTIVITES_APPRENDS.forEach(activite => {
        cible.apprends[activite] = entier(source.apprends && source.apprends[activite], 0, 2);
      });
      ENTRAINEMENTS.forEach(entrainement => {
        cible.entraine[entrainement] = entier(source.entraine && source.entraine[entrainement], 0, 2);
      });
      const dernier = source.entraine && source.entraine.dernier;
      if (dernier && typeof dernier === "object") {
        cible.entraine.dernier = {
          entrainement: ENTRAINEMENTS.includes(dernier.entrainement) ? dernier.entrainement : "desordre",
          score: entier(dernier.score, 0, 20),
          total: entier(dernier.total, 1, 20, 10)
        };
      }
      CLES_FOIS.forEach(cle => {
        // Au-delà du plafond, on garde le plafond (pas zéro : un compteur ne
        // se perd pas parce qu'il est grand).
        cible.fois[cle] = Math.min(FOIS_MAX, entier(source.fois && source.fois[cle], 0, Number.MAX_SAFE_INTEGER));
      });
      cible.bouts = normaliserBouts(table, source.bouts);
      if (source.seance && typeof source.seance === "object") {
        cible.seance.depart = entier(source.seance.depart, 1, SEUILS.seance.departMax, 1);
        cible.seance.n = entier(source.seance.n, 0, FOIS_MAX);
        cible.seance.dernier = dateOuNull(source.seance.dernier);
      }
      CLES_SANS_FAUTE.forEach(cle => {
        cible.sansFaute[cle] = entier(source.sansFaute && source.sansFaute[cle], 0, 1);
      });
      cible.acquise = dateOuNull(source.acquise);
    });
    if (brut.melange && typeof brut.melange === "object") {
      parcours.melange.aJour = Boolean(brut.melange.aJour);
      parcours.melange.aRefaireAvec = entier(brut.melange.aRefaireAvec, 2, 10, null);
      parcours.melange.dernier = dateOuNull(brut.melange.dernier);
    }
    if (brut.expert && typeof brut.expert === "object") {
      parcours.expert.dernier = dateOuNull(brut.expert.dernier);
      if (ancienne) {
        // L'ancien escalier (★ produits / ★★ + trous / ★★★ + divisions, 2 min) :
        // seule ★★★ contenait déjà les divisions en 2 min — elle devient la
        // nouvelle ★. Champion (★★★) n'existe plus : rien à garder.
        parcours.expert.etoiles = entier(brut.expert.niveau, 0, 3) === 3 ? 1 : 0;
      } else {
        parcours.expert.etoiles = entier(brut.expert.etoiles, 0, ETOILES_MAX);
        parcours.expert.couronne = dateOuNull(brut.expert.couronne);
      }
    }
    if (!ancienne) {
      parcours.rang = entier(brut.rang, 0, RANGS.length - 1);
      parcours.jours = normaliserJours(brut.jours);
    }
    parcours.seances = normaliserSeances(brut.seances);
    if (brut.calculs && typeof brut.calculs === "object") {
      FAITS.forEach(cle => {
        const source = brut.calculs[cle];
        if (!source || typeof source !== "object") return;
        const vu = dateOuNull(source.vu);
        if (!vu) return;
        const erreur = dateOuNull(source.erreur);
        const gagne = dateOuNull(source.gagne);
        // La boîte (lot mémoire). Un parcours de version 2 — ou renvoyé par un
        // appareil resté sur l'appli d'avant — n'a que « cases » (0 à 3) :
        // cases 0/1/2/3 → boîtes 1/2/3/4, rien de vert ne redevient bleu.
        let boite = entier(source.boite, 1, SEUILS.revision.boites, 0);
        if (!boite) boite = entier(source.cases, 0, 3) + 1;
        // Le jour du retour. S'il manque (migration, ou champ jeté par un
        // vieil appareil), il est recalculé depuis la dernière date connue du
        // calcul : un rouge est dû tout de suite, les autres reviennent
        // « délai de leur boîte » après leur dernier gain (ou leur dernier
        // passage) — souvent déjà passé, donc dus aujourd'hui.
        const echeance = dateOuNull(source.echeance)
          || (boite === 1 ? vu : echeanceDeBoite(boite, gagne || vu));
        parcours.calculs[cle] = {boite, cases: casesDeBoite(boite), vu, erreur, gagne, echeance};
      });
    }
    parcours.melange.tables = tablesAcquises(parcours);
    if (parcours.melange.tables.length < SEUILS.melange.tablesMin) {
      parcours.melange.aJour = false;
      parcours.melange.aRefaireAvec = null;
    }
    if (ancienne) migrerVersion2(parcours);
    // Le rang ne redescend jamais : le meilleur du rang enregistré et de celui
    // que l'état donne — un parcours d'avant reçoit ainsi son rang.
    parcours.rang = Math.max(parcours.rang, rangDeLEtat(parcours));
    return parcours;
  }

  // La migration vers les règles du lot 3 (version 2), appliquée UNE fois, au
  // moment où un parcours d'avant est lu. Les tables acquises restent acquises
  // et la grille ne bouge pas ; l'ancien mélange (25 produits en 2 min) ne vaut
  // pas le nouveau : il est remis « à faire » pour qui a au moins 2 tables ; les
  // étoiles ont été converties plus haut (★★★ → ★). Un appareil resté sur
  // l'ancienne appli renvoie un parcours de version 1 : il repasse ici, et la
  // fusion (maximum de chaque compteur) fait que rien de ce qui a été gagné
  // sous les nouvelles règles ne se perd. (L'avis « le parcours a changé »
  // qui accompagnait cette migration a été retiré au lot 4b.)
  function migrerVersion2(parcours) {
    parcours.version = VERSION;
    parcours.expert.couronne = null;
    parcours.rang = 0;
    parcours.jours = [];
    if (parcours.melange.tables.length >= SEUILS.melange.tablesMin) {
      parcours.melange.aJour = false;
      parcours.melange.aRefaireAvec = null;
    }
  }

  // Le rang que l'état du parcours donne, sans mémoire : le rang enregistré
  // est le maximum de tous ceux-là au fil du temps.
  function rangDeLEtat(parcours) {
    const acquises = tablesAcquises(parcours).length;
    const etoiles = parcours.expert.etoiles;
    if (etoiles >= ETOILES_MAX) return 6;
    if (etoiles >= ETOILES_MAX - 1) return 5;
    if (acquises === TABLES.length && parcours.melange.aJour) return 4;
    if (acquises >= SEUILS_RANG.or) return 3;
    if (acquises >= SEUILS_RANG.argent) return 2;
    if (acquises >= 1) return 1;
    return 0;
  }

  function rang(niveau) {
    return RANGS[entier(niveau, 0, RANGS.length - 1)];
  }

  // Vrai tant que le mélange est dû : dès 2 tables acquises et tant qu'il n'est
  // pas « à jour ». C'est lui qui verrouille « Je valide » des autres tables.
  function melangeDu(parcours) {
    return tablesAcquises(parcours).length >= SEUILS.melange.tablesMin && !parcours.melange.aJour;
  }

  // L'escalier des étoiles n'est ouvert que quand les 9 tables sont acquises ET
  // que le dernier mélange (avec les 9) est réussi.
  function escalierOuvert(parcours) {
    return toutesAcquises(parcours) && parcours.melange.aJour;
  }

  // Note un jour travaillé (au plus SEUILS.jours.garder jours gardés).
  function noterJour(parcours, date) {
    const jour = dateOuNull(date);
    if (!jour || parcours.jours.includes(jour)) return;
    parcours.jours = normaliserJours([...parcours.jours, jour]);
  }

  // Le lundi de la semaine d'un jour « AAAA-MM-JJ » (semaine du lundi au dimanche).
  function lundiDe(jour) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    const recul = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - recul);
    return jourLocal(d);
  }

  // « N jours cette semaine » : les jours travaillés depuis le lundi, aujourd'hui
  // compris ; « dus » : les calculs du jour ; « demain » : ce qui attendra
  // demain si rien d'autre n'est joué (les dus d'aujourd'hui restés dus, plus
  // ceux qui reviennent demain). Rien de punitif, jamais de série à ne pas casser.
  function bilanJours(parcours, aujourdhui = jourLocal()) {
    const lundi = lundiDe(aujourdhui);
    const semaine = parcours.jours.filter(jour => jour >= lundi && jour <= aujourdhui).length;
    const agenda = agendaCalculs(parcours, aujourdhui);
    return {semaine, dus: agenda.dus, demain: agenda.demain, aujourdhui: parcours.jours.includes(aujourdhui)};
  }

  function nettoyerPrenom(valeur) {
    if (typeof valeur !== "string") return "";
    return valeur.replace(/\s+/g, " ").trim().slice(0, PRENOM_MAX);
  }

  function definirPrenom(parcours, prenom) {
    const copie = cloner(parcours);
    copie.prenom = nettoyerPrenom(prenom);
    return copie;
  }

  function remettreAZero(parcours) {
    const neuf = creerParcours();
    neuf.prenom = parcours && typeof parcours.prenom === "string" ? nettoyerPrenom(parcours.prenom) : "";
    neuf.epoque = entier(parcours && parcours.epoque, 0, 1000000) + 1;
    return neuf;
  }

  function tablesAcquises(parcours) {
    return TABLES.filter(table => Boolean(parcours.tables[table] && parcours.tables[table].acquise));
  }

  function toutesAcquises(parcours) {
    return tablesAcquises(parcours).length === TABLES.length;
  }

  function memesTables(premieres, secondes) {
    if (premieres.length !== secondes.length) return false;
    const tri = liste => [...liste].map(Number).sort((a, b) => a - b);
    const a = tri(premieres);
    const b = tri(secondes);
    return a.every((valeur, index) => valeur === b[index]);
  }

  function tableDuParcours(config) {
    if (!config || !Array.isArray(config.tables) || config.tables.length !== 1) return null;
    const table = Number(config.tables[0]);
    return TABLES.includes(table) ? table : null;
  }

  function entrainementDeConfig(config) {
    const types = [...new Set(config.questionTypes || [])].sort().join("+");
    if (types === "direct") return "desordre";
    if (types === "missing") return "trous";
    if (types === "direct+missing") return "mixte";
    return null;
  }

  // Dit ce qu'une série représente pour le parcours (ou null si elle ne compte pas).
  function classerSerie(parcours, config) {
    if (!config || !config.mode) return null;
    const table = tableDuParcours(config);
    if (config.mode === "learn") {
      if (table === null || !ACTIVITES_APPRENDS.includes(config.learnActivity)) return null;
      return {type: "apprends", table, activite: config.learnActivity};
    }
    if (config.mode === "train") {
      const entrainement = entrainementDeConfig(config);
      if (table === null || !entrainement || Number(config.total) !== SEUILS.entrainement.total) return null;
      return {type: "entraine", table, entrainement};
    }
    if (config.mode === "validation") {
      const duree = Number(config.duration);
      if (Number(config.total) !== SEUILS.validation.total || !duree) return null;
      // Le mélange a le format de la validation, sur EXACTEMENT les tables
      // acquises (au moins 2), en 1 min 30 — un mélange choisi à la main, ou
      // joué en 2 ou 3 minutes, ne compte pas.
      const tables = (config.tables || []).map(Number);
      if (tables.length > 1) {
        const acquises = tablesAcquises(parcours);
        if (acquises.length >= SEUILS.melange.tablesMin && memesTables(tables, acquises) && duree <= SEUILS.melange.dureeMax) {
          return {type: "melange", tables: acquises};
        }
        return null;
      }
      if (table === null) return null;
      return duree <= SEUILS.validation.dureeMax
        ? {type: "validation", table}
        : {type: "preparation", table, duree};
    }
    if (config.mode === "test") {
      // Une marche de l'escalier : 25 questions, produits + trous + divisions
      // (niveau 3), les tables 2 à 10, et une des cinq durées. L'escalier doit
      // être ouvert : sinon la série ne compte pas.
      const duree = Number(config.duration);
      const etoile = SEUILS.etoile.durees.indexOf(duree) + 1;
      if (Number(config.total) !== SEUILS.etoile.total || !etoile || entier(config.testLevel, 1, 3, 1) !== 3) return null;
      if (!memesTables((config.tables || []).map(Number), TABLES) || !escalierOuvert(parcours)) return null;
      return {type: "etoile", etoile};
    }
    return null;
  }

  function demarrerSerie(parcours, config) {
    const classement = classerSerie(parcours, config);
    if (!classement || classement.type !== "apprends") return parcours;
    const copie = cloner(parcours);
    const ligne = copie.tables[classement.table];
    if (ligne.apprends[classement.activite] === 0) ligne.apprends[classement.activite] = 1;
    return copie;
  }

  // Une table de plus : dès la deuxième, le mélange est dû (« à faire », puis
  // « à refaire avec la table de N ») — y compris la neuvième, dont le mélange
  // ouvre l'escalier des étoiles.
  function acquerir(copie, table, date, evenements) {
    const ligne = copie.tables[table];
    if (ligne.acquise) return false;
    ligne.acquise = date;
    const acquises = tablesAcquises(copie);
    copie.melange.tables = acquises;
    if (acquises.length >= SEUILS.melange.tablesMin) {
      const etaitAJour = copie.melange.aJour;
      copie.melange.aJour = false;
      copie.melange.aRefaireAvec = acquises.length === SEUILS.melange.tablesMin ? null : table;
      if (acquises.length === SEUILS.melange.tablesMin) evenements.push({type: "melange-debloque", tables: acquises});
      else if (etaitAJour) evenements.push({type: "melange-a-refaire", table, tables: acquises});
    }
    if (toutesAcquises(copie)) evenements.push({type: "toutes-acquises"});
    return true;
  }

  // Le rang a-t-il monté ? Alors un événement le dit (écran de rang).
  function relancerRang(copie, evenements) {
    const nouveau = rangDeLEtat(copie);
    if (nouveau <= copie.rang) return;
    copie.rang = nouveau;
    evenements.push({type: "rang", rang: nouveau, nom: RANGS[nouveau].nom, cle: RANGS[nouveau].cle});
  }

  // Applique une série TERMINÉE au parcours. resultat = {correct, total, date}.
  function appliquerSerie(parcours, config, resultat) {
    const evenements = [];
    const classement = classerSerie(parcours, config);
    if (!classement) return {parcours, evenements, classement: null};
    const copie = cloner(parcours);
    const date = dateOuNull(resultat && resultat.date) || jourLocal();
    const correct = entier(resultat && resultat.correct, 0, 100);
    const total = entier(resultat && resultat.total, 1, 100, 1);
    const erreurs = total - correct;

    if (classement.type === "apprends") {
      const ligne = copie.tables[classement.table];
      ligne.apprends[classement.activite] = 2;
      ligne.fois[classement.activite] = Math.min(FOIS_MAX, ligne.fois[classement.activite] + 1);
      const termines = ACTIVITES_APPRENDS.filter(activite => ligne.apprends[activite] === 2).length;
      evenements.push({type: "apprends", table: classement.table, activite: classement.activite, termines, fois: ligne.fois[classement.activite]});
    } else if (classement.type === "entraine") {
      const ligne = copie.tables[classement.table];
      const reussi = erreurs <= SEUILS.entrainement.erreursMax;
      const dejaReussi = ligne.entraine[classement.entrainement] === 2;
      if (reussi) ligne.entraine[classement.entrainement] = 2;
      else if (ligne.entraine[classement.entrainement] === 0) ligne.entraine[classement.entrainement] = 1;
      ligne.entraine.dernier = {entrainement: classement.entrainement, score: correct, total};
      // Un entraînement terminé compte, réussi ou non : c'est le nombre de
      // fois où l'élève s'est entraîné, pas le nombre de réussites (les
      // ronds disent déjà « réussi »).
      ligne.fois[classement.entrainement] = Math.min(FOIS_MAX, ligne.fois[classement.entrainement] + 1);
      // 10 sur 10 : retenu pour le raccourci vers la validation (lot séance).
      if (!erreurs && CLES_SANS_FAUTE.includes(classement.entrainement)) ligne.sansFaute[classement.entrainement] = 1;
      const reussites = ENTRAINEMENTS.filter(entrainement => ligne.entraine[entrainement] === 2).length;
      evenements.push({
        type: "entraine",
        table: classement.table,
        entrainement: classement.entrainement,
        reussi,
        nouveau: reussi && !dejaReussi,
        score: correct,
        total,
        reussites,
        pret: reussites === ENTRAINEMENTS.length,
        fois: ligne.fois[classement.entrainement],
        // Les trois réussis ET les 8 calculs en boîte 3 : « tu peux valider » ;
        // sinon l'écran de résultat annonce le rendez-vous (validationTable).
        validation: validationTable(copie, classement.table, date)
      });
    } else if (classement.type === "validation") {
      const reussi = erreurs <= SEUILS.validation.erreursMax;
      const dejaAcquise = Boolean(copie.tables[classement.table].acquise);
      // Le verrou : tant que le mélange est dû, une NOUVELLE table ne se valide
      // pas — la série est jouée, comptée dans la grille, mais la table reste à
      // valider après le mélange. Une table déjà acquise se rejoue librement.
      // Sauf sur le premier écran (« Tu connais déjà des tables ? », lot 2) :
      // l'élève y valide d'affilée les tables qu'il sait déjà ; le mélange
      // dû ouvrira sa première séance.
      const verrouillee = !dejaAcquise && melangeDu(copie) && !(resultat && resultat.decouverte);
      const evenement = {type: "validation", table: classement.table, reussi, score: correct, total, dejaAcquise, nouvelle: false, verrouillee};
      evenements.push(evenement);
      if (reussi && !verrouillee) evenement.nouvelle = acquerir(copie, classement.table, date, evenements);
    } else if (classement.type === "preparation") {
      const reussi = erreurs <= SEUILS.validation.erreursMax;
      evenements.push({type: "preparation", table: classement.table, reussi, score: correct, total, duree: classement.duree});
    } else if (classement.type === "melange") {
      const reussi = erreurs <= SEUILS.melange.erreursMax;
      const evenement = {type: "melange", reussi, score: correct, total, tables: classement.tables, escalierOuvert: false};
      if (reussi) {
        copie.melange.aJour = true;
        copie.melange.aRefaireAvec = null;
        copie.melange.dernier = date;
        evenement.escalierOuvert = escalierOuvert(copie);
      }
      evenements.push(evenement);
    } else if (classement.type === "etoile") {
      const reussi = erreurs <= SEUILS.etoile.erreursMax;
      const avant = copie.expert.etoiles;
      const evenement = {type: "etoile", etoile: classement.etoile, reussi, score: correct, total, etoilesAvant: avant, nouveau: false, couronne: false};
      evenements.push(evenement);
      if (reussi) {
        copie.expert.dernier = date;
        // Une étoile réussie valide les précédentes ; une marche déjà gagnée
        // ne retire rien.
        if (classement.etoile > avant) {
          copie.expert.etoiles = classement.etoile;
          evenement.nouveau = true;
        }
        if (copie.expert.etoiles === ETOILES_MAX && !copie.expert.couronne) {
          copie.expert.couronne = date;
          evenement.couronne = true;
        }
      }
    }
    relancerRang(copie, evenements);
    return {parcours: copie, evenements, classement};
  }

  // Configurations prêtes à donner à l'appli (à normaliser par le moteur de questions).
  function configApprends(table, activite) {
    return {mode: "learn", tables: [table], learnActivity: activite};
  }

  function configEntraine(table, entrainement) {
    return {mode: "train", tables: [table], total: SEUILS.entrainement.total, questionTypes: [...CONFIG_ENTRAINEMENTS[entrainement].questionTypes]};
  }

  function configValidation(table, duree = SEUILS.validation.dureeMax) {
    return {mode: "validation", tables: [table], total: SEUILS.validation.total, duration: duree};
  }

  // Le mélange de mes tables acquises : le format de la validation, sur toutes
  // les tables acquises (au moins 2) — jusqu'aux 9.
  function configMelange(parcours) {
    const acquises = tablesAcquises(parcours);
    if (acquises.length < SEUILS.melange.tablesMin) return null;
    return {mode: "validation", tables: acquises, total: SEUILS.melange.total, duration: SEUILS.melange.dureeMax};
  }

  // Une marche de l'escalier (1 à 5) : tout, de plus en plus vite.
  function configEtoile(etoile) {
    const marche = entier(etoile, 1, ETOILES_MAX, 1);
    return {mode: "test", tables: [...TABLES], testLevel: 3, total: SEUILS.etoile.total, duration: SEUILS.etoile.durees[marche - 1]};
  }

  function dureeEtoile(etoile) {
    return SEUILS.etoile.durees[entier(etoile, 1, ETOILES_MAX, 1) - 1];
  }

  /* ---------- Mes calculs (grille des 36 faits) ---------- */

  function dateDuJour(valeur) {
    return dateOuNull(valeur) || jourLocal();
  }

  function melanger(valeurs, random = Math.random) {
    const copie = valeurs.slice();
    for (let index = copie.length - 1; index > 0; index -= 1) {
      const echange = Math.floor(random() * (index + 1));
      [copie[index], copie[echange]] = [copie[echange], copie[index]];
    }
    return copie;
  }

  // Normalise une clé de fait (« 7-8 », « 8-7 »…) vers « min-max », ou null si
  // le calcul est hors grille (facteur 0, 1 ou 10).
  function cleFait(valeur) {
    const partie = String(valeur ?? "").split("-").map(Number);
    if (partie.length !== 2 || partie.some(nombre => !Number.isInteger(nombre))) return null;
    const premier = Math.min(partie[0], partie[1]);
    const second = Math.max(partie[0], partie[1]);
    if (premier < FAIT_MIN || second > FAIT_MAX) return null;
    return `${premier}-${second}`;
  }

  function facteursFait(cle) {
    const [premier, second] = cle.split("-").map(Number);
    return [premier, second];
  }

  function libelleFait(cle) {
    const [premier, second] = facteursFait(cle);
    return `${premier} × ${second}`;
  }

  function faitsDeLaTable(table) {
    return FAITS.filter(cle => facteursFait(cle).includes(Number(table)));
  }

  // Les trois couleurs ne bougent pas avec les cinq boîtes : rouge « à revoir »
  // = boîte 1, bleu « en route » = boîtes 2 et 3, vert « su » = boîtes 4 et 5.
  const BOITE_SU = 4;

  function etatFait(fait) {
    if (!fait) return "jamais-vu";
    if (fait.boite >= BOITE_SU) return "su";
    if (fait.boite <= 1) return "a-travailler";
    return "en-cours";
  }

  // Un calcul est dû quand son jour de retour est arrivé (ou passé) — sauf
  // s'il a été raté ce jour-là : il est déjà revenu une fois en fin de série
  // (règle du 09/09), il ne peut plus monter aujourd'hui (pas de regain le
  // jour d'une erreur), le reproposer ne servirait qu'à tourner en rond.
  // Il sera dû demain.
  function faitDu(fait, aujourdhui = jourLocal()) {
    return Boolean(fait) && (!fait.echeance || fait.echeance <= aujourdhui) && fait.erreur !== aujourdhui;
  }

  // La grille Mes calculs appartient à Mon parcours : elle se remplit dans les
  // séries du parcours (Je m'entraîne, validations, mélanges, Expert) et dans
  // les révisions — jamais pendant J'apprends (on y construit la table de
  // proche en proche, on ne répond pas de mémoire), et jamais dans Réglages ni
  // l'évaluation CM1, qui restent complètement à part du parcours.
  function serieAlimenteGrille(config) {
    if (!config || !config.mode) return false;
    return ["train", "validation", "test", "revision"].includes(config.mode);
  }

  // Applique UNE réponse à la grille. reponse = {correcte, date}.
  // Lot mémoire : un calcul monte d'une boîte quand il est DÛ et réussi ; pas
  // dû, une bonne réponse ne change rien (savoir, c'est retrouver le calcul le
  // jour où il revient, pas le répéter dans l'heure). Une erreur = une boîte de
  // moins, et le calcul revient aujourd'hui ; ce jour-là, pas de regain sur ce
  // calcul : le raté « revient dans un nouveau défi » (Claire), un autre jour.
  // Les erreurs comptent toujours, sans limite : une réussite juste après la
  // correction prouve peu, une erreur prouve beaucoup.
  function appliquerReponse(parcours, cleBrute, reponse = {}) {
    const cle = cleFait(cleBrute);
    if (!cle) {
      // Hors grille : un bout de rangée (× 1, × 10, la table de 10). Il se
      // remplit à la première réussite et ne se vide plus ; rien d'autre ne
      // bouge (ni boîte, ni jour travaillé).
      const bouts = reponse.correcte ? boutsDuCalcul(cleBrute).filter(([table, multiplicateur]) => !parcours.tables[table].bouts.includes(multiplicateur)) : [];
      if (!bouts.length) return {parcours, fait: null, bouts: []};
      const copie = cloner(parcours);
      bouts.forEach(([table, multiplicateur]) => {
        copie.tables[table].bouts = normaliserBouts(table, [...copie.tables[table].bouts, multiplicateur]);
      });
      return {parcours: copie, fait: null, bouts};
    }
    const copie = cloner(parcours);
    const date = dateDuJour(reponse.date);
    // Un jour compte dès qu'une série de la grille est jouée (Je m'entraîne,
    // validations, mélanges, étoiles, révisions) — jamais J'apprends.
    noterJour(copie, date);
    const avant = copie.calculs[cle] || null;
    // Un calcul jamais vu part de la boîte 1, dû : sa première réponse compte.
    const du = !avant || faitDu(avant, date);
    const fait = {
      boite: avant ? avant.boite : 1,
      cases: 0,
      vu: date,
      erreur: avant ? avant.erreur : null,
      gagne: avant ? avant.gagne : null,
      echeance: avant ? avant.echeance : date
    };
    let monte = false;
    let descend = false;
    if (reponse.correcte) {
      if (du && fait.erreur !== date) {
        if (fait.boite < SEUILS.revision.boites) {
          fait.boite += 1;
          monte = true;
        }
        // Boîte 5 : la réussite renouvelle l'échéance — l'entretien.
        fait.gagne = date;
        fait.echeance = echeanceDeBoite(fait.boite, date);
      }
    } else {
      descend = fait.boite > 1;
      fait.boite = Math.max(1, fait.boite - 1);
      fait.erreur = date;
      fait.echeance = date;
    }
    fait.cases = casesDeBoite(fait.boite);
    copie.calculs[cle] = fait;
    return {parcours: copie, fait: {cle, boite: fait.boite, etat: etatFait(fait), du, monte, descend, echeance: fait.echeance}};
  }

  // Les bouts qu'un calcul hors grille remplit : [table, multiplicateur].
  // « 3-10 » est le × 10 de la table de 3 ET le × 3 de la table de 10.
  function boutsDuCalcul(cleBrute) {
    const partie = String(cleBrute ?? "").split("-").map(Number);
    if (partie.length !== 2 || partie.some(nombre => !Number.isInteger(nombre))) return [];
    const [premier, second] = partie;
    const paires = premier === second ? [[premier, second]] : [[premier, second], [second, premier]];
    return paires.filter(([table, multiplicateur]) => TABLES.includes(table) && multiplicateursBouts(table).includes(multiplicateur));
  }

  // Le résumé de la grille : par couleur, par boîte, et le nombre de calculs
  // dus aujourd'hui.
  function resumeCalculs(parcours, aujourdhui = jourLocal()) {
    const resume = {sus: 0, enCours: 0, aTravailler: 0, jamaisVus: 0, dus: 0, total: FAITS.length, boites: new Array(SEUILS.revision.boites).fill(0)};
    FAITS.forEach(cle => {
      const fait = parcours.calculs[cle];
      const etat = etatFait(fait);
      if (etat === "su") resume.sus += 1;
      else if (etat === "en-cours") resume.enCours += 1;
      else if (etat === "a-travailler") resume.aTravailler += 1;
      else resume.jamaisVus += 1;
      if (fait) {
        resume.boites[fait.boite - 1] += 1;
        if (faitDu(fait, aujourdhui)) resume.dus += 1;
      }
    });
    return resume;
  }

  // La grille 8×8 prête à afficher : lignes 2 à 9, colonnes 2 à 9. La moitié
  // haute (ligne ≤ colonne) est active, l'autre est le miroir grisé du même fait.
  function grilleCalculs(parcours, aujourdhui = jourLocal()) {
    const facteurs = Array.from({length: FAIT_MAX - FAIT_MIN + 1}, (_, index) => index + FAIT_MIN);
    const lignes = facteurs.map(ligne => ({
      ligne,
      cellules: facteurs.map(colonne => {
        const cle = cleFait(`${ligne}-${colonne}`);
        const fait = parcours.calculs[cle] || null;
        return {
          ligne,
          colonne,
          cle,
          active: ligne <= colonne,
          boite: fait ? fait.boite : 0,
          etat: etatFait(fait),
          du: faitDu(fait, aujourdhui),
          echeance: fait ? fait.echeance : null,
          vu: fait ? fait.vu : null,
          erreur: fait ? fait.erreur : null
        };
      })
    }));
    return {lignes, resume: resumeCalculs(parcours, aujourdhui)};
  }

  // Les calculs d'une boîte (1 à 5), dans l'ordre de la grille.
  function calculsDeLaBoite(parcours, boite) {
    const rang = entier(boite, 1, SEUILS.revision.boites, 0);
    return FAITS.filter(cle => parcours.calculs[cle] && parcours.calculs[cle].boite === rang);
  }

  function trierParEcheance(entrees) {
    return entrees.slice().sort((premier, second) =>
      String(premier[1].echeance || "").localeCompare(String(second[1].echeance || ""))
      || String(premier[1].vu || "").localeCompare(String(second[1].vu || "")));
  }

  // Les calculs dus aujourd'hui, dans l'ordre de la révision : les boîtes à
  // TOUR DE RÔLE (un rouge, un boîte 2, un boîte 3, un boîte 4, un boîte 5, un
  // rouge…), les plus en retard d'abord dans chaque boîte. Décision de Gwenaël
  // (12/09) : avec « les rouges d'abord », un élève revenu après une semaine
  // ouvrait sur dix calculs durs d'affilée ; à tour de rôle, chaque série de
  // 10 mêle du dur et du facile, et tout est couvert à la fin — bleus et verts
  // compris, c'est l'entretien. Jamais un calcul jamais rencontré.
  function calculsDus(parcours, {aujourdhui = jourLocal(), table = null} = {}) {
    const dansLaTable = cle => table === null || facteursFait(cle).includes(Number(table));
    const dus = Object.entries(parcours.calculs).filter(([cle, fait]) => dansLaTable(cle) && faitDu(fait, aujourdhui));
    return tourDeRole(dus.map(([cle, fait]) => [cle, fait]));
  }

  // Entrelace des entrées [cle, fait] boîte par boîte, chaque boîte triée par
  // échéance (le plus en retard, ou le plus proche, d'abord).
  function tourDeRole(entrees) {
    const files = Array.from({length: SEUILS.revision.boites}, (_, index) =>
      trierParEcheance(entrees.filter(([, fait]) => fait.boite === index + 1)).map(([cle]) => cle));
    const ordre = [];
    while (files.some(file => file.length)) {
      files.forEach(file => { if (file.length) ordre.push(file.shift()); });
    }
    return ordre;
  }

  // « Encore 10 calculs » quand plus rien n'est dû : les calculs connus qui
  // reviennent le plus tôt, boîtes à tour de rôle — pour s'entraîner. Rien ne
  // monte (rien n'est dû), une erreur descend : la même règle que partout.
  function calculsAVenir(parcours, {aujourdhui = jourLocal(), table = null} = {}) {
    const dansLaTable = cle => table === null || facteursFait(cle).includes(Number(table));
    const aVenir = Object.entries(parcours.calculs).filter(([cle, fait]) => dansLaTable(cle) && !faitDu(fait, aujourdhui));
    return tourDeRole(aVenir);
  }

  // Les calculs en retard : dus AVANT aujourd'hui et pas encore refaits. C'est
  // le compteur de la page du professeur — rien d'autre n'y est ajouté.
  function calculsEnRetard(parcours, aujourdhui = jourLocal()) {
    return Object.entries(parcours.calculs)
      .filter(([, fait]) => fait.echeance && fait.echeance < aujourdhui)
      .map(([cle]) => cle);
  }

  // L'agenda de la grille : combien de calculs sont dus aujourd'hui, combien
  // attendront demain si rien d'autre n'est joué, et le prochain jour où
  // quelque chose revient (avec son nombre) — pour « Reviens demain : N
  // calculs t'attendront ».
  function agendaCalculs(parcours, aujourdhui = jourLocal()) {
    const faits = Object.values(parcours.calculs);
    const demainJour = ajouterJours(aujourdhui, 1);
    const dus = faits.filter(fait => faitDu(fait, aujourdhui)).length;
    const demain = faits.filter(fait => faitDu(fait, demainJour)).length;
    const aVenir = faits.map(fait => fait.echeance).filter(jour => jour && jour > aujourdhui).sort();
    // Le prochain jour (après aujourd'hui) où un calcul revient, et tout ce qui
    // sera dû ce jour-là — les dus d'aujourd'hui restés dus compris.
    let prochain = null;
    if (demain) prochain = {jour: demainJour, dans: 1, calculs: demain};
    else if (aVenir.length) {
      const jour = aVenir[0];
      prochain = {jour, dans: ecartJours(aujourdhui, jour), calculs: faits.filter(fait => faitDu(fait, jour)).length};
    }
    return {dus, demain, prochain};
  }

  function trierParErreurRecente(entrees) {
    return entrees.slice().sort((premier, second) => String(second[1].erreur || "").localeCompare(String(premier[1].erreur || "")));
  }

  function calculsATravailler(parcours, table = null) {
    const dansLaTable = cle => table === null || facteursFait(cle).includes(Number(table));
    const entrees = Object.entries(parcours.calculs)
      .filter(([cle, fait]) => dansLaTable(cle) && etatFait(fait) === "a-travailler");
    return trierParErreurRecente(entrees).map(([cle]) => cle);
  }

  // Tables acquises dont au moins 2 calculs sont « à travailler » : le ✓ reste,
  // la carte gagne un repère « à revoir ».
  function tablesARevoir(parcours) {
    return tablesAcquises(parcours).filter(table => calculsATravailler(parcours, table).length >= SEUILS.revision.aRevoirMin);
  }

  // Le plan de révision (lot mémoire) : LES CALCULS DUS AUJOURD'HUI, dans
  // l'ordre de calculsDus — rouges d'abord, puis par ancienneté d'échéance,
  // verts compris — et RIEN d'autre, 10 à la fois ; s'il en reste, la série
  // suivante prend les suivants. La révision ne propose JAMAIS un calcul
  // jamais vu (décision de Gwenaël, spécification du 29/08/2026 rappelée le
  // 08/09) : elle répare et entretient ce que la grille connaît, et la grille
  // se remplit dans les entraînements, les validations, les mélanges et les
  // étoiles. Rien de dû (ou grille vide) = aucune question.
  // « libre » (Encore 10 calculs) : plus rien n'est dû, on prend les prochains
  // à revenir. L'ordre de passage est mélangé dans les deux cas.
  function planRevision(parcours, {table = null, random = Math.random, aujourdhui = jourLocal(), libre = false} = {}) {
    const source = libre ? calculsAVenir(parcours, {aujourdhui, table}) : calculsDus(parcours, {aujourdhui, table});
    const selection = melanger(source.slice(0, SEUILS.revision.total), random);
    // La forme suit ce que l'élève a déjà rencontré (décision de Gwenaël,
    // 12/09) : produit toujours ; trou seulement si l'une des deux tables du
    // calcul a passé l'entraînement « trous » ou est acquise (la validation en
    // contient) ; division dès la première étoile (elles y sont). Les formes
    // permises alternent d'une question à l'autre.
    return selection.map((cle, index) => {
      const [premier, second] = melanger(facteursFait(cle), random);
      const permises = formesPermises(parcours, cle);
      const categorie = permises[index % permises.length];
      const type = categorie === "direct"
        ? "direct"
        : categorie === "division"
          ? FORMES_DIVISION[Math.floor(random() * FORMES_DIVISION.length)]
          : FORMES_TROU[Math.floor(random() * FORMES_TROU.length)];
      return {cle, type, first: premier, second};
    });
  }

  // Les formes qu'un calcul peut prendre en révision, dans l'ordre où elles
  // alternent : « direct » toujours ; « missing » si une de ses tables a réussi
  // l'entraînement « trous » ou est acquise ; « division » dès une étoile.
  function formesPermises(parcours, cle) {
    const formes = ["direct"];
    const trous = facteursFait(cle).some(table => {
      const ligne = parcours.tables[table];
      return Boolean(ligne) && (ligne.entraine.trous === 2 || Boolean(ligne.acquise));
    });
    if (trous) formes.push("missing");
    if (parcours.expert.etoiles >= 1) formes.push("division");
    return formes;
  }

  function configRevision(table = null) {
    return {mode: "revision", table: TABLES.includes(Number(table)) ? Number(table) : null};
  }

  // Le point sur la validation d'une table (lot « dosage + validation »,
  // 19/09/2026) : ses 8 calculs (pour la table de 7 : 2-7, 3-7, 4-7, 5-7,
  // 6-7, 7-7, 7-8, 7-9 — ni ×0, ni ×1, ni ×10, clé « min-max ») et où ils
  // en sont. « prets » : en boîte 3 ou plus. Les autres : jamais rencontrés
  // (« inconnus »), dus aujourd'hui (« dus »), ou attendus plus tard
  // (« prochain » = le premier jour où l'un d'eux revient, et dans combien
  // de jours). C'est ce que l'accueil lit pour dire « tes 8 calculs ont
  // rendez-vous demain ».
  function validationTable(parcours, table, aujourdhui = jourLocal()) {
    const faits = faitsDeLaTable(table);
    let prets = 0, inconnus = 0, dus = 0;
    const aVenir = [];
    faits.forEach(cle => {
      const fait = parcours.calculs[cle];
      if (!fait) { inconnus += 1; return; }
      if (fait.boite >= SEUILS.validation.boiteMin) { prets += 1; return; }
      if (faitDu(fait, aujourdhui)) { dus += 1; return; }
      // Pas dû aujourd'hui : soit son jour de retour est à venir, soit il a
      // été raté aujourd'hui (il revient demain).
      aVenir.push(fait.echeance && fait.echeance > aujourdhui ? fait.echeance : ajouterJours(aujourdhui, 1));
    });
    aVenir.sort();
    const prochain = aVenir.length ? {jour: aVenir[0], dans: ecartJours(aujourdhui, aVenir[0])} : null;
    return {total: faits.length, prets, inconnus, dus, aVenir: aVenir.length, prochain, prete: prets === faits.length};
  }

  // L'étape conseillée d'une table — le rond bleu de l'accueil. Règle de
  // Gwenaël (10/09/2026) : J'apprends tant que les cinq activités ne sont pas
  // TOUTES terminées ET qu'aucun entraînement n'est réussi ; dès que l'un des
  // deux est vrai, Je m'entraîne ; les trois entraînements réussis, la
  // validation. « Finir un J'apprends ne veut pas dire qu'il connaît » — et
  // celui qui réussit un entraînement de lui-même n'a plus à découvrir la
  // table. Jusqu'au lot 4a, J'apprends n'était conseillé qu'à une table jamais
  // touchée : la première activité commencée envoyait déjà s'entraîner.
  // Depuis le 19/09/2026 : les trois entraînements réussis ne suffisent plus,
  // il faut AUSSI les 8 calculs de la table en boîte 3 (validationTable) —
  // sinon le rond reste sur Je m'entraîne et l'accueil explique le
  // rendez-vous. Sans grille (ancien appel avec la ligne seule), la règle
  // d'avant s'applique.
  function conseilTable(ligne, validation = null) {
    if (ligne.acquise) return "valide";
    const reussites = ENTRAINEMENTS.filter(entrainement => ligne.entraine[entrainement] === 2).length;
    if (reussites === ENTRAINEMENTS.length && (!validation || validation.prete)) return "valide";
    const toutesTerminees = ACTIVITES_APPRENDS.every(activite => ligne.apprends[activite] === 2);
    return !toutesTerminees && !reussites ? "apprends" : "entraine";
  }

  function etapeTable(parcours, table, aujourdhui = jourLocal()) {
    const ligne = parcours.tables[table];
    if (ligne.acquise) return null;
    const conseil = conseilTable(ligne, validationTable(parcours, table, aujourdhui));
    if (conseil === "valide") {
      return {type: "validation", table, libelle: `Table de ${table} : valide ta table (20 questions en 1 min 30)`, config: configValidation(table)};
    }
    if (conseil === "apprends") {
      // La première activité qui n'est pas terminée, dans l'ordre : les perles d'abord.
      const activite = ACTIVITES_APPRENDS.find(candidat => ligne.apprends[candidat] !== 2);
      return {type: "apprends", table, activite, libelle: `Table de ${table} : ${CONSIGNES_APPRENDS[activite]}`, config: configApprends(table, activite)};
    }
    // Les trois déjà réussis (on attend la boîte 3) : celui refait le moins
    // souvent, le premier en cas d'égalité.
    const entrainement = ENTRAINEMENTS.find(candidat => ligne.entraine[candidat] !== 2)
      || ENTRAINEMENTS.reduce((moins, candidat) => (ligne.fois[candidat] < ligne.fois[moins] ? candidat : moins), ENTRAINEMENTS[0]);
    return {
      type: "entraine",
      table,
      entrainement,
      libelle: `Table de ${table} : entraînement « ${LIBELLES_ENTRAINEMENTS[entrainement]} »`,
      config: configEntraine(table, entrainement)
    };
  }

  function prochaineEtape(parcours, aujourdhui = jourLocal()) {
    // Des calculs sont dus : « Mes calculs du jour » passe devant tout — un
    // conseil (le rond bleu), jamais un verrou. Plus rien de dû, le bloc
    // s'efface et la table reprend le conseil.
    const dus = calculsDus(parcours, {aujourdhui}).length;
    if (dus) {
      return {
        type: "revision",
        dus,
        libelle: `Mes calculs du jour : ${dus} calcul${dus > 1 ? "s" : ""} à réviser (sans chrono)`,
        config: configRevision()
      };
    }
    const acquises = tablesAcquises(parcours);
    // Le mélange dû passe avant tout le reste du parcours : il verrouille
    // « Je valide » des autres tables (J'apprends et Je m'entraîne restent
    // libres), et c'est lui qui ouvre l'escalier après la neuvième table.
    if (melangeDu(parcours)) {
      const avec = parcours.melange.aRefaireAvec;
      return {
        type: "melange",
        libelle: toutesAcquises(parcours)
          ? "Réussis le mélange de tes 9 tables pour ouvrir l’escalier des étoiles"
          : avec ? `Refais le mélange de tes tables acquises avec la table de ${avec}` : `Mélange tes tables acquises (${acquises.join(", ")})`,
        config: configMelange(parcours)
      };
    }
    for (const table of ORDRE_CONSEIL) {
      const etape = etapeTable(parcours, table, aujourdhui);
      if (etape) return etape;
    }
    if (parcours.expert.etoiles < ETOILES_MAX) {
      const etoile = parcours.expert.etoiles + 1;
      return {type: "etoile", etoile, libelle: `Tenter ${symboleEtoile(etoile)} : toutes les tables en ${libelleDuree(dureeEtoile(etoile))}`, config: configEtoile(etoile)};
    }
    // Légende des tables — mais les étoiles valident par échantillon
    // (25 questions) : le parcours ne dit « fini » que quand chacun des 36
    // calculs de la grille est vert — c'est elle, la preuve complète. Rien
    // n'est dû aujourd'hui (sinon on ne serait pas ici) : les calculs pas
    // encore verts reviendront d'eux-mêmes dans « Mes calculs du jour » ;
    // ceux qui n'ont jamais été rencontrés le seront en rejouant une marche.
    const resume = resumeCalculs(parcours, aujourdhui);
    const aReprendre = resume.aTravailler + resume.enCours;
    if (aReprendre) {
      return {
        type: "legende",
        libelle: `Légende des tables ! Il reste ${aReprendre} calcul${aReprendre > 1 ? "s" : ""} à faire monter jusqu’au vert : ils reviendront dans Mes calculs du jour`,
        config: null
      };
    }
    if (resume.jamaisVus) {
      return {
        type: "legende",
        libelle: `Légende des tables ! Il reste ${resume.jamaisVus} calcul${resume.jamaisVus > 1 ? "s" : ""} que tu n’as jamais rencontré${resume.jamaisVus > 1 ? "s" : ""} : rejoue une marche de l’escalier`,
        config: configEtoile(ETOILES_MAX)
      };
    }
    return {type: "legende", libelle: "Légende des tables, et les 36 calculs sont verts : tout est là !", config: null};
  }

  // « ★ », « ★★★★ », « 👑 » : le symbole d'une marche de l'escalier.
  function symboleEtoile(etoile) {
    const marche = entier(etoile, 1, ETOILES_MAX, 1);
    return marche === ETOILES_MAX ? "👑" : "★".repeat(marche);
  }

  function libelleDuree(secondes) {
    if (secondes % 60 === 0) return `${secondes / 60} min`;
    return `${Math.floor(secondes / 60)} min ${String(secondes % 60).padStart(2, "0")}`;
  }

  // Résumé prêt à afficher (sans DOM) : symboles par ligne.
  function etatAffichage(parcours, aujourdhui = jourLocal()) {
    const acquises = tablesAcquises(parcours);
    const aRevoir = tablesARevoir(parcours);
    const lignes = TABLES.map(table => {
      const ligne = parcours.tables[table];
      const validation = validationTable(parcours, table, aujourdhui);
      return {
        table,
        apprends: ACTIVITES_APPRENDS.map(activite => ({activite, etat: ligne.apprends[activite], fois: ligne.fois[activite], libelle: LIBELLES_APPRENDS[activite]})),
        entraine: ENTRAINEMENTS.map(entrainement => ({entrainement, etat: ligne.entraine[entrainement], fois: ligne.fois[entrainement], libelle: LIBELLES_ENTRAINEMENTS[entrainement]})),
        dernierEntrainement: ligne.entraine.dernier,
        acquise: ligne.acquise,
        aRevoir: aRevoir.includes(table),
        // Le point sur ses 8 calculs (prets, dus, prochain retour).
        validation,
        // L'étape conseillée de la table : « apprends », « entraine », « valide ».
        conseil: conseilTable(ligne, validation)
      };
    });
    const visible = acquises.length >= SEUILS.melange.tablesMin;
    const melange = visible
      ? {visible: true, tables: acquises, aJour: parcours.melange.aJour, aRefaireAvec: parcours.melange.aRefaireAvec, du: melangeDu(parcours), dernier: parcours.melange.dernier}
      : {visible: false, tables: acquises, aJour: false, aRefaireAvec: null, du: false, dernier: null};
    const ouvert = escalierOuvert(parcours);
    const etoiles = parcours.expert.etoiles;
    const marches = SEUILS.etoile.durees.map((duree, index) => ({
      etoile: index + 1,
      symbole: symboleEtoile(index + 1),
      duree,
      libelleDuree: libelleDuree(duree),
      gagnee: index + 1 <= etoiles,
      suivante: ouvert && index + 1 === etoiles + 1,
      config: configEtoile(index + 1)
    }));
    return {
      prenom: parcours.prenom,
      lignes,
      acquises,
      // Le verrou de « Je valide » (les tables non acquises seulement).
      verrou: melangeDu(parcours),
      melange,
      // « niveau » reste le nombre d'étoiles, pour la page du professeur.
      expert: {niveau: etoiles, etoiles: marches.map(marche => marche.gagnee), ouvert, marches, suivante: ouvert && etoiles < ETOILES_MAX ? marches[etoiles] : null, couronne: parcours.expert.couronne},
      rang: rang(parcours.rang),
      jours: bilanJours(parcours, aujourdhui),
      calculs: resumeCalculs(parcours, aujourdhui),
      // L'agenda des calculs : dus aujourd'hui, demain, et le prochain retour.
      agenda: agendaCalculs(parcours, aujourdhui),
      prochaine: prochaineEtape(parcours, aujourdhui),
      // La table de la séance (lot 2) : celle de la dernière séance, sinon
      // la première de l'ordre conseillé non acquise ; null : les 9 le sont.
      tableSeance: tableDeSeance(parcours)
    };
  }

  // ------------------------------------------------------ Ma séance du jour
  //
  // Lot 1 (02/10/2026). Tout est ici, sans DOM : la rangée d'une table, la
  // composition d'une séance, ce qu'une étape finie change à la suite. La page
  // ne fait qu'enchaîner des séries qui existent déjà et montrer ce que ces
  // fonctions rendent ; la simulation et les tests lisent le même code.

  // Les huit marches de l'échelle d'une table.
  const MARCHES = Object.freeze([
    Object.freeze({marche: 1, type: "apprends", cle: "beads", nom: "Les perles"}),
    Object.freeze({marche: 2, type: "apprends", cle: "construct", nom: "Je construis la bande"}),
    Object.freeze({marche: 3, type: "apprends", cle: "gaps", nom: "La bande à trous"}),
    Object.freeze({marche: 4, type: "apprends", cle: "ordered", nom: "Dans l’ordre"}),
    Object.freeze({marche: 5, type: "entraine", cle: "desordre", nom: "Dans le désordre"}),
    Object.freeze({marche: 6, type: "entraine", cle: "trous", nom: "Nombres manquants"}),
    Object.freeze({marche: 7, type: "entraine", cle: "mixte", nom: "Résultats et nombres manquants"}),
    Object.freeze({marche: 8, type: "validation", cle: null, nom: "Je valide ma table"})
  ]);
  const MARCHE_VALIDATION = MARCHES.length;
  // L'entraînement qui prend la place de la validation quand la table n'est
  // pas prête : « Dans le désordre ».
  const MARCHE_DE_REMPLACEMENT = 5;
  // Ce que dure une étape, en minutes (pour « environ 8 min ») : mesuré en
  // jouant les trois élèves types au navigateur.
  const MINUTES_ETAPE = Object.freeze({revision: 2, melange: 2, etoile: 3, validation: 2, beads: 3, construct: 2, gaps: 2, ordered: 2, desordre: 2, trous: 2, mixte: 2});

  function marche(numero) {
    return MARCHES[entier(numero, 1, MARCHES.length, 1) - 1];
  }

  // La rangée d'une table : dix cases, les résultats de × 1 à × 10. Les huit
  // calculs de la grille suivent leur boîte ; les bouts sont pleins dès leur
  // première réussite. Trois états, une couleur.
  function rangeeTable(parcours, table) {
    const ligne = parcours.tables[table];
    const cases = Array.from({length: 10}, (_, index) => {
      const multiplicateur = index + 1;
      const cle = cleFait(`${table}-${multiplicateur}`);
      let etat = "vide";
      if (cle) {
        const fait = parcours.calculs[cle];
        if (fait && fait.boite >= SEUILS.validation.boiteMin) etat = "pleine";
        else if (fait && fait.boite === SEUILS.validation.boiteMin - 1) etat = "entouree";
      } else if (ligne.bouts.includes(multiplicateur)) etat = "pleine";
      return {multiplicateur, produit: table * multiplicateur, etat, bout: !cle};
    });
    const pleines = cases.filter(item => item.etat === "pleine").length;
    return {table, cases, pleines, total: cases.length, prete: pleines === cases.length};
  }

  // Le raccourci vers la validation : 10 sur 10 aux deux formes.
  function raccourciValidation(parcours, table) {
    const ligne = parcours.tables[table];
    return CLES_SANS_FAUTE.every(cle => ligne.sansFaute[cle] === 1);
  }

  // La séance peut-elle proposer « Je valide ma table » ? Pas sur une table
  // acquise, pas tant que le mélange est dû (le seul verrou du parcours), et
  // seulement si la rangée est prête ou le raccourci gagné.
  // « seance » : une table vue prête PENDANT la séance le reste jusqu'à sa
  // fin — une erreur dans l'entraînement qui précède la validation fait
  // redescendre un calcul d'une boîte, pas la validation promise ce matin
  // (sans cela, l'élève à 9 sur 10 chaque jour ne validait jamais).
  function validationDeSeance(parcours, table, seance = null) {
    const ligne = parcours.tables[table];
    if (!ligne || ligne.acquise || melangeDu(parcours)) return false;
    return Boolean(seance && seance.prete) || tablePrete(parcours, table);
  }

  function tablePrete(parcours, table) {
    return rangeeTable(parcours, table).prete || raccourciValidation(parcours, table);
  }

  // La table de la séance quand l'élève n'en a pas choisi dans l'onglet :
  // celle de sa dernière séance, si elle n'est pas acquise (lot 2, décision
  // de Gwenaël du 03/10 : l'élève qui a choisi la 7 la retrouve le
  // lendemain, sur tous ses appareils) ; sinon la première de l'ordre
  // conseillé qui n'est pas acquise (aucune quand les 9 le sont).
  function tableDeSeance(parcours) {
    let recente = null;
    ORDRE_CONSEIL.forEach(candidate => {
      const ligne = parcours.tables[candidate];
      if (ligne.acquise || !ligne.seance.dernier) return;
      if (recente === null || ligne.seance.dernier > parcours.tables[recente].seance.dernier) recente = candidate;
    });
    if (recente !== null) return recente;
    const table = ORDRE_CONSEIL.find(candidate => !parcours.tables[candidate].acquise);
    return table === undefined ? null : table;
  }

  function bornerDepart(depart) {
    return Math.max(1, Math.min(SEUILS.seance.departMax, depart));
  }

  // Ouvre une séance : la file de ses étapes. Mes calculs du jour s'il y en a
  // (une série, 10 au plus), le mélange s'il est dû, puis trois marches de la
  // table à partir de son départ. Une table déjà acquise (choisie exprès) se
  // retravaille par ses trois entraînements, sans rien déplacer.
  function ouvrirSeance(parcours, {table = null, aujourdhui = jourLocal()} = {}) {
    const file = [];
    const dus = calculsDus(parcours, {aujourdhui}).length;
    if (dus) file.push({type: "revision"});
    if (melangeDu(parcours)) file.push({type: "melange"});
    const choisie = TABLES.includes(Number(table)) ? Number(table) : tableDeSeance(parcours);
    let depart = null;
    let echelle = false;
    // Les 9 tables acquises et aucune choisie (lot 2) : après Mes calculs du
    // jour et le mélange, la marche suivante de l'escalier des étoiles.
    if (choisie === null && toutesAcquises(parcours)) file.push({type: "etoile"});
    if (choisie !== null) {
      const ligne = parcours.tables[choisie];
      echelle = !ligne.acquise;
      depart = echelle ? bornerDepart(ligne.seance.depart) : MARCHE_DE_REMPLACEMENT;
      const derniere = echelle ? MARCHE_VALIDATION : MARCHE_VALIDATION - 1;
      for (let numero = depart; numero < depart + SEUILS.seance.marches && numero <= derniere; numero += 1) {
        file.push({type: "marche", marche: numero, table: choisie});
      }
    }
    return {jour: aujourdhui, table: choisie, depart, echelle, file, faites: [], rate: null, sansFaute: true, remplacee: false, reparee: false, finie: false, avance: 0,
      prete: echelle && tablePrete(parcours, choisie)};
  }

  // L'étape à jouer maintenant, prête à lancer : son nom, sa série, sa durée.
  // C'est ICI que la marche 8 se décide — la validation si la table est prête
  // (ou le raccourci gagné), sinon un entraînement à sa place — et qu'une
  // étape devenue sans objet s'efface (plus rien de dû, mélange déjà réussi).
  function etapeDeSeance(parcours, seance, aujourdhui = jourLocal()) {
    for (const prevue of seance.file) {
      if (prevue.type === "revision") {
        const dus = calculsDus(parcours, {aujourdhui}).length;
        if (!dus) continue;
        const calculs = Math.min(dus, SEUILS.revision.total);
        return {type: "revision", nom: "Mes calculs du jour", calculs, config: configRevision(), minutes: MINUTES_ETAPE.revision, prevue};
      }
      if (prevue.type === "melange") {
        if (!melangeDu(parcours)) continue;
        return {type: "melange", nom: "Mon mélange", config: configMelange(parcours), minutes: MINUTES_ETAPE.melange, prevue};
      }
      if (prevue.type === "etoile") {
        // Pas avant que le mélange des 9 ait ouvert l'escalier ; la couronne
        // gagnée, c'est elle qui se rejoue (l'entretien).
        if (!escalierOuvert(parcours)) continue;
        const etoile = Math.min(ETOILES_MAX, parcours.expert.etoiles + 1);
        return {type: "etoile", etoile, nom: `Tente ${symboleEtoile(etoile)}`, detail: libelleDuree(dureeEtoile(etoile)), config: configEtoile(etoile), minutes: MINUTES_ETAPE.etoile, prevue};
      }
      const table = prevue.table;
      let numero = prevue.marche;
      let condition = false;
      if (numero === MARCHE_VALIDATION) {
        if (validationDeSeance(parcours, table, seance)) {
          return {type: "validation", marche: numero, table, nom: marche(numero).nom, config: configValidation(table), minutes: MINUTES_ETAPE.validation, prevue};
        }
        // Pas prête : un entraînement à la place — sauf si la table vient
        // d'être acquise (validation libre depuis l'accueil).
        if (parcours.tables[table].acquise) continue;
        numero = MARCHE_DE_REMPLACEMENT;
        condition = true;
      }
      const definition = marche(numero);
      return {
        type: definition.type,
        marche: numero,
        table,
        cle: definition.cle,
        nom: definition.nom,
        // « Je valide ma table · si mes calculs sont prêts » : la marche 8
        // prévue, jouée en entraînement tant que la table n'est pas prête.
        aLaPlaceDeLaValidation: condition,
        config: definition.type === "apprends" ? configApprends(table, definition.cle) : configEntraine(table, definition.cle),
        minutes: MINUTES_ETAPE[definition.cle],
        prevue
      };
    }
    return null;
  }

  // Le programme d'une séance, pour l'annoncer : ses étapes telles qu'elles
  // se présentent maintenant (la marche 8 dite « si mes calculs sont prêts »
  // quand elle n'est pas encore sûre), et la durée.
  function programmeDeSeance(parcours, seance, aujourdhui = jourLocal()) {
    const etapes = [];
    let reste = {...seance, file: seance.file.slice()};
    for (let garde = 0; garde < 12; garde += 1) {
      const etape = etapeDeSeance(parcours, reste, aujourdhui);
      if (!etape) break;
      // Une validation qui dépend d'une étape encore à jouer (les calculs du
      // jour font monter les boîtes) est annoncée « si mes calculs sont prêts ».
      const prevueValidation = etape.prevue.type === "marche" && etape.prevue.marche === MARCHE_VALIDATION;
      etapes.push(prevueValidation && etape.type !== "validation"
        ? {...etape, nom: marche(MARCHE_VALIDATION).nom, conditionnelle: true}
        : etape);
      reste = {...reste, file: reste.file.slice(reste.file.indexOf(etape.prevue) + 1)};
    }
    return {etapes, minutes: etapes.reduce((somme, etape) => somme + etape.minutes, 0)};
  }

  // Une marche est-elle ratée ? Plus de 3 erreurs sur 10 (moins de 7 sur 10) ;
  // sur les 11 cases d'une bande, 4 erreurs ; sur les 8 trous, 3.
  function marcheRatee(juste, total) {
    return total > 0 && (total - juste) > total * SEUILS.seance.erreursRate;
  }

  // Note une étape FINIE (la série a déjà été appliquée au parcours par
  // appliquerSerie / appliquerReponse) et rend la séance et le parcours à
  // jour. resultat = {juste, total, reussi} — « reussi » pour une validation
  // ou un mélange.
  //  - marche ratée : la marche d'en dessous, la marche ratée refaite, puis la
  //    suite prévue (une seule fois par séance) ; le départ de la table
  //    redescend TOUT DE SUITE un cran sous la marche ratée, et ne remonte que
  //    si la reprise est réussie et la séance finie ;
  //  - les deux « 10 sur 10 » du raccourci réunis : la suite devient la
  //    validation ;
  //  - validation réussie : le mélange suit s'il est dû ; ratée : retour à la
  //    marche 7 ;
  //  - plus d'étape : la séance est finie — le départ avance (d'une marche,
  //    de deux si tout était sans faute) et le jour est compté.
  function noterEtape(parcours, seance, etape, resultat = {}, aujourdhui = jourLocal()) {
    const copie = cloner(parcours);
    const suite = cloner(seance);
    const juste = entier(resultat.juste, 0, 100);
    const total = entier(resultat.total, 1, 100, 1);
    const position = seance.file.indexOf(etape.prevue);
    suite.file = suite.file.slice(position < 0 ? 1 : position + 1);
    const faite = {type: etape.type, nom: etape.nom, marche: etape.marche || null, juste, total, rate: false, reussi: null};
    const table = suite.table;
    const ligne = table === null ? null : copie.tables[table];
    if (ligne && suite.echelle) ligne.seance.dernier = dateOuNull(suite.jour) || jourLocal();
    const descendre = (numero, reprendre = true) => {
      // Un raté réparé ne compte plus : c'est le nouveau raté qui dit où repartir.
      suite.rate = suite.rate === null || suite.reparee ? numero : Math.min(suite.rate, numero);
      suite.sansFaute = false;
      // Le premier raté d'une séance (décision de Gwenaël, 02/10 au soir) : la
      // marche d'en dessous, puis la marche ratée REFAITE, puis la suite prévue
      // — la séance ne s'arrête pas sur un échec. Un deuxième raté (la marche
      // d'en dessous, la reprise, ou plus loin) : la séance s'arrête là.
      const reste = suite.file.filter(prevue => prevue.type === "marche");
      suite.file = suite.remplacee || numero <= 1 ? []
        : [{type: "marche", marche: numero - 1, table, remplacement: true},
          ...(reprendre ? [{type: "marche", marche: numero, table, reprise: true}, ...reste] : [])];
      suite.remplacee = true;
      suite.reparee = false;
      if (suite.echelle) {
        ligne.seance.depart = bornerDepart(suite.rate - 1);
        ligne.seance.n = Math.min(FOIS_MAX, ligne.seance.n + 1);
      }
    };
    if (etape.type === "apprends" || etape.type === "entraine") {
      faite.rate = marcheRatee(juste, total);
      if (juste < total) suite.sansFaute = false;
      if (faite.rate) descendre(etape.marche);
      // La marche ratée, refaite et réussie : le raté est réparé.
      else if (etape.prevue.reprise) suite.reparee = true;
      if (!faite.rate && suite.echelle && !suite.file.some(prevue => prevue.marche === MARCHE_VALIDATION) && !suite.faites.some(passee => passee.type === "validation")
        && raccourciValidation(copie, table) && validationDeSeance(copie, table, suite)) {
        // Le raccourci : la validation tout de suite, à la place de la suite.
        suite.file = [{type: "marche", marche: MARCHE_VALIDATION, table, raccourci: true}];
      }
    } else if (etape.type === "validation") {
      faite.reussi = Boolean(resultat.reussi);
      if (faite.reussi) suite.file = melangeDu(copie) ? [{type: "melange"}] : [];
      // Une validation ratée ne se retente pas dans la séance : la marche 7, puis fin.
      else { faite.rate = true; descendre(MARCHE_VALIDATION, false); }
    } else if (etape.type === "melange" || etape.type === "etoile") {
      faite.reussi = Boolean(resultat.reussi);
    }
    suite.faites.push(faite);
    // Prête maintenant (les calculs du jour viennent de monter) : elle le
    // reste pour la marche 8 de cette séance.
    if (suite.echelle && tablePrete(copie, table)) suite.prete = true;
    if (!etapeDeSeance(copie, suite, aujourdhui)) {
      suite.file = [];
      suite.finie = true;
      // Sans raté — ou avec un raté réparé dans la séance — le départ avance.
      if (suite.echelle && !ligne.acquise && (suite.rate === null || suite.reparee)) {
        const avant = suite.depart;
        // Le raccourci gagné mène droit à la séance 6-7-8.
        ligne.seance.depart = raccourciValidation(copie, table)
          ? SEUILS.seance.departMax
          : bornerDepart(suite.depart + (suite.sansFaute ? SEUILS.seance.sansFaute : 1));
        ligne.seance.n = Math.min(FOIS_MAX, ligne.seance.n + 1);
        suite.avance = ligne.seance.depart - avant;
      }
      copie.seances = normaliserSeances([...copie.seances, suite.jour]);
    }
    return {parcours: copie, seance: suite, faite};
  }

  // Une table ratée sur le premier écran (« Tu connais déjà des tables ? ») :
  // l'élève la connaît en partie — sa séance commence aux entraînements
  // (« Dans le désordre »), pas aux perles.
  const MARCHE_APRES_DECOUVERTE = 5;
  function commencerApresDecouverte(parcours, table, {depart = MARCHE_APRES_DECOUVERTE, aujourdhui = jourLocal()} = {}) {
    const copie = cloner(parcours);
    const ligne = copie.tables[table];
    if (!ligne || ligne.acquise) return parcours;
    ligne.seance.depart = bornerDepart(depart);
    ligne.seance.n = Math.min(FOIS_MAX, ligne.seance.n + 1);
    ligne.seance.dernier = aujourdhui;
    return copie;
  }

  // « Cette semaine ●○○○ » : les jours avec une séance finie depuis lundi,
  // l'objectif (4, pas une limite), et le nombre de séances d'aujourd'hui.
  function bilanSeances(parcours, aujourdhui = jourLocal()) {
    const lundi = lundiDe(aujourdhui);
    const jours = new Set(parcours.seances.filter(jour => jour >= lundi && jour <= aujourdhui));
    return {
      semaine: jours.size,
      objectif: SEUILS.seance.objectifSemaine,
      aujourdhui: parcours.seances.filter(jour => jour === aujourdhui).length
    };
  }

  // ---------------------------------------------------- le rangement par code
  //
  // Un rangement PAR CODE sur l'appareil (lot A1, 30/08/2026) : la case
  // « sans code » garde la clé historique, chaque code élève a la sienne.
  // Changer de code, c'est changer de case avant d'afficher quoi que ce soit —
  // Bob qui arrive sur la tablette d'Alice ne voit ni n'écrase rien d'elle, et
  // rien de lui ne part sous son code. Aucun verrou, aucune course contre le
  // réseau : les cases sont séparées par construction.
  //
  // Depuis le lot 8 (03/09/2026), la clé d'une case ne porte plus le code en
  // clair mais une EMPREINTE du code : n'importe quel script chargé par une
  // page du site peut lire le stockage durable de mathsgo.re (les scripts
  // tiers du lot 10, par exemple), et une tablette de CDI y gardait la liste
  // des codes de tous les élèves passés dessus. L'empreinte est un SHA-256
  // répété (ITERATIONS_EMPREINTE fois) de « sel:code », tronqué à 16
  // caractères hexadécimaux ; le sel est tiré au hasard une fois par appareil
  // et rangé à côté des cases. Lire les clés ne donne donc plus les codes :
  // les retrouver demanderait d'essayer le milliard de codes possibles, sel
  // compris, un milliard de fois dix mille SHA-256 par appareil. Le SHA-256
  // est écrit ici, en JavaScript pur, plutôt qu'emprunté à crypto.subtle : le
  // rangement doit rester SYNCHRONE (la case est chargée avant le premier
  // affichage, sans attendre une promesse), et une même clé doit sortir sur
  // tous les navigateurs, y compris là où crypto.subtle manque (page ouverte
  // en http sur un réseau local). Les tests comparent cette implémentation à
  // celle de Node.
  //
  // Sous un code, la case ne contient plus de prénom : celui que le professeur
  // a saisi arrive du serveur et ne vit que le temps de l'onglet, avec le code
  // (voir chargerIdentiteOnglet). La case « sans code » garde le sien — c'est
  // l'appareil d'une famille, pas celui d'une classe.
  const CLE_SEL = "mathsgo-defi-tables-sel";
  const ITERATIONS_EMPREINTE = 10000;
  const LONGUEUR_EMPREINTE = 16;
  const memoEmpreintes = new Map();

  // SHA-256 (FIPS 180-4) sur un texte, encodé en UTF-8 ; résultat en hexadécimal.
  const SHA256_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function octetsUtf8(texte) {
    const chaine = String(texte);
    const octets = [];
    for (let i = 0; i < chaine.length; i += 1) {
      let point = chaine.charCodeAt(i);
      if (point >= 0xd800 && point <= 0xdbff && i + 1 < chaine.length) {
        const suivant = chaine.charCodeAt(i + 1);
        if (suivant >= 0xdc00 && suivant <= 0xdfff) {
          point = 0x10000 + ((point - 0xd800) << 10) + (suivant - 0xdc00);
          i += 1;
        }
      }
      if (point < 0x80) octets.push(point);
      else if (point < 0x800) octets.push(0xc0 | (point >> 6), 0x80 | (point & 63));
      else if (point < 0x10000) octets.push(0xe0 | (point >> 12), 0x80 | ((point >> 6) & 63), 0x80 | (point & 63));
      else octets.push(0xf0 | (point >> 18), 0x80 | ((point >> 12) & 63), 0x80 | ((point >> 6) & 63), 0x80 | (point & 63));
    }
    return octets;
  }

  function sha256Octets(source) {
    const octets = source.slice();
    const longueurBits = octets.length * 8;
    octets.push(0x80);
    while (octets.length % 64 !== 56) octets.push(0);
    for (let i = 7; i >= 0; i -= 1) octets.push(Math.floor(longueurBits / Math.pow(2, i * 8)) & 255);
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Array(64);
    for (let debut = 0; debut < octets.length; debut += 64) {
      for (let t = 0; t < 16; t += 1) {
        const o = debut + t * 4;
        w[t] = ((octets[o] << 24) | (octets[o + 1] << 16) | (octets[o + 2] << 8) | octets[o + 3]) >>> 0;
      }
      for (let t = 16; t < 64; t += 1) {
        const x = w[t - 15];
        const y = w[t - 2];
        const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let t = 0; t < 64; t += 1) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + SHA256_K[t] + w[t]) >>> 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    const resultat = [];
    h.forEach(mot => resultat.push((mot >>> 24) & 255, (mot >>> 16) & 255, (mot >>> 8) & 255, mot & 255));
    return resultat;
  }

  function enHex(octets) {
    return octets.map(o => o.toString(16).padStart(2, "0")).join("");
  }

  function sha256Hex(texte) {
    return enHex(sha256Octets(octetsUtf8(texte)));
  }

  // Le sel de l'appareil : 32 caractères hexadécimaux tirés au hasard la
  // première fois, puis relus. Sans stockage (ou stockage cassé), sel vide :
  // les clés restent calculables, il n'y a de toute façon rien à lire.
  function selAppareil(stockage) {
    try {
      if (!stockage) return "";
      const existant = stockage.getItem(CLE_SEL);
      if (typeof existant === "string" && /^[0-9a-f]{32}$/.test(existant)) return existant;
      const octets = new Array(16);
      let tire = false;
      try {
        const alea = typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.getRandomValues;
        if (alea) {
          const tampon = new Uint8Array(16);
          globalThis.crypto.getRandomValues(tampon);
          for (let i = 0; i < 16; i += 1) octets[i] = tampon[i];
          tire = true;
        }
      } catch (_) {}
      if (!tire) for (let i = 0; i < 16; i += 1) octets[i] = Math.floor(Math.random() * 256);
      const sel = octets.map(o => o.toString(16).padStart(2, "0")).join("");
      stockage.setItem(CLE_SEL, sel);
      return sel;
    } catch (_) {
      return "";
    }
  }

  function empreinteCode(code, sel) {
    const memo = sel + ":" + code;
    const connue = memoEmpreintes.get(memo);
    if (connue) return connue;
    let h = sha256Octets(octetsUtf8(memo));
    for (let i = 1; i < ITERATIONS_EMPREINTE; i += 1) h = sha256Octets(h);
    const empreinte = enHex(h).slice(0, LONGUEUR_EMPREINTE);
    memoEmpreintes.set(memo, empreinte);
    return empreinte;
  }

  function estEmpreinte(valeur) {
    return typeof valeur === "string" && valeur.length === LONGUEUR_EMPREINTE && /^[0-9a-f]+$/.test(valeur);
  }

  function cleStockage(code, stockage) {
    const propre = normaliserCode(code || "");
    return codeValide(propre) ? CLE_STOCKAGE + ":" + empreinteCode(propre, selAppareil(stockage)) : CLE_STOCKAGE;
  }

  // Sous un code, jamais de prénom dans la case durable.
  function sansPrenomSousCode(parcours, code) {
    return codeValide(code) ? definirPrenom(parcours, "") : parcours;
  }

  function charger(stockage, code) {
    try {
      const brut = stockage && stockage.getItem(cleStockage(code, stockage));
      if (!brut) return creerParcours();
      return sansPrenomSousCode(normaliserParcours(JSON.parse(brut)), code);
    } catch (_) {
      return creerParcours();
    }
  }

  function sauver(stockage, parcours, code) {
    try {
      if (!stockage) return false;
      stockage.setItem(cleStockage(code, stockage), JSON.stringify(sansPrenomSousCode(normaliserParcours(parcours), code)));
      return true;
    } catch (_) {
      return false;
    }
  }

  function effacer(stockage, code) {
    try {
      if (stockage) stockage.removeItem(cleStockage(code, stockage));
      return true;
    } catch (_) {
      return false;
    }
  }

  // L'état de synchronisation d'une case : la dernière révision connue du
  // serveur, si du travail attend d'être envoyé (« dirty »), si le code a été
  // refusé (détaché), et quand la case a bougé pour la dernière fois. Rangé À
  // CÔTÉ de la case, pas dedans : normaliserParcours ignorerait ces champs.
  const CLE_SYNC = "mathsgo-defi-tables-sync";

  function cleSync(code, stockage) {
    const propre = normaliserCode(code || "");
    return codeValide(propre) ? CLE_SYNC + ":" + empreinteCode(propre, selAppareil(stockage)) : CLE_SYNC;
  }

  function syncNeutre() {
    return {revision: 0, dirty: false, detache: false, maj: 0};
  }

  function normaliserSync(lu) {
    const sync = syncNeutre();
    if (!lu || typeof lu !== "object") return sync;
    sync.revision = entier(lu.revision, 0, 1000000000);
    sync.dirty = Boolean(lu.dirty);
    sync.detache = Boolean(lu.detache);
    sync.maj = entier(lu.maj, 0, Number.MAX_SAFE_INTEGER);
    return sync;
  }

  function lireSyncBrut(stockage, cle) {
    try {
      const brut = stockage && stockage.getItem(cle);
      return brut ? normaliserSync(JSON.parse(brut)) : syncNeutre();
    } catch (_) {
      return syncNeutre();
    }
  }

  function chargerSync(stockage, code) {
    try {
      return lireSyncBrut(stockage, cleSync(code, stockage));
    } catch (_) {
      return syncNeutre();
    }
  }

  function sauverSync(stockage, code, sync) {
    try {
      if (!stockage) return false;
      const propre = Object.assign(syncNeutre(), sync || {});
      stockage.setItem(cleSync(code, stockage), JSON.stringify(propre));
      return true;
    } catch (_) {
      return false;
    }
  }

  function effacerSync(stockage, code) {
    try {
      if (stockage) stockage.removeItem(cleSync(code, stockage));
      return true;
    } catch (_) {
      return false;
    }
  }

  function clesDuStockage(stockage) {
    const cles = [];
    try {
      if (!stockage || typeof stockage.length !== "number" || typeof stockage.key !== "function") return cles;
      for (let i = 0; i < stockage.length; i += 1) {
        const cle = stockage.key(i);
        if (typeof cle === "string") cles.push(cle);
      }
    } catch (_) {}
    return cles;
  }

  // Ce qu'un appareil « d'avant » peut encore contenir, et ce qu'on en fait :
  //  - avant le lot A1 : le code actif ET le parcours dans le stockage durable,
  //    sous une seule case → le parcours va dans la case du code, le code est
  //    oublié (l'identité ne vit plus que le temps d'un onglet) ;
  //  - du lot A1 au lot 5 : une case par code, le code EN CLAIR dans la clé,
  //    prénom compris → la case passe sous l'empreinte du code, sans prénom ;
  //    si la case à empreinte existe déjà, les deux fusionnent (rien ne se
  //    perd) ; l'état de synchronisation suit, daté d'aujourd'hui s'il ne
  //    l'était pas, pour que la purge de fin d'année sache compter.
  // Sans code rangé, la case unique devient la case « sans code » : rien à faire.
  function migrerStockage(stockage, maintenant = Date.now()) {
    let fait = false;
    try {
      if (!stockage) return false;
      const enClair = (prefixe, cle) => {
        if (!cle.startsWith(prefixe + ":")) return null;
        const code = cle.slice(prefixe.length + 1);
        return code.length === LONGUEUR_CODE && codeValide(code) && normaliserCode(code) === code ? code : null;
      };
      // 1. Les cases au code en clair (lots A1 à 5) passent sous l'empreinte.
      const cles = clesDuStockage(stockage);
      cles.forEach(cle => {
        const code = enClair(CLE_STOCKAGE, cle);
        if (!code) return;
        fait = true;
        let parcours = null;
        try { parcours = normaliserParcours(JSON.parse(stockage.getItem(cle))); } catch (_) {}
        stockage.removeItem(cle);
        if (!parcours) return;
        const existante = stockage.getItem(cleStockage(code, stockage));
        sauver(stockage, existante ? fusionner(charger(stockage, code), parcours) : parcours, code);
        // Une case sans état d'envoi (appli d'avant le lot A2) : on la date,
        // sinon la purge ne saurait jamais quand elle a servi.
        if (!stockage.getItem(cleSync(code, stockage)) && !stockage.getItem(CLE_SYNC + ":" + code)) {
          sauverSync(stockage, code, {maj: entier(maintenant, 0, Number.MAX_SAFE_INTEGER)});
        }
      });
      cles.forEach(cle => {
        const code = enClair(CLE_SYNC, cle);
        if (!code) return;
        fait = true;
        const ancienSync = lireSyncBrut(stockage, cle);
        stockage.removeItem(cle);
        const nouveau = stockage.getItem(cleSync(code, stockage)) ? chargerSync(stockage, code) : null;
        const fusion = nouveau
          ? {revision: Math.max(nouveau.revision, ancienSync.revision), dirty: nouveau.dirty || ancienSync.dirty,
            detache: nouveau.detache && ancienSync.detache, maj: Math.max(nouveau.maj, ancienSync.maj)}
          : ancienSync;
        if (!fusion.maj) fusion.maj = entier(maintenant, 0, Number.MAX_SAFE_INTEGER);
        sauverSync(stockage, code, fusion);
      });
      // 2. Le code durable d'avant le lot A1 : son parcours va dans la case du
      //    code (si elle n'existe pas déjà, sous l'empreinte ou en clair), et
      //    le code est oublié.
      const ancien = stockage.getItem(CLE_CODE);
      if (ancien) {
        stockage.removeItem(CLE_CODE);
        const code = normaliserCode(ancien);
        if (codeValide(code)) {
          fait = true;
          const brut = stockage.getItem(CLE_STOCKAGE);
          const dejaLa = stockage.getItem(cleStockage(code, stockage)) || stockage.getItem(CLE_STOCKAGE + ":" + code);
          if (brut && !dejaLa) {
            let parcours = null;
            try { parcours = normaliserParcours(JSON.parse(brut)); } catch (_) {}
            if (parcours) {
              sauver(stockage, parcours, code);
              stockage.removeItem(CLE_STOCKAGE);
              if (!stockage.getItem(cleSync(code, stockage))) {
                sauverSync(stockage, code, {maj: entier(maintenant, 0, Number.MAX_SAFE_INTEGER)});
              }
            }
          }
        }
      }
    } catch (_) {}
    return fait;
  }

  // La purge (lot 8) : une case à code que personne n'a ouverte depuis
  // DUREE_CONSERVATION_MS (90 jours) est retirée de l'appareil — élève parti,
  // classe de l'an dernier, tablette de CDI. Le serveur, lui, garde tout : un
  // élève qui revient retrouve sa progression par son code. La case active
  // (« garder ») n'est jamais touchée, ni la case sans code, ni une case dont
  // la date est inconnue (maj à 0). Rend le nombre de cases retirées.
  const DUREE_CONSERVATION_MS = 90 * 24 * 60 * 60 * 1000;

  function purger(stockage, {maintenant = Date.now(), garder = "", duree = DUREE_CONSERVATION_MS} = {}) {
    let retirees = 0;
    try {
      if (!stockage) return 0;
      const gardee = codeValide(garder) ? cleSync(garder, stockage) : null;
      clesDuStockage(stockage).forEach(cle => {
        if (!cle.startsWith(CLE_SYNC + ":") || cle === gardee) return;
        const empreinte = cle.slice(CLE_SYNC.length + 1);
        if (!estEmpreinte(empreinte)) return;
        const sync = lireSyncBrut(stockage, cle);
        if (!sync.maj || maintenant - sync.maj <= duree) return;
        stockage.removeItem(cle);
        stockage.removeItem(CLE_STOCKAGE + ":" + empreinte);
        retirees += 1;
      });
    } catch (_) {}
    return retirees;
  }

  // Vrai si une clé du stockage durable laisse lire un code élève : c'est ce
  // que le lot 8 interdit, et ce que les tests vérifient après une séance.
  function clesRevelentUnCode(stockage) {
    return clesDuStockage(stockage).some(cle => {
      return cle.split(":").slice(1).some(morceau => morceau.length === LONGUEUR_CODE && codeValide(morceau));
    });
  }

  // --------------------------------------------------------------- le code élève

  function normaliserCode(brut) {
    if (typeof brut !== "string") return "";
    return brut.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, LONGUEUR_CODE);
  }

  function codeValide(brut) {
    const code = normaliserCode(brut);
    if (code.length !== LONGUEUR_CODE) return false;
    return [...code].every(caractere => ALPHABET_CODE.includes(caractere));
  }

  function chargerCode(stockage) {
    try {
      const code = stockage && stockage.getItem(CLE_CODE);
      return codeValide(code) ? normaliserCode(code) : "";
    } catch (_) {
      return "";
    }
  }

  function sauverCode(stockage, brut) {
    try {
      if (!stockage || !codeValide(brut)) return false;
      stockage.setItem(CLE_CODE, normaliserCode(brut));
      return true;
    } catch (_) {
      return false;
    }
  }

  function effacerCode(stockage) {
    try {
      if (stockage) {
        stockage.removeItem(CLE_CODE);
        stockage.removeItem(CLE_IDENTITE);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // L'identité que le serveur a donnée pour le code (prénom saisi par le
  // professeur, classe) : rangée dans l'ONGLET, avec le code, jamais dans le
  // stockage durable (lot 8). Elle ne vaut que pour ce code : un autre code
  // dans le même onglet ne la lit pas.
  const CLE_IDENTITE = "mathsgo-suivi-identite";

  function chargerIdentiteOnglet(stockage, code) {
    try {
      const propre = normaliserCode(code || "");
      const brut = stockage && codeValide(propre) ? stockage.getItem(CLE_IDENTITE) : null;
      if (!brut) return null;
      const lu = JSON.parse(brut);
      if (!lu || typeof lu !== "object" || lu.code !== propre) return null;
      return {prenom: nettoyerPrenom(lu.prenom), classe: typeof lu.classe === "string" ? lu.classe.slice(0, 40) : ""};
    } catch (_) {
      return null;
    }
  }

  function sauverIdentiteOnglet(stockage, code, identite) {
    try {
      const propre = normaliserCode(code || "");
      if (!stockage || !codeValide(propre) || !identite || typeof identite !== "object") return false;
      stockage.setItem(CLE_IDENTITE, JSON.stringify({
        code: propre,
        prenom: nettoyerPrenom(identite.prenom),
        classe: typeof identite.classe === "string" ? identite.classe.slice(0, 40) : ""
      }));
      return true;
    } catch (_) {
      return false;
    }
  }

  // ------------------------------------------------------------------ la fusion

  function dateLaPlusRecente(premiere, seconde) {
    if (!premiere) return seconde || null;
    if (!seconde) return premiere;
    return premiere >= seconde ? premiere : seconde;
  }

  function dateLaPlusAncienne(premiere, seconde) {
    if (!premiere) return seconde || null;
    if (!seconde) return premiere;
    return premiere <= seconde ? premiere : seconde;
  }

  function meilleurEntrainement(premier, second) {
    if (!premier) return second || null;
    if (!second) return premier;
    const note = dernier => (dernier.total ? dernier.score / dernier.total : 0);
    return note(second) > note(premier) ? second : premier;
  }

  // « On garde le plus avancé des deux, jamais d'écrasement. »
  //
  // Rien ne se perd : chaque compteur prend son maximum, chaque acquisition
  // gardée à sa PREMIÈRE date, chaque case de la grille son maximum. Les deux
  // parcours sont interchangeables, sauf pour le prénom : celui du premier
  // gagne s'il est renseigné (c'est l'appareil devant l'élève qui a raison).
  function fusionner(premier, second) {
    const a = normaliserParcours(premier);
    const b = normaliserParcours(second);

    // Une remise à zéro a eu lieu d'un côté (époque plus haute) : elle gagne
    // entièrement. Sans cela, le maximum de chaque compteur ferait revenir
    // tout ce que l'élève vient d'effacer, dès qu'un autre appareil se
    // synchronise. Le prénom, lui, reste celui de l'appareil devant l'élève.
    if (a.epoque !== b.epoque) {
      const gagnant = cloner(a.epoque > b.epoque ? a : b);
      gagnant.prenom = a.prenom || b.prenom;
      return normaliserParcours(gagnant);
    }

    const fusion = creerParcours();
    fusion.epoque = a.epoque;
    fusion.prenom = a.prenom || b.prenom;

    TABLES.forEach(table => {
      const ligneA = a.tables[table];
      const ligneB = b.tables[table];
      const cible = fusion.tables[table];
      ACTIVITES_APPRENDS.forEach(activite => {
        cible.apprends[activite] = Math.max(ligneA.apprends[activite], ligneB.apprends[activite]);
      });
      ENTRAINEMENTS.forEach(entrainement => {
        cible.entraine[entrainement] = Math.max(ligneA.entraine[entrainement], ligneB.entraine[entrainement]);
      });
      cible.entraine.dernier = meilleurEntrainement(ligneA.entraine.dernier, ligneB.entraine.dernier);
      // Le compteur « fois » prend le plus grand des deux : deux appareils
      // portent le même parcours, pas deux moitiés à additionner.
      CLES_FOIS.forEach(cle => {
        cible.fois[cle] = Math.max(ligneA.fois[cle], ligneB.fois[cle]);
      });
      // Ma séance du jour : un bout réussi d'un côté l'est (union) ; le départ
      // de l'échelle peut redescendre, donc c'est le plus RÉCENT qui gagne —
      // celui qui a vu le plus de séances (à égalité, le plus avancé) ; un
      // « sans faute » gagné le reste.
      cible.bouts = normaliserBouts(table, [...ligneA.bouts, ...ligneB.bouts]);
      const recente = ligneA.seance.n !== ligneB.seance.n
        ? (ligneA.seance.n > ligneB.seance.n ? ligneA : ligneB)
        : (ligneA.seance.depart >= ligneB.seance.depart ? ligneA : ligneB);
      const derniers = [ligneA.seance.dernier, ligneB.seance.dernier].filter(Boolean).sort();
      cible.seance = {depart: recente.seance.depart, n: recente.seance.n, dernier: derniers.length ? derniers[derniers.length - 1] : null};
      CLES_SANS_FAUTE.forEach(cle => {
        cible.sansFaute[cle] = Math.max(ligneA.sansFaute[cle], ligneB.sansFaute[cle]);
      });
      // Une table acquise le reste, à la date de la première validation.
      cible.acquise = dateLaPlusAncienne(ligneA.acquise, ligneB.acquise);
    });

    // Le mélange n'est « à jour » que s'il a été réussi avec TOUTES les tables
    // du parcours fusionné : celui qui l'avait fait avec 5 tables alors que
    // l'autre appareil en a 7 doit le refaire.
    const acquisesFusion = tablesAcquises(fusion);
    const aJourA = a.melange.aJour && tablesAcquises(a).length === acquisesFusion.length;
    const aJourB = b.melange.aJour && tablesAcquises(b).length === acquisesFusion.length;
    fusion.melange.tables = acquisesFusion;
    fusion.melange.dernier = dateLaPlusRecente(a.melange.dernier, b.melange.dernier);
    if (aJourA || aJourB) {
      fusion.melange.aJour = true;
      fusion.melange.aRefaireAvec = null;
    } else {
      fusion.melange.aJour = false;
      fusion.melange.aRefaireAvec = acquisesFusion.length >= 3 ? derniereTableAcquise(fusion) : null;
    }

    // Les étoiles prennent le meilleur des deux, la couronne sa première date ;
    // le rang ne redescend jamais ; les jours travaillés se réunissent.
    fusion.expert.etoiles = Math.max(a.expert.etoiles, b.expert.etoiles);
    fusion.expert.dernier = dateLaPlusRecente(a.expert.dernier, b.expert.dernier);
    fusion.expert.couronne = dateLaPlusAncienne(a.expert.couronne, b.expert.couronne);
    fusion.rang = Math.max(a.rang, b.rang);
    fusion.jours = normaliserJours([...a.jours, ...b.jours]);
    // Les séances : par jour, le plus grand des deux comptes (deux appareils
    // portent le même parcours, pas deux moitiés à additionner).
    const compter = liste => liste.reduce((compte, jour) => compte.set(jour, (compte.get(jour) || 0) + 1), new Map());
    const seancesA = compter(a.seances);
    const seancesB = compter(b.seances);
    fusion.seances = normaliserSeances([...new Set([...seancesA.keys(), ...seancesB.keys()])]
      .flatMap(jour => new Array(Math.max(seancesA.get(jour) || 0, seancesB.get(jour) || 0)).fill(jour)));

    FAITS.forEach(cle => {
      const faitA = a.calculs[cle];
      const faitB = b.calculs[cle];
      if (!faitA && !faitB) return;
      if (!faitA || !faitB) {
        fusion.calculs[cle] = cloner(faitA || faitB);
        return;
      }
      // Par calcul, le jour le plus récent gagne en bloc : une erreur faite
      // aujourd'hui ne doit pas être effacée par l'état d'hier à trois cases.
      // LIMITE CONNUE, acceptée : deux appareils utilisés le MÊME JOUR sur le
      // même calcul ne peuvent pas être ordonnés — « gain puis erreur » et
      // « erreur puis gain » laissent exactement les mêmes dates, seule l'heure
      // les séparerait, et on a choisi de ne pas l'enregistrer. Dans ce cas
      // rare, le plus avancé gagne.
      if (faitA.vu !== faitB.vu) {
        fusion.calculs[cle] = cloner(faitA.vu > faitB.vu ? faitA : faitB);
        return;
      }
      // Même jour : la boîte la plus haute, et l'échéance qui va avec (à boîte
      // égale, la plus proche — le calcul revient plutôt trop tôt que trop tard).
      const boite = Math.max(faitA.boite, faitB.boite);
      const echeance = faitA.boite !== faitB.boite
        ? (faitA.boite > faitB.boite ? faitA : faitB).echeance
        : dateLaPlusAncienne(faitA.echeance, faitB.echeance);
      fusion.calculs[cle] = {
        boite,
        cases: casesDeBoite(boite),
        vu: faitA.vu,
        // Erreur et gain les plus récents : la fusion ne rouvre jamais le droit
        // de monter le jour d'une erreur.
        erreur: dateLaPlusRecente(faitA.erreur, faitB.erreur),
        gagne: dateLaPlusRecente(faitA.gagne, faitB.gagne),
        echeance
      };
    });

    return normaliserParcours(fusion);
  }

  function derniereTableAcquise(parcours) {
    const acquises = tablesAcquises(parcours);
    if (!acquises.length) return null;
    return acquises.reduce((meilleure, table) =>
      String(parcours.tables[table].acquise) >= String(parcours.tables[meilleure].acquise) ? table : meilleure,
      acquises[0]);
  }

  // ------------------------------------------------------- la vue d'une classe

  // Les calculs qui coincent chez le plus d'élèves de la classe, pour savoir
  // quoi réviser au tableau lundi matin. N'utilise que ce qui est déjà stocké.
  function fragilesDeLaClasse(parcoursDesEleves, {max = 5} = {}) {
    const compte = new Map();
    (Array.isArray(parcoursDesEleves) ? parcoursDesEleves : []).forEach(brut => {
      if (!brut) return;
      const parcours = normaliserParcours(brut);
      calculsATravailler(parcours).forEach(cle => {
        compte.set(cle, (compte.get(cle) || 0) + 1);
      });
    });
    return [...compte.entries()]
      .map(([cle, eleves]) => ({cle, libelle: libelleFait(cle), eleves}))
      .sort((premier, second) => second.eleves - premier.eleves || premier.cle.localeCompare(second.cle))
      .slice(0, Math.max(0, max));
  }

  function estVide(parcours) {
    return !parcours.prenom && !parcours.expert.etoiles && !Object.keys(parcours.calculs).length && TABLES.every(table => {
      const ligne = parcours.tables[table];
      return !ligne.acquise
        && ACTIVITES_APPRENDS.every(activite => ligne.apprends[activite] === 0)
        && ENTRAINEMENTS.every(entrainement => ligne.entraine[entrainement] === 0)
        && !ligne.bouts.length;
    });
  }

  return Object.freeze({
    VERSION,
    CLE_STOCKAGE,
    TABLES,
    ORDRE_CONSEIL,
    ACTIVITES_APPRENDS,
    ENTRAINEMENTS,
    SEUILS,
    ETOILES_MAX,
    RANGS,
    LIBELLES_ENTRAINEMENTS,
    LIBELLES_APPRENDS,
    CONSIGNES_APPRENDS,
    PRENOM_MAX,
    creerParcours,
    normaliserParcours,
    nettoyerPrenom,
    definirPrenom,
    remettreAZero,
    tablesAcquises,
    toutesAcquises,
    classerSerie,
    demarrerSerie,
    appliquerSerie,
    configApprends,
    configEntraine,
    configValidation,
    configMelange,
    configEtoile,
    dureeEtoile,
    symboleEtoile,
    libelleDuree,
    melangeDu,
    escalierOuvert,
    rang,
    rangDeLEtat,
    jourLocal,
    lundiDe,
    ajouterJours,
    ecartJours,
    bilanJours,
    FAITS,
    cleFait,
    facteursFait,
    libelleFait,
    faitsDeLaTable,
    validationTable,
    CLES_FOIS,
    FOIS_MAX,
    etatFait,
    faitDu,
    echeanceDeBoite,
    serieAlimenteGrille,
    appliquerReponse,
    resumeCalculs,
    grilleCalculs,
    calculsDeLaBoite,
    calculsDus,
    calculsAVenir,
    calculsEnRetard,
    formesPermises,
    agendaCalculs,
    calculsATravailler,
    tablesARevoir,
    planRevision,
    configRevision,
    conseilTable,
    prochaineEtape,
    etapeTable,
    etatAffichage,
    MARCHES,
    CLES_SANS_FAUTE,
    multiplicateursBouts,
    rangeeTable,
    raccourciValidation,
    validationDeSeance,
    tableDeSeance,
    ouvrirSeance,
    etapeDeSeance,
    programmeDeSeance,
    marcheRatee,
    noterEtape,
    bilanSeances,
    commencerApresDecouverte,
    MARCHE_APRES_DECOUVERTE,
    CLE_SEL,
    ITERATIONS_EMPREINTE,
    LONGUEUR_EMPREINTE,
    DUREE_CONSERVATION_MS,
    sha256Hex,
    selAppareil,
    empreinteCode,
    cleStockage,
    charger,
    sauver,
    effacer,
    migrerStockage,
    purger,
    clesRevelentUnCode,
    CLE_SYNC,
    cleSync,
    chargerSync,
    sauverSync,
    effacerSync,
    estVide,
    CLE_CODE,
    CLE_IDENTITE,
    LONGUEUR_CODE,
    normaliserCode,
    codeValide,
    chargerCode,
    sauverCode,
    effacerCode,
    chargerIdentiteOnglet,
    sauverIdentiteOnglet,
    fusionner,
    fragilesDeLaClasse
  });
});
