// Défi calcul — la progression de l'élève (format définitif, lot 2a,
// 05/10/2026 ; la carte v2 et le scénario du 30/10 au lot 3, version 2).
//
// Ce fichier ne connaît AUCUN texte ni aucun générateur : seulement les
// codes des modules et leur nombre de niveaux. Il tient le format enregistré
// (version 2), les boîtes (une par COMPÉTENCE : un niveau d'un module), la
// séance guidée, le test d'entrée en escalier, Mes calculs du jour, la fusion
// entre deux appareils et le rangement par code sur l'appareil.
//
// Les règles sont celles de « defi-calcul-seance-guidee.md » (étape 5a),
// corrigées par le scénario d'un module et la carte v2 (30/10/2026) :
//  - une compétence ENTRE dans les boîtes par un entraînement réussi
//    (boîte 2) ou par le test d'entrée : la marche la plus haute prouvée en
//    boîte 3, les marches en dessous en boîte 4 (sues) ;
//  - elle ne BOUGE que dans Mes calculs du jour : juste et due, elle monte ;
//    fausse, elle descend. Nulle part ailleurs une erreur ne compte ;
//  - elle est SUE à la boîte 4 ; un module est su quand toutes ses
//    compétences le sont ;
//  - le palier est celui du NIVEAU (la carte), et la séance prend la première
//    compétence de l'ordre de la carte qui n'est pas dans les boîtes ;
//  - « le rouge d'abord » : tant qu'une compétence est rouge (ratée dans Mes
//    calculs du jour), pas de nouveauté — la séance l'entraîne avec l'aide ;
//    ratée encore, elle refait J'apprends. Une compétence sue ratée descend
//    d'une boîte et compte comme rouge pour la journée (décision du 30/10).
//
// Copié de defi_tables_mon_parcours.js puis adapté, jamais partagé : Défi
// tables reste intact. Le rangement par code (empreinte SHA-256 salée, purge
// des 90 jours, état de synchronisation) est repris à l'identique, sous les
// clés « mathsgo-defi-calcul-… ».
//
// Tout ce qui est enregistré tient dans des clés courtes : le serveur compte
// les clés à toute profondeur (2 000 au plus) et borne la progression à
// 40 000 octets. Les listes ne comptent pas comme des clés. Aucun prénom sous
// un code, aucun texte libre, aucun calcul en clair.
(function initDefiCalculMonParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_CALCUL_MON_PARCOURS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // Version 3 (lot « couverture », 06/11/2026) : A2 gagne un niveau (A2-5),
  // A8 et F5 perdent leur niveau 3, réuni au niveau 2 (reprise des boîtes
  // dans normaliserParcours) ; A9 et M9 (pas construits) passent à 2 niveaux.
  // Version 4 (lot F1 « rythme », 07/11/2026) : les boîtes 6 et 7, le plan de
  // séance à 7 nombres. Rien à reprendre d'une version 3 (une boîte 6 n'y
  // existe pas, un plan à 5 nombres se relit 0, 0). Le numéro sert au
  // SERVEUR : il refuse l'écriture d'une page de version 3 (catalogue,
  // « version_min ») — une page d'avant F1 lirait une boîte 6 ou 7 comme
  // « pas entrée » et tronquerait le plan (relecture de Codex, 07/11/2026).
  // Version 5 (lot G1 « journal + accueil », 07/11/2026) : le journal des
  // séances (`journal`, six listes d'entiers alignées sur `seances`), ce que
  // la séance ouverte a déjà fait (`seance.j`), et deux dates par compétence
  // (`d` entrée, `s` devenue sue). Une progression de version 4 se relit sans
  // rien perdre : ses séances déjà finies ont un journal « inconnu » (-1),
  // ses compétences n'ont pas de date (null). Le serveur refuse l'écriture
  // d'une page de version 4 (« version_min » 5) : elle ne connaît pas ces
  // champs et les effacerait.
  const VERSION = 5;
  const CLE_STOCKAGE = "mathsgo-defi-calcul-parcours";
  const PRENOM_MAX = 20;
  // Le code de suivi et l'identité vivent dans l'ONGLET, sous les mêmes clés
  // que Défi tables : c'est le même élève, entré par le même espace.
  const CLE_CODE = "mathsgo-suivi-code";
  const ALPHABET_CODE = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const LONGUEUR_CODE = 6;

  // Les 74 codes et leur nombre de niveaux, dans l'ordre de la carte (les
  // 45 modules construits ou à construire, puis les 29 réservés). Un test
  // compare cette table aux fiches de defi_calcul_core.js. Carte v3 (lot
  // « couverture ») : A2 5, A8 2, A9 2, M9 2, F5 2.
  const NIVEAUX = Object.freeze({
    A1: 3, A10: 3, A11: 3, A2: 5, A3: 4, A4: 4, A5: 4, A6: 4, A7: 3, A8: 2, A9: 2,
    M4: 2, M1: 3, M2: 2, M3: 3, M5: 1, M6: 2, M13: 3, M7: 3, M8: 3, M9: 2, M10: 3, M11: 2, M12: 3,
    C1: 3, C3: 3, C4: 2,
    D1: 3, D2: 4, D3: 3, D4: 3, D5: 2, D6: 3, D7: 3, D8: 3, D9: 2,
    F2: 2, F1: 3, F3: 3, F4: 2, F5: 2, F6: 3, F8: 3, F9: 2, F11: 2,
    D10: 3, D11: 3, D12: 2, D13: 3, D14: 3, D15: 3, F7: 3, F10: 3, F12: 2, F13: 3,
    P1: 3, P2: 3, P3: 4, P4: 3, R1: 2, R2: 3, R3: 3, R4: 3, R5: 4, R6: 2,
    X1: 3, X2: 3, X3: 2, X4: 3, X5: 4, X6: 3, X7: 3, C2: 4, C5: 3
  });
  const CODES = Object.freeze(Object.keys(NIVEAUX));

  // Le rang d'une compétence : sa place dans la liste de toutes les
  // compétences (216), module après module. Il sert à ranger une compétence
  // dans un nombre (le plan de la séance).
  const RANGS = (() => {
    const debut = {};
    let rang = 0;
    CODES.forEach(id => { debut[id] = rang; rang += NIVEAUX[id]; });
    return Object.freeze({debut: Object.freeze(debut), total: rang});
  })();

  function rangDe(id, niveau) {
    return RANGS.debut[id] + niveau - 1;
  }

  function competenceDeRang(rang) {
    const id = CODES.find(code => rang >= RANGS.debut[code] && rang < RANGS.debut[code] + NIVEAUX[code]);
    return id ? {module: id, niveau: rang - RANGS.debut[id] + 1} : null;
  }

  const SEUILS = Object.freeze({
    // Un entraînement à longueur adaptée (scénario du 30/10, couches du
    // 31/10) : l'outil à manipuler d'abord (les perles, le glisse-nombres),
    // 2 justes ; puis l'image (la droite, le tableau), 2 justes ; puis rien.
    // Réussi à 5 justes de suite sans outil ; une erreur fait revenir
    // l'image, 2 erreurs de suite l'outil à manipuler ; au bout de 25
    // calculs sans y arriver, c'est raté.
    entraine: Object.freeze({avecOutil: 2, sansOutil: 5, erreurs: 2, maximum: 25}),
    // Le test d'entrée en escalier : 2 calculs par marche, un 3e si un faux
    // (2 sur 3 pour monter) ; 8 tests au plus dans une séance (lot F1,
    // 07/11/2026 ; 4 avant).
    test: Object.freeze({parMarche: 2, departage: 3, parSeance: 8}),
    // Les boîtes : délais de retour 1, 1, 3, 7, 14, 30, 60 jours (lot F1,
    // 07/11/2026 : les boîtes 6 et 7 ; avant, la boîte 5 revenait tous les
    // 14 jours sans fin). Une compétence entre en boîte 2 (entraînement), 3
    // (la marche la plus haute prouvée au test) ou 4 (les marches en
    // dessous) ; elle est sue en boîte 4, et le reste jusqu'à la 7.
    revision: Object.freeze({boites: 7, delais: Object.freeze([1, 1, 3, 7, 14, 30, 60]), entraine: 2, test: 3, dessous: 4, su: 4}),
    // Les nouveautés d'une séance (lot F1, 07/11/2026) : 1, 2 ou 3, réglé
    // par le professeur pour la classe (« Régler Défi calcul ») ; 1 par
    // défaut et sans code. Une nouveauté = un entraînement réussi ; la
    // suivante vient dans la même séance, jusqu'au nombre réglé. Un
    // entraînement raté arrête les nouveautés jusqu'au lendemain.
    nouveautes: Object.freeze({defaut: 1, maximum: 3}),
    // Mes calculs du jour : seulement ce qui est dû (31/10 : plus de calculs
    // d'entretien), 20 au plus, un par compétence. Pour un niveau de faits,
    // un calcul juste au-delà de 5 s ne fait pas monter.
    jour: Object.freeze({maximum: 20, lentMs: 5000}),
    // Une compétence ratée dans Mes calculs du jour : rouge, entraînée avec
    // l'aide (« Je m'entraîne encore » : commence à l'image, fini à 3 justes
    // de suite sans aide, 20 calculs au plus) ; 3 rouges au plus par séance,
    // puis la nouveauté vient toujours. Ratée une 2e fois de suite : elle
    // refait J'apprends. Ratée une 3e fois de suite : mise de côté 3 jours
    // (boîte 1, pas rouge pendant ces jours, signalée au professeur), puis
    // elle revient par J'apprends et « Je m'entraîne encore ».
    rattrapage: Object.freeze({echecs: 2, deCote: 3, joursDeCote: 3, parSeance: 3, sansOutil: 3, maximum: 20}),
    seance: Object.freeze({garder: 60, etapes: 99}),
    // Le journal d'une séance (lot G1) : des comptes bornés, la durée en
    // minutes de temps actif (90 au plus). La séance ouverte compte ses
    // secondes (90 minutes au plus).
    journal: Object.freeze({compte: 999, minutes: 90, secondes: 5400}),
    jours: Object.freeze({garder: 14}),
    compteur: 9999,
    causes: 12
  });

  // Le plan de la séance en cours, `seance.p` : sept nombres.
  //   [0] 1 si la séance est ouverte (commencée, pas finie) ;
  //   [1] 1 si Mes calculs du jour restent à jouer ;
  //   [2] rang + 1 de la compétence rouge à entraîner (décidé après Mes
  //       calculs du jour), 0 s'il n'y en a pas (ou plus) ;
  //   [3] le nombre de tests d'entrée joués ;
  //   [4] la nouveauté : 0 à faire, 2 faite, 3 arrêtée après un entraînement
  //       raté (rien de nouveau avant demain). (1 n'est plus utilisé.)
  //   [5] les nouveautés prévues pour cette séance, 1 à 3 (le réglage de la
  //       classe à l'ouverture ; 0, un plan d'avant le lot F1, vaut 1) ;
  //   [6] les nouveautés réussies dans cette séance.
  // Un plan à cinq nombres (une page d'avant le lot F1) se relit avec 0 et
  // 0 : une seule nouveauté, comme avant.
  const PLAN = Object.freeze({ouverte: 0, jour: 1, rattrapage: 2, tests: 3, nouveaute: 4, prevues: 5, reussies: 6});
  const NOUVEAUTE = Object.freeze({aFaire: 0, faite: 2, arretee: 3});
  const PLAN_MAX = Object.freeze([1, 1, RANGS.total, SEUILS.test.parSeance, 3, SEUILS.nouveautes.maximum, SEUILS.nouveautes.maximum]);

  // Le journal des séances (lot G1 « journal + accueil », 07/11/2026). Pour
  // chaque séance FINIE, rangée comme `seances` (la même place dans chaque
  // liste) : les calculs du jour faits, combien étaient justes, les
  // nouveautés réussies, les compétences prouvées au test, les rouges
  // entraînées (« Je m'entraîne encore »), la durée en minutes de temps
  // actif. Rien que des entiers : le serveur ne garde ni texte ni liste
  // d'objets ; ni heure, ni calcul, ni réponse. -1 : pas connu (une séance
  // finie avant le lot G1, ou une valeur abîmée).
  const JOURNAL = Object.freeze(["calculs", "justes", "nouveautes", "prouvees", "rouges", "minutes"]);
  const JOURNAL_MAX = Object.freeze([SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.nouveautes.maximum,
    SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.journal.minutes]);
  // Ce que la séance OUVERTE a déjà fait, `seance.j` : six nombres, versés
  // au journal quand elle finit.
  //   [0] calculs du jour faits, [1] justes, [2] compétences prouvées au
  //   test, [3] rouges entraînées, [4] secondes de temps actif,
  //   [5] nouveautés réussies.
  // Correctif G1 (relecture de Codex) : les nouveautés se comptent ICI, au
  // moment où elles sont réussies, et plus dans le plan (`p[6]`) — après
  // minuit, le plan neuf repart de 0 et la nouveauté de la veille était
  // perdue. Un `j` de cinq nombres (enregistré avant le correctif) se relit
  // avec 0 nouveauté.
  const EN_COURS = Object.freeze({calculs: 0, justes: 1, prouvees: 2, rouges: 3, secondes: 4, nouveautes: 5});
  const EN_COURS_MAX = Object.freeze([SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.journal.compte,
    SEUILS.journal.compte, SEUILS.journal.secondes, SEUILS.nouveautes.maximum]);

  // Le nombre de nouveautés d'une séance : 1, 2 ou 3 (un vrai nombre, pas
  // « 2 » en texte) ; tout le reste vaut 1.
  function nombreDeNouveautes(valeur) {
    return Number.isInteger(valeur) && valeur >= 1 && valeur <= SEUILS.nouveautes.maximum ? valeur : SEUILS.nouveautes.defaut;
  }

  // Les nouveautés prévues d'un plan (0 : un plan d'avant le lot F1).
  function prevuesDuPlan(plan) {
    return nombreDeNouveautes(plan[PLAN.prevues]);
  }

  function cloner(valeur) {
    return JSON.parse(JSON.stringify(valeur));
  }

  function entier(valeur, minimum, maximum, defaut = 0) {
    const nombre = Number(valeur);
    if (!Number.isInteger(nombre) || nombre < minimum || nombre > maximum) return defaut;
    return nombre;
  }

  // Une date est un VRAI jour, « AAAA-MM-JJ », rien d'autre : la même règle
  // que le serveur (lib/progression.php, date_reelle : checkdate, année 1 à
  // 9999). Lot G1 : la forme seule ne suffit plus — le serveur retire d'une
  // liste « 2026-02-30 » ou « 0000-01-01 », et les listes alignées (les
  // séances et leur journal, les dates des compétences) glisseraient d'un
  // rang ; ici, elles sont écartées (séances) ou valent null (compétences).
  function dateOuNull(valeur) {
    if (typeof valeur !== "string") return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur);
    if (!m) return null;
    const [annee, mois, jour] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (annee < 1 || mois < 1 || mois > 12 || jour < 1) return null;
    const bissextile = annee % 4 === 0 && (annee % 100 !== 0 || annee % 400 === 0);
    const jours = [31, bissextile ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mois - 1];
    return jour <= jours ? valeur : null;
  }

  // LE jour du parcours : le jour local de l'appareil.
  function jourLocal(instant = new Date()) {
    const d = instant instanceof Date && !Number.isNaN(instant.getTime()) ? instant : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // « AAAA-MM-JJ » + n jours, en jours locaux (midi, pour ignorer les
  // changements d'heure).
  function ajouterJours(jour, nombre) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    d.setDate(d.getDate() + nombre);
    return jourLocal(d);
  }

  function ecartJours(premier, second) {
    const a = new Date(`${premier}T12:00:00`);
    const b = new Date(`${second}T12:00:00`);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.round((b - a) / 86400000);
  }

  // Le lundi de la semaine d'un jour (semaine du lundi au dimanche).
  function lundiDe(jour) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return jourLocal(d);
  }

  // Le délai de retour d'une boîte, en jours, et le jour où une compétence
  // revient quand elle vient d'y entrer.
  function delaiDeBoite(boite) {
    return SEUILS.revision.delais[entier(boite, 1, SEUILS.revision.boites, 1) - 1];
  }

  function echeanceDeBoite(boite, jour) {
    return ajouterJours(jour, delaiDeBoite(boite));
  }

  // La couleur d'une boîte : gris (pas entrée), rouge (à revoir), bleu (en
  // route), vert (sue).
  function couleurDeBoite(boite) {
    if (!boite) return "gris";
    if (boite === 1) return "rouge";
    return boite >= SEUILS.revision.su ? "vert" : "bleu";
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
    return normaliserSeancesEtJournal(liste, null).seances;
  }

  function journalVide() {
    const journal = {};
    JOURNAL.forEach(champ => { journal[champ] = []; });
    return journal;
  }

  // Une entrée du journal, propre : six entiers, -1 quand ce n'est pas
  // connu ; jamais plus de justes que de calculs.
  function entreePropre(brute) {
    const entree = JOURNAL_MAX.map((maximum, index) => entier(brute[index], -1, maximum, -1));
    if (entree[0] >= 0 && entree[1] > entree[0]) entree[1] = entree[0];
    return entree;
  }

  // Les séances finies ET leur journal, rangés ensemble (lot G1) : chaque
  // date garde son entrée. Une liste du journal plus courte que les séances
  // (une progression d'avant le lot G1, ou abîmée) s'aligne sur les plus
  // récentes : les plus anciennes valent -1 (pas connu). Une date qui n'en
  // est pas part avec son entrée ; puis le tri par date (stable : deux
  // séances du même jour gardent leur ordre) et les 60 plus récentes.
  function normaliserSeancesEtJournal(listeBrute, journalBrut) {
    const dates = Array.isArray(listeBrute) ? listeBrute : [];
    const journal = journalBrut && typeof journalBrut === "object" && !Array.isArray(journalBrut) ? journalBrut : {};
    const colonnes = JOURNAL.map(champ => {
      const liste = Array.isArray(journal[champ]) ? journal[champ] : [];
      const decalage = dates.length - liste.length;
      return index => (index - decalage >= 0 && index - decalage < liste.length ? liste[index - decalage] : -1);
    });
    const paires = [];
    dates.forEach((brute, index) => {
      const jour = dateOuNull(brute);
      if (jour) paires.push({jour, entree: entreePropre(colonnes.map(lire => lire(index)))});
    });
    return rangerSeances(paires);
  }

  // Des paires {jour, entree} : triées par jour (stable), les 60 plus
  // récentes, en deux formes — `seances` (les dates) et `journal`.
  function rangerSeances(paires) {
    const triees = paires.map((paire, rang) => ({paire, rang}))
      .sort((x, y) => (x.paire.jour < y.paire.jour ? -1 : x.paire.jour > y.paire.jour ? 1 : x.rang - y.rang))
      .map(x => x.paire).slice(-SEUILS.seance.garder);
    const journal = journalVide();
    triees.forEach(({entree}) => JOURNAL.forEach((champ, index) => journal[champ].push(entree[index])));
    return {seances: triees.map(paire => paire.jour), journal};
  }

  function pairesDe(parcours) {
    return parcours.seances.map((jour, index) => ({jour, entree: JOURNAL.map(champ => parcours.journal[champ][index])}));
  }

  function enCoursVide() {
    return [0, 0, 0, 0, 0, 0];
  }

  function nettoyerPrenom(valeur) {
    if (typeof valeur !== "string") return "";
    return valeur.replace(/\s+/g, " ").trim().slice(0, PRENOM_MAX);
  }

  // ------------------------------------------------------------------ le format

  function listeDe(nombre, valeur = 0) {
    return Array.from({length: nombre}, () => valeur);
  }

  // Un module : pour chaque niveau, sa boîte `b` (0 = pas entrée), son
  // échéance `e`, « J'apprends » fait `a`, les séries jouées `f`, les échecs
  // consécutifs dans Mes calculs du jour `x`, « entraînée avec l'aide le
  // jour `vu` » `t` (le rouge d'abord : une seule fois par jour) ; et les
  // erreurs par cause `c`.
  // Une compétence pas entrée n'a pas d'échéance : null, et surtout pas "" —
  // le serveur retire d'une liste toute chaîne qui n'est pas une date, les
  // échéances suivantes glisseraient d'un rang.
  // Lot G1 : deux dates par compétence, comme `e` (null quand il n'y en a
  // pas) — `d`, le jour où elle est ENTRÉE (apprise à l'entraînement, ou
  // prouvée au test), et `s`, le jour où elle est devenue SUE (passée de la
  // boîte 3 à la boîte 4, ou entrée sue par le test). Chacune est posée UNE
  // fois et ne bouge plus : une compétence redescendue puis remontée ne
  // compte pas une seconde fois.
  function moduleVide(id) {
    const k = NIVEAUX[id];
    return {vu: null, ok: null, b: listeDe(k), e: listeDe(k, null), a: listeDe(k), f: listeDe(k), x: listeDe(k), t: listeDe(k),
      d: listeDe(k, null), s: listeDe(k, null), c: {}};
  }

  function planVide() {
    return [0, 0, 0, 0, 0, 0, 0];
  }

  function creerParcours() {
    return {
      version: VERSION,
      epoque: 0,
      prenom: "",
      modules: {},
      seance: {jour: null, etape: 0, n: 0, p: planVide(), j: enCoursVide()},
      seances: [],
      journal: journalVide(),
      jours: []
    };
  }

  function normaliserListe(brut, nombre, maximum) {
    const liste = Array.isArray(brut) ? brut : [];
    return Array.from({length: nombre}, (_, index) => entier(liste[index], 0, maximum));
  }

  function normaliserModule(id, brut) {
    const k = NIVEAUX[id];
    const ligne = moduleVide(id);
    if (!brut || typeof brut !== "object") return ligne;
    ligne.vu = dateOuNull(brut.vu);
    ligne.ok = dateOuNull(brut.ok);
    ligne.b = normaliserListe(brut.b, k, SEUILS.revision.boites);
    ligne.a = normaliserListe(brut.a, k, 1);
    ligne.f = normaliserListe(brut.f, k, SEUILS.compteur);
    ligne.x = normaliserListe(brut.x, k, SEUILS.rattrapage.deCote);
    ligne.t = normaliserListe(brut.t, k, 1);
    const echeances = Array.isArray(brut.e) ? brut.e : [];
    const entrees = Array.isArray(brut.d) ? brut.d : [];
    const sues = Array.isArray(brut.s) ? brut.s : [];
    for (let i = 0; i < k; i += 1) {
      // L'échéance, les échecs, l'entraînement du jour et les deux dates
      // n'existent que pour une compétence entrée. Une date absente ou
      // abîmée vaut null (une compétence entrée avant le lot G1).
      if (ligne.b[i]) {
        ligne.e[i] = dateOuNull(echeances[i]) || ligne.vu || jourLocal();
        ligne.d[i] = dateOuNull(entrees[i]);
        ligne.s[i] = dateOuNull(sues[i]);
      } else { ligne.x[i] = 0; ligne.t[i] = 0; }
    }
    if (brut.c && typeof brut.c === "object" && !Array.isArray(brut.c)) {
      Object.keys(brut.c).filter(cause => /^\d{1,2}$/.test(cause)).sort((x, y) => Number(x) - Number(y))
        .slice(0, SEUILS.causes).forEach(cause => {
          const compte = entier(brut.c[cause], 1, SEUILS.compteur);
          if (compte) ligne.c[String(Number(cause))] = compte;
        });
    }
    return ligne;
  }

  function normaliserPlan(brut) {
    const liste = Array.isArray(brut) ? brut : [];
    return PLAN_MAX.map((maximum, index) => entier(liste[index], 0, maximum));
  }

  // La reprise des boîtes de la version 2 (lot « couverture », 06/11/2026) :
  // A8-3 est réuni à A8-2, F5-3 à F5-2. Avant de couper la liste à 2
  // niveaux, la compétence réunie prend, des deux anciennes, la plus
  // prudente : celle qui est entrée ; entrées toutes les deux, celle qui a la
  // boîte la plus basse (son échéance, ses échecs, son « entraînée avec
  // l'aide »). « J'apprends fait » vaut si les deux l'étaient ; les séries
  // jouées s'ajoutent. Une compétence réunie ratée revient donc tout de
  // suite par Mes calculs du jour, jamais une boîte gagnée sans avoir été
  // jouée. Les compétences des autres modules ne bougent pas : leurs rangs,
  // si, et le plan d'une séance de la version 2 est refermé (plus bas).
  const REUNIS_V3 = Object.freeze({A8: Object.freeze([2, 3]), F5: Object.freeze([2, 3])});
  function reprendreV2(id, brut) {
    if (!brut || typeof brut !== "object") return brut;
    // A2 a un niveau de plus (A2-5) : le module n'est plus su tant que ce
    // niveau n'est pas appris (il n'est plus coché).
    if (id === "A2") return Object.assign({}, brut, {ok: null});
    if (!REUNIS_V3[id]) return brut;
    const [garde, parti] = REUNIS_V3[id].map(n => n - 1);
    const liste = cle => (Array.isArray(brut[cle]) ? brut[cle].slice() : []);
    const b = liste("b");
    const nombre = (x, max) => entier(x, 0, max);
    const boiteG = nombre(b[garde], SEUILS.revision.boites);
    const boiteP = nombre(b[parti], SEUILS.revision.boites);
    const source = !boiteP ? garde : !boiteG ? parti : boiteP < boiteG ? parti : garde;
    const copie = Object.assign({}, brut);
    ["b", "e", "x", "t"].forEach(cle => {
      const l = liste(cle);
      if (source === parti) l[garde] = l[parti];
      l.splice(parti, 1);
      copie[cle] = l;
    });
    const a = liste("a");
    a[garde] = boiteG && boiteP ? Math.min(nombre(a[garde], 1), nombre(a[parti], 1)) : nombre(a[source], 1);
    a.splice(parti, 1);
    copie.a = a;
    const f = liste("f");
    f[garde] = Math.min(SEUILS.compteur, nombre(f[garde], SEUILS.compteur) + nombre(f[parti], SEUILS.compteur));
    f.splice(parti, 1);
    copie.f = f;
    return copie;
  }

  function normaliserParcours(brut) {
    const parcours = creerParcours();
    if (!brut || typeof brut !== "object") return parcours;
    parcours.epoque = entier(brut.epoque, 0, 1000000);
    parcours.prenom = nettoyerPrenom(brut.prenom);
    const avantV3 = entier(brut.version, 0, 999) < 3;
    if (brut.modules && typeof brut.modules === "object" && !Array.isArray(brut.modules)) {
      CODES.forEach(id => {
        if (!Object.prototype.hasOwnProperty.call(brut.modules, id)) return;
        parcours.modules[id] = normaliserModule(id, avantV3 ? reprendreV2(id, brut.modules[id]) : brut.modules[id]);
      });
    }
    const seance = brut.seance && typeof brut.seance === "object" ? brut.seance : {};
    // Le plan d'une séance ne vaut que dans sa version : en version 1, les
    // rangs des compétences et le sens de p[4] étaient autres ; en version 2,
    // les rangs (A2 a un niveau de plus, A8, A9, M9, F5 en ont moins). Une
    // progression plus ancienne garde ses boîtes et son nombre de séances,
    // mais sa séance en cours est refermée (elle se rouvre sur un plan neuf).
    // Une séance de version 3 continue en version 4 (lot F1) : son plan à 5
    // nombres se relit 0, 0 (une nouveauté, comme avant).
    const ancienne = entier(brut.version, 0, 999) < 3;
    parcours.seance = {
      jour: ancienne ? null : dateOuNull(seance.jour),
      etape: ancienne ? 0 : entier(seance.etape, 0, SEUILS.seance.etapes),
      n: entier(seance.n, 0, SEUILS.compteur),
      p: ancienne ? planVide() : normaliserPlan(seance.p),
      j: enCoursVide()
    };
    // Ce que la séance ouverte a fait (lot G1) : rien quand elle n'est pas
    // ouverte. Une séance de version 4 ouverte repart de zéro.
    if (parcours.seance.p[PLAN.ouverte] === 1 && Array.isArray(seance.j)) {
      parcours.seance.j = EN_COURS_MAX.map((maximum, index) => entier(seance.j[index], 0, maximum));
      if (parcours.seance.j[EN_COURS.justes] > parcours.seance.j[EN_COURS.calculs]) parcours.seance.j[EN_COURS.justes] = parcours.seance.j[EN_COURS.calculs];
    }
    const rangees = normaliserSeancesEtJournal(brut.seances, brut.journal);
    parcours.seances = rangees.seances;
    parcours.journal = rangees.journal;
    parcours.jours = normaliserJours(brut.jours);
    return parcours;
  }

  function definirPrenom(parcours, prenom) {
    const copie = normaliserParcours(parcours);
    copie.prenom = nettoyerPrenom(prenom);
    return copie;
  }

  // « Recommencer à zéro » : tout s'efface, l'époque monte — à la fusion,
  // l'époque la plus haute gagne en bloc, l'ancien travail ne revient pas.
  function remettreAZero(parcours) {
    const neuf = creerParcours();
    neuf.epoque = normaliserParcours(parcours).epoque + 1;
    return neuf;
  }

  function estVide(parcours) {
    return !parcours.prenom && !Object.keys(parcours.modules).length && !parcours.seances.length && !parcours.jours.length;
  }

  function ligneDe(parcours, id) {
    return parcours.modules[id] || moduleVide(id);
  }

  function noterJour(parcours, date) {
    const jour = dateOuNull(date);
    if (jour && !parcours.jours.includes(jour)) parcours.jours = normaliserJours([...parcours.jours, jour]);
  }

  // ------------------------------------------------- les modules et leurs couleurs

  // `carte` : ce que rend CORE.carte() — les modules (ce qui est construit,
  // le palier et le type de chaque niveau) et l'ordre du parcours, une
  // compétence après l'autre (« A1-1 », « A1-2 », …). La séance ne parcourt
  // que les compétences des modules construits.
  function normaliserCarte(carte) {
    if (Array.isArray(carte)) return {modules: carte, ordre: carte.flatMap(f => Array.from({length: f.niveaux || 0}, (_, i) => `${f.id}-${i + 1}`))};
    if (carte && typeof carte === "object") return {modules: Array.isArray(carte.modules) ? carte.modules : [], ordre: Array.isArray(carte.ordre) ? carte.ordre : []};
    return {modules: [], ordre: []};
  }

  function ficheCarte(carte, id) {
    return normaliserCarte(carte).modules.find(fiche => fiche.id === id) || null;
  }

  function construits(carte) {
    return normaliserCarte(carte).modules.filter(fiche => fiche.construit && Object.prototype.hasOwnProperty.call(NIVEAUX, fiche.id));
  }

  // Le palier d'une compétence (0 : pas dans la carte) et son type.
  function palierDe(carte, id, niveau) {
    const fiche = ficheCarte(carte, id);
    return fiche && Array.isArray(fiche.paliers) ? entier(fiche.paliers[niveau - 1], 0, 9) : fiche ? entier(fiche.palier, 0, 9) : 0;
  }

  function typeDe(carte, id, niveau) {
    const fiche = ficheCarte(carte, id);
    return fiche && Array.isArray(fiche.types) && fiche.types[niveau - 1] === "F" ? "F" : "P";
  }

  // L'ordre du parcours restreint aux modules construits : [{module, niveau}].
  function parcoursConstruit(carte) {
    const {ordre} = normaliserCarte(carte);
    const ids = new Set(construits(carte).map(fiche => fiche.id));
    const liste = [];
    ordre.forEach(cle => {
      const [id, numero] = String(cle).split("-");
      const niveau = Number(numero);
      if (ids.has(id) && Number.isInteger(niveau) && niveau >= 1 && niveau <= NIVEAUX[id]) liste.push({module: id, niveau});
    });
    return liste;
  }

  // Le module est su quand toutes ses compétences sont en boîte 4 ou plus.
  function toutSu(ligne) {
    return ligne.b.every(boite => boite >= SEUILS.revision.su);
  }

  // Un module intact : rien n'y est entré, rien n'y a été joué ni appris.
  // C'est à l'entrée d'un module intact que le test en escalier se joue.
  function estIntact(ligne) {
    return !ligne.b.some(Boolean) && !ligne.f.some(Boolean) && !ligne.a.some(Boolean);
  }

  // Le module a été su un jour : il reste coché.
  function estSu(parcours, id) {
    return Boolean(parcours.modules[id] && parcours.modules[id].ok);
  }

  // « Mon niveau » (et son module, « Mon module ») : une compétence grise
  // déjà COMMENCÉE d'abord (jouée au test sans être prouvée, J'apprends fait
  // ou entraînement raté) — on finit ce qu'on a commencé : après « Le niveau
  // 3, tu vas l'apprendre maintenant », c'est lui qui vient (31/10) ; sinon
  // la première compétence grise de l'ordre de la carte. null quand tout est
  // entré.
  function competenceCourante(parcours, carte) {
    let premiere = null;
    for (const {module: id, niveau} of parcoursConstruit(carte)) {
      const ligne = ligneDe(parcours, id);
      if (ligne.b[niveau - 1]) continue;
      if (ligne.f[niveau - 1] || ligne.a[niveau - 1]) return {module: id, niveau};
      if (!premiere) premiere = {module: id, niveau};
    }
    return premiere;
  }

  function moduleCourant(parcours, carte) {
    const courante = competenceCourante(parcours, carte);
    return courante ? courante.module : null;
  }

  // Une compétence est ROUGE pour la séance (« le rouge d'abord ») quand elle
  // est en boîte 1, ou quand elle a été ratée aujourd'hui dans Mes calculs du
  // jour (elle revient demain avec au moins un échec) : une compétence sue
  // ratée descend en boîte 3 et compte comme rouge pour la journée seulement.
  // Une compétence mise de côté (3 échecs de suite) n'est pas rouge pendant
  // ses jours de côté ; le jour où elle revient, elle l'est (boîte 1).
  function estRouge(ligne, index, aujourdhui) {
    if (!ligne.b[index]) return false;
    if (estDeCote(ligne, index, aujourdhui)) return false;
    return ligne.b[index] === 1 || (ligne.x[index] >= 1 && ligne.e[index] > aujourdhui);
  }

  // Mise de côté : 3 échecs de suite dans Mes calculs du jour, et ses jours
  // de côté ne sont pas finis.
  function estDeCote(ligne, index, aujourdhui) {
    return Boolean(ligne.b[index]) && ligne.x[index] >= SEUILS.rattrapage.deCote && ligne.e[index] > aujourdhui;
  }

  // « À voir en classe » (pour la page prof, lot 2b) : 3 échecs de suite,
  // tant qu'un calcul du jour juste ne l'a pas remise à zéro.
  function aVoirEnClasse(ligne, index) {
    return Boolean(ligne.b[index]) && ligne.x[index] >= SEUILS.rattrapage.deCote;
  }

  // « Entraînée avec l'aide aujourd'hui » : `t` ne vaut que pour le jour `vu`.
  function entraineeAujourdhui(ligne, index, aujourdhui) {
    return ligne.vu === aujourdhui && ligne.t[index] === 1;
  }

  // Les compétences rouges des modules construits, dans l'ordre de la
  // carte ; `nonEntrainees` : seulement celles qui n'ont pas encore été
  // entraînées aujourd'hui.
  function rouges(parcours, carte, aujourdhui, {nonEntrainees = false} = {}) {
    return parcoursConstruit(carte).filter(({module: id, niveau}) => {
      const ligne = parcours.modules[id];
      return ligne && estRouge(ligne, niveau - 1, aujourdhui) && !(nonEntrainees && entraineeAujourdhui(ligne, niveau - 1, aujourdhui));
    });
  }

  // L'état d'un module dans le parcours, et la couleur de chaque compétence :
  //   bientot  pas encore construit ;
  //   su       il a été su (il reste coché) ;
  //   revoir   su, mais une de ses compétences est rouge ;
  //   encours  commencé ;
  //   libre    pas commencé.
  function etatModule(parcours, id, carte) {
    const fiche = ficheCarte(carte, id);
    const ligne = ligneDe(parcours, id);
    const courante = competenceCourante(parcours, carte);
    const base = {
      id,
      niveaux: NIVEAUX[id],
      couleurs: ligne.b.map(couleurDeBoite),
      paliers: ligne.b.map((_, index) => palierDe(carte, id, index + 1)),
      ici: courante && courante.module === id ? courante.niveau : 0
    };
    if (!fiche || !fiche.construit) return Object.assign(base, {etat: "bientot"});
    if (ligne.ok) return Object.assign(base, {etat: ligne.b.includes(1) ? "revoir" : "su"});
    return Object.assign(base, {etat: estIntact(ligne) ? "libre" : "encours"});
  }

  // Les compétences par palier (sues, entrées, total) et par couleur, et
  // les modules sus. Le palier est celui du niveau (carte v2).
  function compter(parcours, carte) {
    const paliers = new Map();
    const competences = {gris: 0, rouge: 0, bleu: 0, vert: 0};
    let modulesSus = 0;
    let modules = 0;
    normaliserCarte(carte).modules.filter(fiche => Object.prototype.hasOwnProperty.call(NIVEAUX, fiche.id)).forEach(fiche => {
      const ligne = ligneDe(parcours, fiche.id);
      let dansLaCarte = false;
      ligne.b.forEach((boite, index) => {
        const palier = palierDe(carte, fiche.id, index + 1);
        if (!palier) return;
        dansLaCarte = true;
        const compte = paliers.get(palier) || {palier, sues: 0, entrees: 0, total: 0};
        compte.total += 1;
        if (boite) compte.entrees += 1;
        if (boite >= SEUILS.revision.su) compte.sues += 1;
        paliers.set(palier, compte);
        competences[couleurDeBoite(boite)] += 1;
      });
      if (dansLaCarte) {
        modules += 1;
        if (estSu(parcours, fiche.id)) modulesSus += 1;
      }
    });
    const liste = [...paliers.values()].sort((x, y) => x.palier - y.palier);
    return {
      paliers: liste,
      sues: liste.reduce((s, p) => s + p.sues, 0),
      entrees: liste.reduce((s, p) => s + p.entrees, 0),
      total: liste.reduce((s, p) => s + p.total, 0),
      modulesSus,
      modules,
      competences
    };
  }

  // ------------------------------------------------------------ la séance guidée

  function aujourdhuiFinie(parcours, aujourdhui) {
    return parcours.seances.includes(aujourdhui);
  }

  // Une séance est ouverte quand elle a été commencée aujourd'hui et qu'elle
  // n'est pas finie. Celle de la veille ne compte plus.
  function seanceOuverte(parcours, aujourdhui = jourLocal()) {
    return parcours.seance.jour === aujourdhui && parcours.seance.p[PLAN.ouverte] === 1;
  }

  // Un entraînement raté aujourd'hui : rien de nouveau avant demain.
  function nouveauteArretee(parcours, aujourdhui) {
    return parcours.seance.jour === aujourdhui && parcours.seance.p[PLAN.nouveaute] === NOUVEAUTE.arretee;
  }

  // Toutes les compétences entrées dans les boîtes, des modules construits.
  function competencesEntrees(parcours, carte) {
    const liste = [];
    construits(carte).forEach((fiche, ordre) => {
      const ligne = parcours.modules[fiche.id];
      if (!ligne) return;
      ligne.b.forEach((boite, index) => {
        if (boite) liste.push({module: fiche.id, niveau: index + 1, boite, echeance: ligne.e[index], echecs: ligne.x[index], appris: ligne.a[index], ordre: ordre * 10 + index});
      });
    });
    return liste;
  }

  const parRetard = (p, q) => p.boite - q.boite || String(p.echeance).localeCompare(String(q.echeance)) || p.ordre - q.ordre;

  // Mes calculs du jour : un calcul par compétence DUE (31/10 : plus de
  // calculs d'entretien — réviser avant l'oubli n'apporte presque rien), les
  // plus en retard d'abord (boîte la plus basse, puis échéance la plus
  // ancienne), 20 au plus. Rien de dû : l'étape disparaît. Une compétence
  // revenue de sa mise de côté ne se joue pas ici avant d'avoir refait
  // J'apprends (elle revient par la séance). La seconde séance d'un même
  // jour ne rejoue que ce qui est encore dû.
  function tirerCalculsDuJour(parcours, carte, {aujourdhui = jourLocal()} = {}) {
    return competencesEntrees(parcours, carte)
      .filter(c => c.echeance <= aujourdhui && !(c.echecs >= SEUILS.rattrapage.deCote && !c.appris))
      .sort(parRetard).slice(0, SEUILS.jour.maximum)
      .map(c => ({module: c.module, niveau: c.niveau, du: true}));
  }

  // Les « Je m'entraîne encore » joués aujourd'hui (`t`), et la place qui
  // reste dans cette séance : 3 par séance (« Encore une séance » en
  // redonne 3).
  function rattrapagesPossibles(parcours, aujourdhui) {
    const faits = Object.values(parcours.modules).reduce((somme, ligne) => somme + (ligne.vu === aujourdhui ? ligne.t.filter(Boolean).length : 0), 0);
    const finies = parcours.seances.filter(jour => jour === aujourdhui).length;
    return faits < SEUILS.rattrapage.parSeance * (finies + 1);
  }

  // La compétence rouge à entraîner maintenant : parmi celles qui n'ont pas
  // encore été entraînées aujourd'hui, la boîte la plus basse, puis l'ordre
  // de la carte ; null s'il n'y en a pas, ou si la séance en a déjà eu 3.
  function aEntrainer(parcours, carte, aujourdhui) {
    if (!rattrapagesPossibles(parcours, aujourdhui)) return null;
    const liste = rouges(parcours, carte, aujourdhui, {nonEntrainees: true})
      .map(c => Object.assign({boite: ligneDe(parcours, c.module).b[c.niveau - 1]}, c))
      .sort((p, q) => p.boite - q.boite);
    return liste.length ? {module: liste[0].module, niveau: liste[0].niveau} : null;
  }

  // Les calculs du jour d'une séance : ce qui est dû.
  function calculsDeSeance(parcours, carte, aujourdhui) {
    return {calculs: tirerCalculsDuJour(parcours, carte, {aujourdhui}).length};
  }

  // Le plan d'une séance qui commence : ce qui est décidé à l'ouverture. La
  // compétence rouge à entraîner n'est décidée qu'après Mes calculs du jour
  // (c'est là que les rouges apparaissent) ; sans calculs du jour, tout de
  // suite.
  // `nouveautes` : le réglage de la classe (1, 2 ou 3), rangé dans le plan :
  // la séance garde ce nombre jusqu'au bout, ici ou sur un autre appareil.
  function planNeuf(parcours, carte, aujourdhui, nouveautes) {
    const jour = calculsDeSeance(parcours, carte, aujourdhui).calculs ? 1 : 0;
    const rouge = jour ? null : aEntrainer(parcours, carte, aujourdhui);
    return [
      0,
      jour,
      rouge ? rangDe(rouge.module, rouge.niveau) + 1 : 0,
      0,
      nouveauteArretee(parcours, aujourdhui) ? NOUVEAUTE.arretee : NOUVEAUTE.aFaire,
      nombreDeNouveautes(nouveautes),
      0
    ];
  }

  function planDe(parcours, carte, aujourdhui, nouveautes) {
    return seanceOuverte(parcours, aujourdhui) ? parcours.seance.p.slice() : planNeuf(parcours, carte, aujourdhui, nouveautes);
  }

  // La file de la séance : les étapes qui RESTENT, d'après le plan et l'état.
  //   {type: "jour", calculs}             Mes calculs du jour
  //   {type: "apprends", module, niveau}  J'apprends (nouveauté, ou rouge ratée deux fois)
  //   {type: "rattrape", module, niveau}  Je m'entraîne encore (une compétence rouge)
  //   {type: "test", module}              Tu connais déjà ? (le test en escalier)
  //   {type: "nouveau"}                   « une chose nouvelle », après un test
  //   {type: "nouveau", rang}             la 2e (3e) nouveauté prévue, tant
  //                                       que la précédente n'est pas réussie
  //   {type: "entraine", module, niveau}  Je m'entraîne
  // Rend aussi `faites` (les étapes déjà jouées), `ouverte`, `finie` (une
  // séance a fini aujourd'hui) et `minutes`.
  const MINUTES = Object.freeze({jour: 2, rattrape: 3, test: 2, nouveau: 6, apprends: 3, entraine: 3});

  // `nouveautes` : le réglage de la classe, pour une séance pas encore
  // ouverte (une séance ouverte suit son plan).
  function fileSeance(parcours, carte, {aujourdhui = jourLocal(), nouveautes = SEUILS.nouveautes.defaut} = {}) {
    const ouverte = seanceOuverte(parcours, aujourdhui);
    const plan = planDe(parcours, carte, aujourdhui, nouveautes);
    const etapes = [];
    if (plan[PLAN.jour]) {
      const {calculs} = calculsDeSeance(parcours, carte, aujourdhui);
      if (calculs) {
        // Après les calculs du jour : la nouveauté, qui vient toujours (les
        // rouges ne sont connues qu'après les calculs ; elles s'intercalent
        // alors avant elle).
        etapes.push({type: "jour", calculs});
        nouveaute();
        return resultat();
      }
    }
    if (plan[PLAN.rattrapage]) {
      const rouge = competenceDeRang(plan[PLAN.rattrapage] - 1);
      const ligne = ligneDe(parcours, rouge.module);
      // Ratée deux fois de suite : elle refait J'apprends d'abord.
      if (!ligne.a[rouge.niveau - 1]) etapes.push({type: "apprends", module: rouge.module, niveau: rouge.niveau});
      etapes.push({type: "rattrape", module: rouge.module, niveau: rouge.niveau});
    }
    // Le rouge d'abord (3 au plus, une à la fois), puis la nouveauté vient
    // TOUJOURS (31/10) : une compétence rouge ne bloque plus rien.
    nouveaute();
    return resultat();

    function nouveaute() {
      const courante = competenceCourante(parcours, carte);
      if (!courante || plan[PLAN.nouveaute] !== NOUVEAUTE.aFaire) return;
      const ligne = ligneDe(parcours, courante.module);
      if (estIntact(ligne) && plan[PLAN.tests] < SEUILS.test.parSeance) {
        etapes.push({type: "test", module: courante.module}, {type: "nouveau"});
      } else {
        if (!ligne.a[courante.niveau - 1]) etapes.push({type: "apprends", module: courante.module, niveau: courante.niveau});
        etapes.push({type: "entraine", module: courante.module, niveau: courante.niveau});
      }
      // Les nouveautés prévues après celle-ci (lot F1) : une ligne chacune,
      // qui ne se joue pas — elle devient la vraie étape quand la précédente
      // est réussie, et disparaît si l'entraînement est raté.
      for (let rang = plan[PLAN.reussies] + 2; rang <= prevuesDuPlan(plan); rang += 1) etapes.push({type: "nouveau", rang});
    }

    function resultat() {
      return {
        etapes,
        faites: ouverte ? parcours.seance.etape : 0,
        ouverte,
        finie: aujourdhuiFinie(parcours, aujourdhui) || nouveauteArretee(parcours, aujourdhui),
        minutes: etapes.reduce((somme, etape) => somme + MINUTES[etape.type], 0)
      };
    }
  }

  // Une étape vient d'être jouée : le plan avance. Quand il ne reste rien,
  // la séance est finie et comptée. `changer(plan)` dit ce que l'étape change.
  // Le plan est décidé sur l'état d'AVANT l'étape (`avant`).
  // Une séance commencée hier et continuée après minuit repart sur un plan
  // neuf, avec les nouveautés prévues hier (relecture de Codex, lot F1 : pas
  // le défaut 1).
  function avancerSeance(copie, avant, carte, aujourdhui, changer) {
    const plan = planDe(avant, carte, aujourdhui, avant.seance.p[PLAN.prevues] || SEUILS.nouveautes.defaut);
    const etape = seanceOuverte(avant, aujourdhui) ? avant.seance.etape : 0;
    changer(plan);
    plan[PLAN.ouverte] = 1;
    // Ce que la séance a fait la suit, même après minuit (lot G1) : elle
    // compte pour le jour où elle finit.
    const fait = copie.seance.j.slice();
    copie.seance = {jour: aujourdhui, etape: Math.min(SEUILS.seance.etapes, etape + 1), n: copie.seance.n, p: plan, j: fait};
    if (fileSeance(copie, carte, {aujourdhui}).etapes.length) return false;
    // Finie : elle compte, et le plan se referme. L'arrêt après un
    // entraînement raté reste noté jusqu'à demain. Son journal est écrit à
    // la place de la séance (lot G1).
    copie.seance = {
      jour: aujourdhui,
      etape: 0,
      n: Math.min(SEUILS.compteur, copie.seance.n + 1),
      p: [0, 0, 0, 0, plan[PLAN.nouveaute] === NOUVEAUTE.arretee ? NOUVEAUTE.arretee : 0, 0, 0],
      j: enCoursVide()
    };
    const secondes = fait[EN_COURS.secondes];
    const entree = [fait[EN_COURS.calculs], fait[EN_COURS.justes], fait[EN_COURS.nouveautes], fait[EN_COURS.prouvees], fait[EN_COURS.rouges],
      secondes ? Math.max(1, Math.min(SEUILS.journal.minutes, Math.round(secondes / 60))) : 0];
    const rangees = rangerSeances([...pairesDe(copie), {jour: aujourdhui, entree: entreePropre(entree)}]);
    copie.seances = rangees.seances;
    copie.journal = rangees.journal;
    return true;
  }

  // Le temps actif d'une étape (lot G1) : la page le mesure (les gestes de
  // l'élève, les silences comptés une minute au plus) et le donne à la fin
  // de chaque étape. Il s'ajoute à la séance ouverte, et seulement à elle.
  function noterTemps(parcours, secondes) {
    const copie = normaliserParcours(parcours);
    const ajout = entier(Math.round(Number(secondes)), 0, SEUILS.journal.secondes);
    if (copie.seance.p[PLAN.ouverte] !== 1 || !ajout) return copie;
    copie.seance.j[EN_COURS.secondes] = Math.min(SEUILS.journal.secondes, copie.seance.j[EN_COURS.secondes] + ajout);
    return copie;
  }

  // Ajoute à ce que la séance ouverte a fait.
  function compterEnCours(parcours, index, ajout) {
    if (parcours.seance.p[PLAN.ouverte] !== 1 || !ajout) return;
    parcours.seance.j[index] = Math.min(EN_COURS_MAX[index], parcours.seance.j[index] + ajout);
  }

  // Un module est joué aujourd'hui : son jour `vu` change, et ce qui ne
  // valait que pour l'ancien jour (`t`, entraînée avec l'aide) s'efface.
  function toucher(ligne, aujourdhui) {
    if (ligne.vu !== aujourdhui) ligne.t = ligne.t.map(() => 0);
    ligne.vu = aujourdhui;
  }

  // ---------------------------------------------------------- apprendre, s'entraîner

  // L'entraînement à longueur adaptée, calcul après calcul. `reponses` : les
  // premières réponses données, {juste, outil} où `outil` dit ce qui était
  // affiché pour ce calcul : "image" (la droite, le tableau), "manip" (les
  // perles, le glisse-nombres) ou "aucun". Options :
  //   genre             "entraine" (Je m'entraîne) ou "rattrape" (Je
  //                     m'entraîne encore, une compétence rouge) ;
  //   manip             false quand le niveau n'a pas d'outil à manipuler
  //                     (au-delà de 100 perles) : on commence à l'image ;
  //   toutesFormesVues  la page dit si toutes les écritures ont été vues.
  // Rend :
  //   outil    ce qu'il faut afficher pour le calcul SUIVANT ;
  //   reussi   Je m'entraîne : 5 justes de suite sans outil et toutes les
  //            écritures vues ; encore : 3 justes de suite sans outil ;
  //   fini     réussi, ou 25 calculs joués (encore : 20).
  // Je m'entraîne : l'outil à manipuler d'abord, 2 justes ; puis l'image,
  // 2 justes ; puis rien. Je m'entraîne encore : l'image d'abord, 2 justes,
  // puis rien. Une erreur fait revenir l'image, 2 erreurs de suite l'outil à
  // manipuler — qui laisse sa place à l'image dès un juste.
  function suivreEntrainement(reponses, {toutesFormesVues = true, genre = "entraine", manip = true} = {}) {
    const liste = Array.isArray(reponses) ? reponses.filter(Boolean) : [];
    const encore = genre === "rattrape";
    const {avecOutil, erreurs} = SEUILS.entraine;
    const sansOutil = encore ? SEUILS.rattrapage.sansOutil : SEUILS.entraine.sansOutil;
    const maximum = encore ? SEUILS.rattrapage.maximum : SEUILS.entraine.maximum;
    let outil = !encore && manip ? "manip" : "image";
    // L'outil à manipuler du début dure 2 justes ; celui qui revient après 2
    // erreurs, un seul.
    let manipDuDebut = outil === "manip";
    let justesAvecOutil = 0;
    let justesSansOutil = 0;
    let erreursDeSuite = 0;
    liste.forEach(reponse => {
      if (reponse.juste) {
        erreursDeSuite = 0;
        if (reponse.outil === "aucun") justesSansOutil += 1;
        else { justesAvecOutil += 1; justesSansOutil = 0; }
        // Les perles du début : 2 justes, puis l'image (2 justes à elle) ;
        // celles d'après 2 erreurs : un juste, puis l'image, qui part au 2e
        // juste avec l'outil.
        if (outil === "manip" && manipDuDebut) {
          if (justesAvecOutil >= avecOutil) { outil = "image"; justesAvecOutil = 0; manipDuDebut = false; }
        } else if (outil === "manip") outil = "image";
        else if (outil === "image" && justesAvecOutil >= avecOutil) { outil = "aucun"; justesAvecOutil = 0; }
      } else {
        erreursDeSuite += 1;
        justesAvecOutil = 0;
        justesSansOutil = 0;
        manipDuDebut = false;
        outil = erreursDeSuite >= erreurs && manip ? "manip" : "image";
      }
    });
    const reussi = justesSansOutil >= sansOutil && (encore || toutesFormesVues);
    return {outil, reussi, fini: reussi || liste.length >= maximum, justes: liste.filter(r => r.juste).length, total: liste.length, justesDeSuite: justesSansOutil, objectif: sansOutil};
  }

  // Le verdict d'un entraînement fini : `reponses` = les premières réponses
  // {juste, outil}.
  function verdictEntrainement(reponses, options = {}) {
    const suivi = suivreEntrainement(reponses, options);
    return {justes: suivi.justes, total: suivi.total, reussi: suivi.reussi};
  }

  function ajouterCauses(ligne, causes) {
    Object.keys(causes || {}).forEach(cause => {
      if (!/^\d{1,2}$/.test(cause)) return;
      const cle = String(Number(cause));
      const ajout = entier(causes[cause], 0, SEUILS.compteur);
      if (!ajout) return;
      if (!ligne.c[cle] && Object.keys(ligne.c).length >= SEUILS.causes) return;
      ligne.c[cle] = Math.min(SEUILS.compteur, (ligne.c[cle] || 0) + ajout);
    });
  }

  // Une série finie, hors Mes calculs du jour. `serie` :
  //   {module, niveau, genre: "apprends" | "entraine" | "rattrape",
  //    reponses: [{juste, outil}], causes: {cause: nombre}}
  // Avec `seance: true`, la série est une étape de la séance du jour.
  //  - apprends : « J'apprends » est fait pour ce niveau ;
  //  - entraine : réussi (5 justes de suite sans outil), la compétence entre
  //    en boîte 2 et revient demain ; raté (20 calculs), rien ne bouge —
  //    dans la séance, rien de nouveau avant demain, et demain repart de
  //    « J'apprends » ;
  //  - rattrape : la compétence rouge a été entraînée avec l'aide
  //    aujourd'hui ; sa boîte ne bouge pas, ses échecs non plus (ce sont les
  //    calculs du jour qui jugent).
  // Une erreur ne fait JAMAIS descendre ici.
  function appliquerSerie(parcours, serie, {aujourdhui = jourLocal(), carte = null, seance = false} = {}) {
    const avant = normaliserParcours(parcours);
    const copie = cloner(avant);
    const id = serie && serie.module;
    const evenements = [];
    if (!Object.prototype.hasOwnProperty.call(NIVEAUX, id)) return {parcours: copie, verdict: null, evenements, finie: false};
    const n = entier(serie.niveau, 1, NIVEAUX[id], 1);
    const ligne = ligneDe(copie, id);
    copie.modules[id] = ligne;
    toucher(ligne, aujourdhui);
    let finie = false;
    if (serie.genre === "apprends") {
      ligne.a[n - 1] = 1;
      if (seance) finie = avancerSeance(copie, avant, carte, aujourdhui, () => {});
      return {parcours: copie, verdict: null, evenements, finie};
    }
    const verdict = verdictEntrainement(Array.isArray(serie.reponses) ? serie.reponses : [], {genre: serie.genre});
    ligne.f[n - 1] = Math.min(SEUILS.compteur, ligne.f[n - 1] + 1);
    ajouterCauses(ligne, serie.causes);
    noterJour(copie, aujourdhui);
    if (serie.genre === "rattrape") {
      if (ligne.b[n - 1]) ligne.t[n - 1] = 1;
      if (seance) compterEnCours(copie, EN_COURS.rouges, 1);
      // La rouge suivante (3 par séance au plus), sinon la nouveauté.
      if (seance) finie = avancerSeance(copie, avant, carte, aujourdhui, plan => {
        const suivante = aEntrainer(copie, carte, aujourdhui);
        plan[PLAN.rattrapage] = suivante ? rangDe(suivante.module, suivante.niveau) + 1 : 0;
      });
      return {parcours: copie, verdict, evenements, finie};
    }
    const nouvelle = !ligne.b[n - 1];
    if (verdict.reussi && nouvelle) {
      ligne.b[n - 1] = SEUILS.revision.entraine;
      ligne.e[n - 1] = echeanceDeBoite(SEUILS.revision.entraine, aujourdhui);
      if (!ligne.d[n - 1]) ligne.d[n - 1] = aujourdhui;
      evenements.push({type: "entree", module: id, niveau: n, boite: SEUILS.revision.entraine});
    }
    // Une nouveauté réussie compte dans la séance ouverte, tout de suite
    // (correctif G1 : elle reste comptée si la séance continue après minuit).
    if (seance && verdict.reussi && nouvelle) compterEnCours(copie, EN_COURS.nouveautes, 1);
    if (seance) {
      // Raté : demain repart de « J'apprends », rien de nouveau aujourd'hui.
      if (!verdict.reussi) ligne.a[n - 1] = 0;
      // Réussi : une nouveauté de plus ; la suivante vient tant que la
      // séance en prévoit (lot F1). Raté : plus rien de nouveau aujourd'hui.
      // Une compétence déjà entrée (l'autre appareil a fini le même
      // entraînement, et la fusion l'a apporté pendant la série) ne compte
      // pas une 2e fois : la nouveauté suivante vient quand même (relecture
      // de Codex, lot F1).
      finie = avancerSeance(copie, avant, carte, aujourdhui, plan => {
        if (!verdict.reussi) { plan[PLAN.nouveaute] = NOUVEAUTE.arretee; return; }
        if (nouvelle) plan[PLAN.reussies] = Math.min(SEUILS.nouveautes.maximum, plan[PLAN.reussies] + 1);
        plan[PLAN.nouveaute] = plan[PLAN.reussies] < prevuesDuPlan(plan) ? NOUVEAUTE.aFaire : NOUVEAUTE.faite;
      });
    }
    return {parcours: copie, verdict, evenements, finie};
  }

  // ------------------------------------------------------------ le test d'entrée

  // « Tu connais déjà ? », en escalier. `test` :
  //   {module, marche, niveaux: [{niveau, justes, total}], causes}
  // `marche` : la marche la plus haute prouvée (0 : aucune). Elle entre en
  // boîte 3 (revient dans 3 jours) ; les marches en dessous entrent en boîte
  // 4 (sues, reviennent dans 7 jours) ; les autres restent à apprendre. Le
  // test ne fait qu'entrer : il ne descend rien, ne touche pas une
  // compétence déjà entrée.
  function appliquerTest(parcours, test, {aujourdhui = jourLocal(), carte = null, seance = false} = {}) {
    const avant = normaliserParcours(parcours);
    const copie = cloner(avant);
    const id = test && test.module;
    if (!Object.prototype.hasOwnProperty.call(NIVEAUX, id)) return {parcours: copie, bilan: [], tout: false, marche: 0, finie: false};
    const ligne = ligneDe(copie, id);
    copie.modules[id] = ligne;
    toucher(ligne, aujourdhui);
    noterJour(copie, aujourdhui);
    ajouterCauses(ligne, test.causes);
    const resultats = Array.from({length: NIVEAUX[id]}, (_, index) => {
      const resultat = (Array.isArray(test.niveaux) ? test.niveaux : []).find(r => r && r.niveau === index + 1) || {};
      const total = entier(resultat.total, 0, 99);
      return {total, justes: entier(resultat.justes, 0, total)};
    });
    // La marche annoncée ne dépasse jamais ce que les résultats prouvent :
    // des marches montées l'une après l'autre, chacune avec 2 justes.
    let prouvee = 0;
    while (prouvee < NIVEAUX[id] && resultats[prouvee].justes >= SEUILS.test.parMarche) prouvee += 1;
    const marche = Math.min(entier(test.marche, 0, NIVEAUX[id]), prouvee);
    const bilan = resultats.map(({total, justes}, index) => {
      const connu = index + 1 <= marche;
      if (total) ligne.f[index] = Math.min(SEUILS.compteur, ligne.f[index] + 1);
      const boite = index + 1 === marche ? SEUILS.revision.test : SEUILS.revision.dessous;
      const entre = connu && !ligne.b[index];
      if (entre) {
        ligne.b[index] = boite;
        ligne.e[index] = echeanceDeBoite(boite, aujourdhui);
        // Lot G1 : entrée aujourd'hui ; sue aujourd'hui si elle entre en
        // boîte 4 (une marche en dessous de la plus haute prouvée).
        if (!ligne.d[index]) ligne.d[index] = aujourdhui;
        if (boite >= SEUILS.revision.su && !ligne.s[index]) ligne.s[index] = aujourdhui;
        // Une marche prouvée compte comme « J'apprends fait » (31/10) : il ne
        // revient qu'après deux échecs de suite.
        ligne.a[index] = 1;
      }
      return {niveau: index + 1, justes, total, connu, entre, boite: connu ? boite : 0, jouee: total > 0};
    });
    if (!ligne.ok && toutSu(ligne)) ligne.ok = aujourdhui;
    const tout = marche === NIVEAUX[id];
    let finie = false;
    if (seance) compterEnCours(copie, EN_COURS.prouvees, bilan.filter(niveau => niveau.entre).length);
    if (seance) finie = avancerSeance(copie, avant, carte, aujourdhui, plan => { plan[PLAN.tests] = Math.min(SEUILS.test.parSeance, plan[PLAN.tests] + 1); });
    return {parcours: copie, bilan, tout, marche, finie};
  }

  // -------------------------------------------------------- Mes calculs du jour

  // UNE réponse de Mes calculs du jour — le seul moment qui compte. `retour` :
  //   {module, niveau, juste, ms, type: "F" | "P", cause}
  //  - juste et due : la boîte monte (7 au plus), nouvelle échéance ;
  //    pour un niveau de faits, juste mais au-delà de 5 s : la boîte reste,
  //    l'échéance passe à demain ;
  //  - juste et pas due : rien ;
  //  - fausse ou passée : la boîte descend (1 au moins), échéance demain, un
  //    échec consécutif de plus ; au deuxième échec de suite, « J'apprends »
  //    est à refaire ; au troisième, la compétence est mise de côté 3 jours
  //    (boîte 1) et signalée au professeur.
  // Une compétence ne monte pas deux fois le même jour : montée ou descendue,
  // elle n'est plus due aujourd'hui.
  function appliquerRetour(parcours, retour, {aujourdhui = jourLocal()} = {}) {
    const copie = normaliserParcours(parcours);
    const id = retour && retour.module;
    const evenements = [];
    if (!Object.prototype.hasOwnProperty.call(NIVEAUX, id)) return {parcours: copie, mouvement: null, evenements};
    const index = entier(retour.niveau, 1, NIVEAUX[id], 1) - 1;
    const ligne = ligneDe(copie, id);
    const boite = ligne.b[index];
    if (!boite) return {parcours: copie, mouvement: null, evenements};
    copie.modules[id] = ligne;
    toucher(ligne, aujourdhui);
    noterJour(copie, aujourdhui);
    // Le journal (lot G1) : un calcul du jour de plus dans la séance ouverte,
    // juste ou pas.
    compterEnCours(copie, EN_COURS.calculs, 1);
    if (retour.juste) compterEnCours(copie, EN_COURS.justes, 1);
    const due = ligne.e[index] <= aujourdhui;
    if (retour.juste) {
      const lent = retour.type === "F" && Number(retour.ms) > SEUILS.jour.lentMs;
      if (due && lent) ligne.e[index] = ajouterJours(aujourdhui, 1);
      else if (due) {
        ligne.b[index] = Math.min(SEUILS.revision.boites, boite + 1);
        ligne.e[index] = echeanceDeBoite(ligne.b[index], aujourdhui);
        // Lot G1 : la boîte 4 atteinte pour la première fois — sue.
        if (boite < SEUILS.revision.su && ligne.b[index] >= SEUILS.revision.su && !ligne.s[index]) ligne.s[index] = aujourdhui;
      }
      ligne.x[index] = 0;
    } else {
      ligne.x[index] = Math.min(SEUILS.rattrapage.deCote, ligne.x[index] + 1);
      if (ligne.x[index] >= SEUILS.rattrapage.echecs) ligne.a[index] = 0;
      if (ligne.x[index] >= SEUILS.rattrapage.deCote) {
        ligne.b[index] = 1;
        ligne.e[index] = ajouterJours(aujourdhui, SEUILS.rattrapage.joursDeCote);
      } else {
        ligne.b[index] = Math.max(1, boite - 1);
        ligne.e[index] = ajouterJours(aujourdhui, 1);
      }
      if (retour.cause) ajouterCauses(ligne, {[retour.cause]: 1});
    }
    // Le module devient su : la date est posée une fois, elle ne s'efface pas.
    if (!ligne.ok && toutSu(ligne)) {
      ligne.ok = aujourdhui;
      evenements.push({type: "module", module: id});
    }
    const apres = ligne.b[index];
    return {
      parcours: copie,
      mouvement: {
        module: id, niveau: index + 1, avant: boite, apres, due,
        sens: apres > boite ? "monte" : !retour.juste ? "descend" : "reste",
        couleur: couleurDeBoite(apres),
        rouge: estRouge(ligne, index, aujourdhui),
        deCote: estDeCote(ligne, index, aujourdhui),
        jours: ecartJours(aujourdhui, ligne.e[index])
      },
      evenements
    };
  }

  // Mes calculs du jour sont finis : l'étape est faite, et la suite se
  // décide — la première compétence rouge à entraîner, s'il y en a une.
  function terminerCalculsDuJour(parcours, {aujourdhui = jourLocal(), carte = null} = {}) {
    const avant = normaliserParcours(parcours);
    const copie = cloner(avant);
    const rouge = aEntrainer(copie, carte, aujourdhui);
    const finie = avancerSeance(copie, avant, carte, aujourdhui, plan => {
      plan[PLAN.jour] = 0;
      plan[PLAN.rattrapage] = rouge ? rangDe(rouge.module, rouge.niveau) + 1 : 0;
    });
    return {parcours: copie, finie, rouge};
  }

  // « Commencer » : le plan de la séance est décidé et rangé, pour qu'elle se
  // reprenne telle quelle le jour même, ici ou sur un autre appareil. Une
  // séance déjà ouverte aujourd'hui n'est pas touchée.
  // `nouveautes` : le réglage de la classe (1, 2 ou 3), rangé dans le plan.
  function ouvrirSeance(parcours, carte, {aujourdhui = jourLocal(), nouveautes = SEUILS.nouveautes.defaut} = {}) {
    const copie = normaliserParcours(parcours);
    if (seanceOuverte(copie, aujourdhui)) return copie;
    const plan = planNeuf(copie, carte, aujourdhui, nouveautes);
    plan[PLAN.ouverte] = 1;
    // Une séance NEUVE part de zéro (lot G1) : ce qu'avait fait une séance
    // laissée ouverte un autre jour ne la suit pas.
    copie.seance = {jour: aujourdhui, etape: 0, n: copie.seance.n, p: plan, j: enCoursVide()};
    return copie;
  }

  // « Demain : … » : la compétence qui vient (ou la rouge à reprendre), et
  // les calculs qui reviennent.
  function demain(parcours, carte, {aujourdhui = jourLocal()} = {}) {
    const lendemain = ajouterJours(aujourdhui, 1);
    const rougesDemain = rouges(parcours, carte, lendemain);
    return {
      prochaine: competenceCourante(parcours, carte),
      rouge: rougesDemain.length ? {module: rougesDemain[0].module, niveau: rougesDemain[0].niveau} : null,
      reviennent: tirerCalculsDuJour(parcours, carte, {aujourdhui: lendemain}).length
    };
  }

  // « N fois cette semaine » : les séances finies depuis lundi.
  function bilanSeances(parcours, aujourdhui = jourLocal()) {
    const lundi = lundiDe(aujourdhui);
    return {
      semaine: parcours.seances.filter(jour => jour >= lundi && jour <= aujourdhui).length,
      aujourdhui: parcours.seances.filter(jour => jour === aujourdhui).length
    };
  }

  // Les séances finies des 4 dernières semaines, du lundi au dimanche, la
  // semaine en cours en dernier (jusqu'à aujourd'hui) — le calcul de Défi
  // tables (seancesParSemaine, lot 5g). Les 60 séances gardées peuvent ne
  // plus couvrir une vieille semaine : `seances` vaut null (« ? ») pour une
  // semaine finie avant la plus ancienne gardée, et `plus` dit « au moins »
  // (« 16+ ») pour la semaine où elle tombe.
  const SEMAINES_AFFICHEES = 4;
  function seancesParSemaine(parcours, aujourdhui = jourLocal()) {
    const liste = parcours.seances.filter(jour => jour <= aujourdhui);
    const lundi = lundiDe(aujourdhui);
    const plusAncienne = parcours.seances.length >= SEUILS.seance.garder ? parcours.seances[0] : null;
    const semaines = [];
    for (let recul = SEMAINES_AFFICHEES - 1; recul >= 0; recul -= 1) {
      const debut = ajouterJours(lundi, -7 * recul);
      const fin = recul === 0 ? aujourdhui : ajouterJours(debut, 6);
      if (plusAncienne && plusAncienne > fin) semaines.push({lundi: debut, seances: null, plus: false});
      else semaines.push({lundi: debut, seances: liste.filter(jour => jour >= debut && jour <= fin).length, plus: Boolean(plusAncienne && plusAncienne >= debut)});
    }
    return semaines;
  }

  // « 3 », « 16+ » (au moins), « ? » (plus connu).
  function texteSemaine(semaine) {
    if (!semaine || semaine.seances === null) return "?";
    return semaine.plus ? `${semaine.seances}+` : String(semaine.seances);
  }

  // Ce que l'élève pourra voir de sa semaine (lot G1, planche 1 du
  // 07/11/2026 ; l'accueil est à refaire, en discussion à part — il garde
  // « N fois cette semaine » en attendant), et ce que lira la page prof :
  //   montrer   faux tant qu'il n'y a aucune séance dans les 4 dernières
  //             semaines (une ligne de zéros ressemble à un reproche) ;
  //   jours     les 7 jours, du lundi au dimanche : fait (une séance finie),
  //             aujourdhui, apres (pas encore venu) ;
  //   soirs     les jours de cette semaine avec une séance finie ;
  //   semaines  les 4 dernières semaines (seancesParSemaine) ;
  //   sues      les compétences devenues sues depuis lundi, et toujours
  //             sues (une compétence redescendue ne compte plus) ;
  //   avancees  les compétences entrées ou devenues sues depuis lundi
  //             [{module, niveau}] — leurs modules ont « avancé ».
  // Seulement les modules de la carte (un module réservé n'a pas de palier).
  function semaineEleve(parcours, carte, aujourdhui = jourLocal()) {
    const p = normaliserParcours(parcours);
    const lundi = lundiDe(aujourdhui);
    const jours = Array.from({length: 7}, (_, i) => {
      const jour = ajouterJours(lundi, i);
      // Un jour pas encore venu n'est jamais « fait », même avec une séance
      // datée de lui (l'horloge d'un autre appareil) — correctif G1.
      return {jour, fait: jour <= aujourdhui && p.seances.includes(jour), aujourdhui: jour === aujourdhui, apres: jour > aujourdhui};
    });
    const semaines = seancesParSemaine(p, aujourdhui);
    const cetteSemaine = jour => Boolean(jour) && jour >= lundi && jour <= aujourdhui;
    let sues = 0;
    const avancees = [];
    normaliserCarte(carte).modules.filter(fiche => Object.prototype.hasOwnProperty.call(NIVEAUX, fiche.id)).forEach(fiche => {
      const ligne = p.modules[fiche.id];
      if (!ligne) return;
      ligne.b.forEach((boite, index) => {
        if (!boite || !palierDe(carte, fiche.id, index + 1)) return;
        if (cetteSemaine(ligne.s[index]) && boite >= SEUILS.revision.su) sues += 1;
        if (cetteSemaine(ligne.d[index]) || cetteSemaine(ligne.s[index])) avancees.push({module: fiche.id, niveau: index + 1});
      });
    });
    return {
      montrer: semaines.some(semaine => semaine.seances),
      jours,
      soirs: jours.filter(jour => jour.fait && !jour.apres).length,
      semaines,
      sues,
      avancees
    };
  }

  // ---------------------------------------------------- le rangement par code
  //
  // Repris de Défi tables à l'identique (lot A1, lot 8) : une case par code sur
  // l'appareil, la clé porte une EMPREINTE du code (SHA-256 salé, répété), jamais
  // le code ; sous un code, la case ne contient pas de prénom.
  const CLE_SEL = "mathsgo-defi-calcul-sel";
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
  const CLE_SYNC = "mathsgo-defi-calcul-sync";

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
        stockage.removeItem(CLE_REGLAGES);
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

  // Le réglage de la classe (lot F1, 07/11/2026) : le nombre de nouveautés
  // par séance, que le serveur rend avec l'identité (api/eleve.php,
  // « reglages » : {"defi-calcul": {"nouveautes": 2}} ; rien = 1). Rangé
  // dans l'ONGLET, lié au code, comme l'identité ; sans code, ou illisible :
  // 1. Le réglage par élève (lot F2) viendra par le même chemin.
  const CLE_REGLAGES = "mathsgo-defi-calcul-reglages";

  function nouveautesDeReglages(reglages) {
    const r = reglages && typeof reglages === "object" && !Array.isArray(reglages) ? reglages["defi-calcul"] : null;
    return nombreDeNouveautes(r && typeof r === "object" ? r.nouveautes : null);
  }

  function chargerReglagesOnglet(stockage, code) {
    try {
      const propre = normaliserCode(code || "");
      const brut = stockage && codeValide(propre) ? stockage.getItem(CLE_REGLAGES) : null;
      if (!brut) return SEUILS.nouveautes.defaut;
      const lu = JSON.parse(brut);
      if (!lu || typeof lu !== "object" || lu.code !== propre) return SEUILS.nouveautes.defaut;
      return nombreDeNouveautes(lu.nouveautes);
    } catch (_) {
      return SEUILS.nouveautes.defaut;
    }
  }

  // `reglages` : ce que le serveur a rendu. Rien de lisible (une réponse
  // sans « reglages ») : on ne touche à rien.
  function sauverReglagesOnglet(stockage, code, reglages) {
    try {
      const propre = normaliserCode(code || "");
      if (!stockage || !codeValide(propre) || !reglages || typeof reglages !== "object" || Array.isArray(reglages)) return false;
      const nouveautes = nouveautesDeReglages(reglages);
      if (nouveautes === SEUILS.nouveautes.defaut) stockage.removeItem(CLE_REGLAGES);
      else stockage.setItem(CLE_REGLAGES, JSON.stringify({code: propre, nouveautes}));
      return true;
    } catch (_) {
      return false;
    }
  }

  function effacerReglagesOnglet(stockage) {
    try {
      if (stockage) stockage.removeItem(CLE_REGLAGES);
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

  // Lequel des deux côtés a vu le module le plus récemment ; à égalité, un
  // choix qui ne dépend pas de l'ordre des arguments (les boîtes les plus
  // basses, puis le texte le plus petit).
  function coteLePlusRecent(a, b) {
    const va = a.vu || "";
    const vb = b.vu || "";
    if (va !== vb) return va > vb ? a : b;
    const somme = ligne => ligne.b.reduce((s, boite) => s + boite, 0);
    if (somme(a) !== somme(b)) return somme(a) < somme(b) ? a : b;
    return JSON.stringify(a) <= JSON.stringify(b) ? a : b;
  }

  function fusionnerModule(id, a, b) {
    if (!a) return cloner(b);
    if (!b) return cloner(a);
    const k = NIVEAUX[id];
    const ligne = moduleVide(id);
    ligne.vu = dateLaPlusRecente(a.vu, b.vu);
    ligne.ok = dateLaPlusAncienne(a.ok, b.ok);
    // Les boîtes, les échéances, les échecs et « J'apprends à refaire » : en
    // bloc, du côté qui a vu le module le plus récemment. Une compétence
    // entrée seulement de l'autre côté n'est pas perdue : elle garde sa boîte
    // de là-bas. `a` (J'apprends fait) suit le bloc d'une compétence entrée
    // (remis à 0 par deux échecs, il ne revient pas à 1 par l'autre côté) ;
    // pas entrée, une leçon faite d'un côté compte ; le même jour des deux
    // côtés, le plus prudent : refaire une leçon coûte moins que la sauter.
    // `t` (entraînée avec l'aide le jour `vu`) vaut pour le jour le plus
    // récent ; ce jour-là, entraînée d'un côté suffit.
    const recent = coteLePlusRecent(a, b);
    const autre = recent === a ? b : a;
    for (let i = 0; i < k; i += 1) {
      ligne.f[i] = Math.max(a.f[i], b.f[i]);
      const source = recent.b[i] || !autre.b[i] ? recent : autre;
      ligne.a[i] = a.vu === b.vu ? Math.min(a.a[i], b.a[i]) : source.b[i] ? source.a[i] : Math.max(a.a[i], b.a[i]);
      ligne.b[i] = source.b[i];
      ligne.e[i] = source.e[i];
      ligne.x[i] = source.x[i];
      ligne.t[i] = ligne.b[i] ? Math.max(a.vu === ligne.vu ? a.t[i] : 0, b.vu === ligne.vu ? b.t[i] : 0) : 0;
      // Les deux dates (lot G1) : le premier jour connu d'un côté ou de
      // l'autre — elles ne sont posées qu'une fois, la plus ancienne est la
      // vraie. Pas entrée : pas de date.
      ligne.d[i] = ligne.b[i] ? dateLaPlusAncienne(a.d[i], b.d[i]) : null;
      ligne.s[i] = ligne.b[i] ? dateLaPlusAncienne(a.s[i], b.s[i]) : null;
    }
    [...new Set([...Object.keys(a.c), ...Object.keys(b.c)])].sort((x, y) => Number(x) - Number(y)).forEach(cause => {
      ligne.c[cause] = Math.max(a.c[cause] || 0, b.c[cause] || 0);
    });
    // Deux appareils qui ont chacun une partie des compétences sues.
    if (!ligne.ok && toutSu(ligne)) ligne.ok = ligne.vu;
    return ligne;
  }

  // Deux états du même élève (cet appareil et le serveur, ou deux
  // appareils) : on garde le plus avancé, jamais d'écrasement.
  function fusionner(premier, second) {
    const a = normaliserParcours(premier);
    const b = normaliserParcours(second);
    // L'époque la plus haute gagne en bloc (« Recommencer à zéro »).
    if (a.epoque !== b.epoque) return a.epoque > b.epoque ? a : b;
    const fusion = creerParcours();
    fusion.epoque = a.epoque;
    fusion.prenom = a.prenom || b.prenom;
    CODES.forEach(id => {
      if (a.modules[id] || b.modules[id]) fusion.modules[id] = fusionnerModule(id, a.modules[id], b.modules[id]);
    });
    // La séance et son plan : du côté qui a le plus de séances finies, puis
    // le jour le plus récent, puis l'étape la plus avancée, puis la séance
    // OUVERTE ; à égalité complète, le texte le plus petit.
    // Correctif G1 : une séance ne se referme qu'en finissant (son compte
    // monte) — au même compte, au même jour et à la même étape, l'ouverte
    // est donc la plus récente. Avant, le texte le plus petit (la fermée)
    // gagnait : une séance ouverte sans étape finie, rechargée avant que le
    // serveur l'ait reçue, se refermait et perdait ce qu'elle avait fait.
    const rang = cote => [cote.seance.n, cote.seance.jour || "", cote.seance.etape, cote.seance.p[PLAN.ouverte], JSON.stringify(cote.seance.p)];
    const [ra, rb] = [rang(a), rang(b)];
    const aDevant = ra[0] !== rb[0] ? ra[0] > rb[0] : ra[1] !== rb[1] ? ra[1] > rb[1] : ra[2] !== rb[2] ? ra[2] > rb[2]
      : ra[3] !== rb[3] ? ra[3] > rb[3] : ra[4] <= rb[4];
    fusion.seance = cloner(aDevant ? a.seance : b.seance);
    // La même séance des deux côtés (même compte, même jour) : les tests
    // faits, la nouveauté (0 à faire < 2 faite < 3 arrêtée), les nouveautés
    // prévues et réussies sont le plus grand des deux (lot F1, relecture de
    // Codex) — un plan à 5 nombres (relu 0, 0) ou tronqué par une page
    // d'avant F1 ne fait pas perdre le réglage, ni revenir le compteur des
    // tests à 0 ; un entraînement raté d'un côté arrête aussi l'autre. Le
    // nombre réglé atteint : plus de nouveauté.
    if (ra[0] === rb[0] && ra[1] === rb[1] && fusion.seance.jour) {
      const p = fusion.seance.p;
      [PLAN.tests, PLAN.nouveaute, PLAN.prevues, PLAN.reussies].forEach(i => {
        p[i] = Math.max(a.seance.p[i], b.seance.p[i]);
      });
      if (p[PLAN.nouveaute] === NOUVEAUTE.aFaire && p[PLAN.reussies] >= prevuesDuPlan(p)) p[PLAN.nouveaute] = NOUVEAUTE.faite;
      // Ce que la séance a fait (lot G1) : le plus grand des deux, compte
      // par compte, comme le plan. Ouverte d'un côté seulement : celui-là.
      if (p[PLAN.ouverte] === 1) {
        const ouverte = cote => (cote.seance.p[PLAN.ouverte] === 1 ? cote.seance.j : enCoursVide());
        fusion.seance.j = EN_COURS_MAX.map((_, i) => Math.max(ouverte(a)[i], ouverte(b)[i]));
      }
    }
    if (fusion.seance.p[PLAN.ouverte] !== 1) fusion.seance.j = enCoursVide();
    // Les séances finies : par date, le plus grand des deux comptes. Le
    // journal suit ses séances (lot G1), ENTRÉE PAR ENTRÉE (correctif G1,
    // relecture de Codex) — jamais une journée entière d'un côté :
    //  - les entrées d'un jour s'alignent depuis le début (les séances d'un
    //    jour s'ajoutent à la fin : une vieille copie en a le début) ;
    //  - une journée COUPÉE par la borne (la date la plus ancienne d'une
    //    liste pleine, 60 séances) n'en garde que la fin : ce jour-là, les
    //    entrées s'alignent depuis la fin, et celles du côté coupé font foi
    //    aux places qu'elles couvrent (une vieille copie qui a encore le
    //    début de la journée ne remplace pas ce qui l'a suivi) ;
    //  - à une même place, l'entrée qui en sait le plus (le moins de « pas
    //    connu ») gagne, puis le plus grand total, puis un choix fixe sur le
    //    texte : le même dans les deux sens. L'entrée entière vient d'un
    //    seul côté, les colonnes ne se mélangent pas.
    // Le format ne bouge pas (pas d'identifiant de séance).
    const parJour = cote => pairesDe(cote).reduce((m, paire) => m.set(paire.jour, [...(m.get(paire.jour) || []), paire.entree]), new Map());
    const [ja, jb] = [parJour(a), parJour(b)];
    const coupee = cote => (cote.seances.length >= SEUILS.seance.garder ? cote.seances[0] : null);
    const [coupeeA, coupeeB] = [coupee(a), coupee(b)];
    const connues = entree => entree.filter(v => v >= 0).length;
    const total = entree => entree.reduce((somme, v) => somme + Math.max(0, v), 0);
    const meilleure = (x, y) => {
      if (connues(x) !== connues(y)) return connues(x) > connues(y) ? x : y;
      if (total(x) !== total(y)) return total(x) > total(y) ? x : y;
      return JSON.stringify(x) >= JSON.stringify(y) ? x : y;
    };
    const paires = [];
    [...new Set([...ja.keys(), ...jb.keys()])].sort().forEach(jour => {
      const ea = ja.get(jour) || [];
      const eb = jb.get(jour) || [];
      const longueur = Math.max(ea.length, eb.length);
      const [aCoupe, bCoupe] = [jour === coupeeA, jour === coupeeB];
      const depuisLaFin = aCoupe || bCoupe;
      const lire = (liste, place) => {
        const index = depuisLaFin ? place - (longueur - liste.length) : place;
        return index >= 0 && index < liste.length ? liste[index] : null;
      };
      for (let place = 0; place < longueur; place += 1) {
        const [x, y] = [lire(ea, place), lire(eb, place)];
        let gagne;
        if (!x || !y) gagne = x || y;
        else if (aCoupe !== bCoupe) gagne = aCoupe ? x : y;
        else gagne = meilleure(x, y);
        paires.push({jour, entree: gagne.slice()});
      }
    });
    const rangees = rangerSeances(paires);
    fusion.seances = rangees.seances;
    fusion.journal = rangees.journal;
    fusion.jours = normaliserJours([...a.jours, ...b.jours]);
    return normaliserParcours(fusion);
  }

  // ---------------------------------------------- ce que lit le professeur
  //
  // Lot 2b (31/10/2026) : la page « Ma classe » de suivi.mathsgo.re et la
  // tuile de Mon espace lisent un parcours par cette fonction, et par elle
  // seule — la page ne touche jamais aux boîtes. Elle rend ce qu'on affiche,
  // jamais un texte : les noms viennent de defi_calcul_core.js, côté page.
  // Un parcours abîmé ou absent est d'abord renormalisé (bornes du moteur) ;
  // `lisible` dit si quelque chose a pu être lu.
  //
  // L'état d'une compétence, tel que le professeur le voit :
  //   gris    pas entrée (à apprendre) ;
  //   route   entrée, en route (boîtes 2 et 3) ;
  //   su      sue (boîtes 4 à 7) ;
  //   revoir  rouge pour la séance (boîte 1, ou ratée aujourd'hui) ;
  //   classe  « à voir en classe » : mise de côté au 3e échec de suite, tant
  //           qu'un calcul du jour juste ne l'a pas remise à zéro — pendant
  //           ses jours de côté, et après, quand elle est revenue rouge.
  function etatCompetence(ligne, index, aujourdhui) {
    if (!ligne.b[index]) return "gris";
    if (aVoirEnClasse(ligne, index)) return "classe";
    if (estRouge(ligne, index, aujourdhui)) return "revoir";
    return ligne.b[index] >= SEUILS.revision.su ? "su" : "route";
  }

  function resumeProf(brut, carte, aujourdhui = jourLocal()) {
    const parcours = normaliserParcours(brut);
    const lisible = Boolean(brut && typeof brut === "object");
    const compte = compter(parcours, carte);
    // Le même compte sur les seuls modules construits : ce que l'appli
    // propose aujourd'hui (la page du professeur compte là-dessus ; la tuile
    // et l'accueil de l'élève, sur toute la carte).
    const carteOuverte = normaliserCarte(carte);
    const ouvert = compter(parcours, {modules: carteOuverte.modules.filter(fiche => fiche.construit), ordre: carteOuverte.ordre});
    const modules = [];
    const revoir = [];
    normaliserCarte(carte).modules.filter(fiche => Object.prototype.hasOwnProperty.call(NIVEAUX, fiche.id)).forEach(fiche => {
      const ligne = ligneDe(parcours, fiche.id);
      const etats = ligne.b.map((_, index) => etatCompetence(ligne, index, aujourdhui));
      modules.push({
        id: fiche.id,
        construit: Boolean(fiche.construit),
        niveaux: NIVEAUX[fiche.id],
        etats,
        paliers: ligne.b.map((_, index) => palierDe(carte, fiche.id, index + 1)),
        boites: ligne.b.slice(),
        su: Boolean(ligne.ok),
        vu: ligne.vu,
        // Lot G1 (pour la page prof, lot G2) : le jour où chaque compétence
        // est entrée, et celui où elle est devenue sue (null : pas connu).
        entrees: ligne.d.slice(),
        sues: ligne.s.slice()
      });
      etats.forEach((etat, index) => {
        if (etat !== "revoir" && etat !== "classe") return;
        revoir.push({
          module: fiche.id, niveau: index + 1, etat,
          deCote: estDeCote(ligne, index, aujourdhui),
          echeance: ligne.e[index],
          // « J'apprends à refaire » : après deux échecs de suite.
          apprends: ligne.a[index] === 0,
          echecs: ligne.x[index],
          // Déjà réentraînée avec l'aide aujourd'hui (le rouge d'abord).
          entrainee: entraineeAujourdhui(ligne, index, aujourdhui)
        });
      });
    });
    // Les causes d'erreur, par module, les plus fréquentes d'abord (c est un
    // compte depuis le début : le serveur n'a pas de semaine).
    const causes = [];
    Object.keys(parcours.modules).forEach(id => {
      Object.keys(parcours.modules[id].c).forEach(cause => causes.push({module: id, cause: Number(cause), n: parcours.modules[id].c[cause]}));
    });
    causes.sort((p, q) => q.n - p.n || p.module.localeCompare(q.module) || p.cause - q.cause);
    // Les séances : cette semaine (depuis lundi), les 4 dernières semaines
    // (28 jours), et les jours de cette semaine où il y en a eu.
    const lundi = lundiDe(aujourdhui);
    const depuis = ajouterJours(aujourdhui, -27);
    const seances = parcours.seances.filter(jour => jour <= aujourdhui);
    const joursSemaine = [...new Set(seances.filter(jour => jour >= lundi))];
    const dernier = seances.length ? seances[seances.length - 1] : null;
    const vus = Object.keys(parcours.modules).map(id => parcours.modules[id].vu).filter(Boolean).sort();
    return {
      lisible,
      commence: Object.keys(parcours.modules).length > 0 || parcours.seances.length > 0,
      sues: compte.sues, entrees: compte.entrees, total: compte.total, paliers: compte.paliers,
      ouvert: {sues: ouvert.sues, entrees: ouvert.entrees, total: ouvert.total, paliers: ouvert.paliers},
      modules,
      revoir,
      aVoir: revoir.filter(c => c.etat === "classe").length,
      rouges: revoir.filter(c => c.etat === "revoir").length,
      causes,
      seances: {semaine: seances.filter(jour => jour >= lundi).length, quatreSemaines: seances.filter(jour => jour >= depuis).length,
        total: parcours.seances.length, jours: joursSemaine},
      // Lot G1 (pour la page prof, lot G2) : les 4 dernières semaines, et le
      // journal, une séance finie par ligne, de la plus ancienne à la plus
      // récente — null : pas connu (une séance finie avant le lot G1).
      semaines: seancesParSemaine(parcours, aujourdhui),
      journal: pairesDe(parcours).map(({jour, entree}) => {
        const ligne = {jour};
        JOURNAL.forEach((champ, index) => { ligne[champ] = entree[index] >= 0 ? entree[index] : null; });
        return ligne;
      }),
      dernier: dernier && vus.length ? (dernier >= vus[vus.length - 1] ? dernier : vus[vus.length - 1]) : dernier || (vus.length ? vus[vus.length - 1] : null)
    };
  }

  // Le nombre de clés à toute profondeur (ce que compte le serveur) et la
  // taille en octets du JSON enregistré.
  function mesurer(parcours) {
    let cles = 0;
    const compter = valeur => {
      if (Array.isArray(valeur)) valeur.forEach(compter);
      else if (valeur && typeof valeur === "object") Object.keys(valeur).forEach(cle => { cles += 1; compter(valeur[cle]); });
    };
    compter(parcours);
    const json = JSON.stringify(parcours);
    let octets = 0;
    for (let i = 0; i < json.length; i += 1) {
      const code = json.charCodeAt(i);
      octets += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
    }
    return {cles, octets};
  }

  return Object.freeze({
    VERSION,
    CLE_STOCKAGE,
    NIVEAUX,
    CODES,
    SEUILS,
    PLAN,
    NOUVEAUTE,
    creerParcours,
    normaliserParcours,
    nettoyerPrenom,
    definirPrenom,
    remettreAZero,
    estVide,
    jourLocal,
    ajouterJours,
    ecartJours,
    lundiDe,
    delaiDeBoite,
    echeanceDeBoite,
    couleurDeBoite,
    rangDe,
    competenceDeRang,
    estSu,
    estIntact,
    etatModule,
    competenceCourante,
    moduleCourant,
    parcoursConstruit,
    palierDe,
    typeDe,
    rouges,
    estDeCote,
    aVoirEnClasse,
    compter,
    suivreEntrainement,
    verdictEntrainement,
    appliquerSerie,
    appliquerTest,
    appliquerRetour,
    terminerCalculsDuJour,
    tirerCalculsDuJour,
    ouvrirSeance,
    seanceOuverte,
    fileSeance,
    demain,
    bilanSeances,
    seancesParSemaine,
    texteSemaine,
    semaineEleve,
    noterTemps,
    JOURNAL,
    etatCompetence,
    resumeProf,
    mesurer,
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
    purger,
    clesRevelentUnCode,
    CLE_SYNC,
    cleSync,
    chargerSync,
    sauverSync,
    effacerSync,
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
    CLE_REGLAGES,
    nombreDeNouveautes,
    nouveautesDeReglages,
    chargerReglagesOnglet,
    sauverReglagesOnglet,
    effacerReglagesOnglet,
    fusionner
  });
});
