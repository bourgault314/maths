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

  const VERSION = 2;
  const CLE_STOCKAGE = "mathsgo-defi-calcul-parcours";
  const PRENOM_MAX = 20;
  // Le code de suivi et l'identité vivent dans l'ONGLET, sous les mêmes clés
  // que Défi tables : c'est le même élève, entré par le même espace.
  const CLE_CODE = "mathsgo-suivi-code";
  const ALPHABET_CODE = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const LONGUEUR_CODE = 6;

  // Les 74 codes et leur nombre de niveaux, dans l'ordre de la carte v2 (les
  // 45 modules construits ou à construire, puis les 29 réservés). Un test
  // compare cette table aux fiches de defi_calcul_core.js.
  const NIVEAUX = Object.freeze({
    A1: 3, A10: 3, A11: 3, A2: 4, A3: 4, A4: 4, A5: 4, A6: 4, A7: 3, A8: 3, A9: 4,
    M4: 2, M1: 3, M2: 2, M3: 3, M5: 1, M6: 2, M13: 3, M7: 3, M8: 3, M9: 3, M10: 3, M11: 2, M12: 3,
    C1: 3, C3: 3, C4: 2,
    D1: 3, D2: 4, D3: 3, D4: 3, D5: 2, D6: 3, D7: 3, D8: 3, D9: 2,
    F2: 2, F1: 3, F3: 3, F4: 2, F5: 3, F6: 3, F8: 3, F9: 2, F11: 2,
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
    // Un entraînement à longueur adaptée (scénario du 30/10) : l'outil
    // reste affiché jusqu'à 2 justes de suite avec lui ; réussi à 5 justes de
    // suite sans outil ; après 2 erreurs de suite, l'outil redevient à
    // manipuler ; au bout de 20 calculs sans y arriver, c'est raté.
    entraine: Object.freeze({avecOutil: 2, sansOutil: 5, erreurs: 2, maximum: 20}),
    // Le test d'entrée en escalier : 2 calculs par marche, un 3e si un faux
    // (2 sur 3 pour monter) ; 4 tests au plus dans une séance.
    test: Object.freeze({parMarche: 2, departage: 3, parSeance: 4}),
    // Les boîtes : délais de retour 1, 1, 3, 7, 14 jours. Une compétence
    // entre en boîte 2 (entraînement), 3 (la marche la plus haute prouvée au
    // test) ou 4 (les marches en dessous) ; elle est sue en boîte 4.
    revision: Object.freeze({boites: 5, delais: Object.freeze([1, 1, 3, 7, 14]), entraine: 2, test: 3, dessous: 4, su: 4}),
    // Mes calculs du jour : 10 à 20 calculs, un par compétence. Pour un
    // niveau de faits, un calcul juste au-delà de 5 s ne fait pas monter.
    jour: Object.freeze({minimum: 10, maximum: 20, lentMs: 5000}),
    // Une compétence ratée dans Mes calculs du jour : rouge, entraînée avec
    // l'aide ; ratée une deuxième fois de suite : elle refait J'apprends.
    // `nouveauteApres` : une fois les rouges du jour entraînées, la nouveauté
    // reprend dans la même séance (sinon : rien de nouveau tant qu'une
    // compétence est rouge, même entraînée).
    rattrapage: Object.freeze({echecs: 2, nouveauteApres: true}),
    seance: Object.freeze({garder: 60, etapes: 99}),
    jours: Object.freeze({garder: 14}),
    compteur: 9999,
    causes: 12
  });

  // Le plan de la séance en cours, `seance.p` : cinq nombres.
  //   [0] 1 si la séance est ouverte (commencée, pas finie) ;
  //   [1] 1 si Mes calculs du jour restent à jouer ;
  //   [2] rang + 1 de la compétence rouge à entraîner (décidé après Mes
  //       calculs du jour), 0 s'il n'y en a pas (ou plus) ;
  //   [3] le nombre de tests d'entrée joués ;
  //   [4] la nouveauté : 0 à faire, 2 faite, 3 arrêtée après un entraînement
  //       raté (rien de nouveau avant demain). (1 n'est plus utilisé.)
  const PLAN = Object.freeze({ouverte: 0, jour: 1, rattrapage: 2, tests: 3, nouveaute: 4});
  const NOUVEAUTE = Object.freeze({aFaire: 0, faite: 2, arretee: 3});
  const PLAN_MAX = Object.freeze([1, 1, RANGS.total, SEUILS.test.parSeance, 3]);

  function cloner(valeur) {
    return JSON.parse(JSON.stringify(valeur));
  }

  function entier(valeur, minimum, maximum, defaut = 0) {
    const nombre = Number(valeur);
    if (!Number.isInteger(nombre) || nombre < minimum || nombre > maximum) return defaut;
    return nombre;
  }

  // Une date est un jour, « AAAA-MM-JJ », rien d'autre.
  function dateOuNull(valeur) {
    return typeof valeur === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valeur) ? valeur : null;
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
    return (Array.isArray(liste) ? liste : []).map(dateOuNull).filter(Boolean).sort().slice(-SEUILS.seance.garder);
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
  function moduleVide(id) {
    const k = NIVEAUX[id];
    return {vu: null, ok: null, b: listeDe(k), e: listeDe(k, null), a: listeDe(k), f: listeDe(k), x: listeDe(k), t: listeDe(k), c: {}};
  }

  function planVide() {
    return [0, 0, 0, 0, 0];
  }

  function creerParcours() {
    return {
      version: VERSION,
      epoque: 0,
      prenom: "",
      modules: {},
      seance: {jour: null, etape: 0, n: 0, p: planVide()},
      seances: [],
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
    ligne.x = normaliserListe(brut.x, k, SEUILS.rattrapage.echecs);
    ligne.t = normaliserListe(brut.t, k, 1);
    const echeances = Array.isArray(brut.e) ? brut.e : [];
    for (let i = 0; i < k; i += 1) {
      // L'échéance, les échecs et l'entraînement du jour n'existent que pour
      // une compétence entrée.
      if (ligne.b[i]) ligne.e[i] = dateOuNull(echeances[i]) || ligne.vu || jourLocal();
      else { ligne.x[i] = 0; ligne.t[i] = 0; }
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

  function normaliserParcours(brut) {
    const parcours = creerParcours();
    if (!brut || typeof brut !== "object") return parcours;
    parcours.epoque = entier(brut.epoque, 0, 1000000);
    parcours.prenom = nettoyerPrenom(brut.prenom);
    if (brut.modules && typeof brut.modules === "object" && !Array.isArray(brut.modules)) {
      CODES.forEach(id => {
        if (Object.prototype.hasOwnProperty.call(brut.modules, id)) parcours.modules[id] = normaliserModule(id, brut.modules[id]);
      });
    }
    const seance = brut.seance && typeof brut.seance === "object" ? brut.seance : {};
    // Le plan d'une séance ne vaut que dans sa version : en version 1, les
    // rangs des compétences et le sens de p[4] étaient autres. Une
    // progression plus ancienne garde ses boîtes et son nombre de séances,
    // mais sa séance en cours est refermée (elle se rouvre sur un plan neuf).
    const ancienne = entier(brut.version, 0, 999) < VERSION;
    parcours.seance = {
      jour: ancienne ? null : dateOuNull(seance.jour),
      etape: ancienne ? 0 : entier(seance.etape, 0, SEUILS.seance.etapes),
      n: entier(seance.n, 0, SEUILS.compteur),
      p: ancienne ? planVide() : normaliserPlan(seance.p)
    };
    parcours.seances = normaliserSeances(brut.seances);
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

  // Le module est su quand toutes ses compétences sont en boîte 4 ou 5.
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

  // La première compétence grise de l'ordre de la carte : c'est « Mon
  // niveau », et son module est « Mon module ». null quand tout est entré.
  function competenceCourante(parcours, carte) {
    for (const {module: id, niveau} of parcoursConstruit(carte)) {
      if (!ligneDe(parcours, id).b[niveau - 1]) return {module: id, niveau};
    }
    return null;
  }

  function moduleCourant(parcours, carte) {
    const courante = competenceCourante(parcours, carte);
    return courante ? courante.module : null;
  }

  // Une compétence est ROUGE pour la séance (« le rouge d'abord ») quand elle
  // est en boîte 1, ou quand elle a été ratée aujourd'hui dans Mes calculs du
  // jour (elle revient demain avec au moins un échec) : une compétence sue
  // ratée descend en boîte 3 et compte comme rouge pour la journée seulement.
  function estRouge(ligne, index, aujourdhui) {
    if (!ligne.b[index]) return false;
    return ligne.b[index] === 1 || (ligne.x[index] >= 1 && ligne.e[index] > aujourdhui);
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
        if (boite) liste.push({module: fiche.id, niveau: index + 1, boite, echeance: ligne.e[index], echecs: ligne.x[index], ordre: ordre * 10 + index});
      });
    });
    return liste;
  }

  const parRetard = (p, q) => p.boite - q.boite || String(p.echeance).localeCompare(String(q.echeance)) || p.ordre - q.ordre;
  const parEcheance = (p, q) => String(p.echeance).localeCompare(String(q.echeance)) || p.ordre - q.ordre;

  // Mes calculs du jour : un calcul par compétence.
  //  - les compétences dues, les plus en retard d'abord (boîte la plus basse,
  //    puis échéance la plus ancienne), 20 au plus ;
  //  - s'il y en a moins de 10 (et `entretien`), on complète avec les
  //    compétences non dues, par échéance la plus proche.
  // Avec peu de compétences dans les boîtes, la série est plus courte que 10.
  // La seconde séance d'un même jour ne rejoue que ce qui est encore dû.
  function tirerCalculsDuJour(parcours, carte, {aujourdhui = jourLocal(), entretien = true} = {}) {
    const entrees = competencesEntrees(parcours, carte);
    const dues = entrees.filter(c => c.echeance <= aujourdhui).sort(parRetard).slice(0, SEUILS.jour.maximum);
    const tirage = dues.map(c => ({module: c.module, niveau: c.niveau, du: true}));
    if (entretien && tirage.length < SEUILS.jour.minimum) {
      entrees.filter(c => c.echeance > aujourdhui).sort(parEcheance)
        .slice(0, SEUILS.jour.minimum - tirage.length)
        .forEach(c => tirage.push({module: c.module, niveau: c.niveau, du: false}));
    }
    return tirage;
  }

  // La compétence rouge à entraîner dans cette séance : la première de
  // l'ordre de la carte qui n'a pas encore été entraînée aujourd'hui (boîte
  // 1 d'abord).
  function aEntrainer(parcours, carte, aujourdhui) {
    const liste = rouges(parcours, carte, aujourdhui, {nonEntrainees: true})
      .map(c => Object.assign({boite: ligneDe(parcours, c.module).b[c.niveau - 1]}, c))
      .sort((p, q) => p.boite - q.boite);
    return liste.length ? {module: liste[0].module, niveau: liste[0].niveau} : null;
  }

  // Les calculs du jour d'une séance. Quand une séance a déjà fini
  // aujourd'hui, ils ne rejouent que ce qui est encore dû (pas d'entretien).
  function calculsDeSeance(parcours, carte, aujourdhui) {
    const entretien = !(aujourdhuiFinie(parcours, aujourdhui) || nouveauteArretee(parcours, aujourdhui));
    return {entretien, calculs: tirerCalculsDuJour(parcours, carte, {aujourdhui, entretien}).length};
  }

  // Le plan d'une séance qui commence : ce qui est décidé à l'ouverture. La
  // compétence rouge à entraîner n'est décidée qu'après Mes calculs du jour
  // (c'est là que les rouges apparaissent) ; sans calculs du jour, tout de
  // suite.
  function planNeuf(parcours, carte, aujourdhui) {
    const jour = calculsDeSeance(parcours, carte, aujourdhui).calculs ? 1 : 0;
    const rouge = jour ? null : aEntrainer(parcours, carte, aujourdhui);
    return [
      0,
      jour,
      rouge ? rangDe(rouge.module, rouge.niveau) + 1 : 0,
      0,
      nouveauteArretee(parcours, aujourdhui) ? NOUVEAUTE.arretee : NOUVEAUTE.aFaire
    ];
  }

  function planDe(parcours, carte, aujourdhui) {
    return seanceOuverte(parcours, aujourdhui) ? parcours.seance.p.slice() : planNeuf(parcours, carte, aujourdhui);
  }

  // La file de la séance : les étapes qui RESTENT, d'après le plan et l'état.
  //   {type: "jour", calculs}             Mes calculs du jour
  //   {type: "suite"}                     « la suite », décidée après les calculs du jour
  //   {type: "apprends", module, niveau}  J'apprends (nouveauté, ou rouge ratée deux fois)
  //   {type: "rattrape", module, niveau}  Je m'entraîne encore (une compétence rouge)
  //   {type: "test", module}              Tu connais déjà ? (le test en escalier)
  //   {type: "nouveau"}                   « une chose nouvelle », après un test
  //   {type: "entraine", module, niveau}  Je m'entraîne
  // Rend aussi `faites` (les étapes déjà jouées), `ouverte`, `finie` (une
  // séance a fini aujourd'hui) et `minutes`.
  const MINUTES = Object.freeze({jour: 2, suite: 5, rattrape: 3, test: 2, nouveau: 6, apprends: 3, entraine: 3});

  function fileSeance(parcours, carte, {aujourdhui = jourLocal()} = {}) {
    const ouverte = seanceOuverte(parcours, aujourdhui);
    const plan = planDe(parcours, carte, aujourdhui);
    const etapes = [];
    if (plan[PLAN.jour]) {
      const {entretien, calculs} = calculsDeSeance(parcours, carte, aujourdhui);
      if (calculs) {
        etapes.push({type: "jour", calculs, entretien});
        // La suite dépend des calculs du jour : un rouge à entraîner, ou une
        // chose nouvelle.
        if (plan[PLAN.nouveaute] !== NOUVEAUTE.arretee && (competenceCourante(parcours, carte) || rouges(parcours, carte, aujourdhui, {nonEntrainees: true}).length)) etapes.push({type: "suite"});
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
    // Le rouge d'abord : tant qu'une compétence est rouge (et pas encore
    // entraînée aujourd'hui, si la nouveauté reprend après), pas de nouveauté.
    const courante = competenceCourante(parcours, carte);
    const bloquantes = rouges(parcours, carte, aujourdhui, {nonEntrainees: SEUILS.rattrapage.nouveauteApres});
    if (courante && plan[PLAN.nouveaute] === NOUVEAUTE.aFaire && !bloquantes.length) {
      const ligne = ligneDe(parcours, courante.module);
      if (estIntact(ligne) && plan[PLAN.tests] < SEUILS.test.parSeance) {
        etapes.push({type: "test", module: courante.module}, {type: "nouveau"});
      } else {
        if (!ligne.a[courante.niveau - 1]) etapes.push({type: "apprends", module: courante.module, niveau: courante.niveau});
        etapes.push({type: "entraine", module: courante.module, niveau: courante.niveau});
      }
    }
    return resultat();

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
  function avancerSeance(copie, avant, carte, aujourdhui, changer) {
    const plan = planDe(avant, carte, aujourdhui);
    const etape = seanceOuverte(avant, aujourdhui) ? avant.seance.etape : 0;
    changer(plan);
    plan[PLAN.ouverte] = 1;
    copie.seance = {jour: aujourdhui, etape: Math.min(SEUILS.seance.etapes, etape + 1), n: copie.seance.n, p: plan};
    if (fileSeance(copie, carte, {aujourdhui}).etapes.length) return false;
    // Finie : elle compte, et le plan se referme. L'arrêt après un
    // entraînement raté reste noté jusqu'à demain.
    copie.seance = {
      jour: aujourdhui,
      etape: 0,
      n: Math.min(SEUILS.compteur, copie.seance.n + 1),
      p: [0, 0, 0, 0, plan[PLAN.nouveaute] === NOUVEAUTE.arretee ? NOUVEAUTE.arretee : 0]
    };
    copie.seances = normaliserSeances([...copie.seances, aujourdhui]);
    return true;
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
  // perles, le glisse-nombres) ou "aucun". Rend :
  //   outil    ce qu'il faut afficher pour le calcul SUIVANT ;
  //   reussi   5 justes de suite sans outil (et, si la page le dit, toutes
  //            les écritures du niveau ont été vues) ;
  //   fini     réussi, ou 20 calculs joués.
  // L'outil s'affiche au début ; il part après 2 justes de suite avec lui ;
  // une erreur le fait revenir ; 2 erreurs de suite le rendent à manipuler.
  function suivreEntrainement(reponses, {toutesFormesVues = true} = {}) {
    const liste = Array.isArray(reponses) ? reponses.filter(Boolean) : [];
    const {avecOutil, sansOutil, erreurs, maximum} = SEUILS.entraine;
    let outil = "image";
    let justesAvecOutil = 0;
    let justesSansOutil = 0;
    let erreursDeSuite = 0;
    liste.forEach(reponse => {
      if (reponse.juste) {
        erreursDeSuite = 0;
        if (reponse.outil === "aucun") justesSansOutil += 1;
        else { justesAvecOutil += 1; justesSansOutil = 0; }
        // Après les perles, la droite ; après 2 justes avec l'outil, plus rien.
        if (outil === "manip") outil = "image";
        if (outil !== "aucun" && justesAvecOutil >= avecOutil) { outil = "aucun"; justesAvecOutil = 0; }
      } else {
        erreursDeSuite += 1;
        justesAvecOutil = 0;
        justesSansOutil = 0;
        outil = erreursDeSuite >= erreurs ? "manip" : "image";
      }
    });
    const reussi = justesSansOutil >= sansOutil && toutesFormesVues;
    return {outil, reussi, fini: reussi || liste.length >= maximum, justes: liste.filter(r => r.juste).length, total: liste.length, justesDeSuite: justesSansOutil};
  }

  // Le verdict d'un entraînement fini : `reponses` = les premières réponses
  // {juste, outil}. Réussi à 5 justes de suite sans outil.
  function verdictEntrainement(reponses) {
    const suivi = suivreEntrainement(reponses);
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
    const verdict = verdictEntrainement(Array.isArray(serie.reponses) ? serie.reponses : []);
    ligne.f[n - 1] = Math.min(SEUILS.compteur, ligne.f[n - 1] + 1);
    ajouterCauses(ligne, serie.causes);
    noterJour(copie, aujourdhui);
    if (serie.genre === "rattrape") {
      if (ligne.b[n - 1]) ligne.t[n - 1] = 1;
      if (seance) finie = avancerSeance(copie, avant, carte, aujourdhui, plan => { plan[PLAN.rattrapage] = 0; });
      return {parcours: copie, verdict, evenements, finie};
    }
    const nouvelle = !ligne.b[n - 1];
    if (verdict.reussi && nouvelle) {
      ligne.b[n - 1] = SEUILS.revision.entraine;
      ligne.e[n - 1] = echeanceDeBoite(SEUILS.revision.entraine, aujourdhui);
      evenements.push({type: "entree", module: id, niveau: n, boite: SEUILS.revision.entraine});
    }
    if (seance) {
      // Raté : demain repart de « J'apprends », rien de nouveau aujourd'hui.
      if (!verdict.reussi) ligne.a[n - 1] = 0;
      finie = avancerSeance(copie, avant, carte, aujourdhui, plan => {
        plan[PLAN.nouveaute] = verdict.reussi ? NOUVEAUTE.faite : NOUVEAUTE.arretee;
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
      }
      return {niveau: index + 1, justes, total, connu, entre, boite: connu ? boite : 0, jouee: total > 0};
    });
    if (!ligne.ok && toutSu(ligne)) ligne.ok = aujourdhui;
    const tout = marche === NIVEAUX[id];
    let finie = false;
    if (seance) finie = avancerSeance(copie, avant, carte, aujourdhui, plan => { plan[PLAN.tests] = Math.min(SEUILS.test.parSeance, plan[PLAN.tests] + 1); });
    return {parcours: copie, bilan, tout, marche, finie};
  }

  // -------------------------------------------------------- Mes calculs du jour

  // UNE réponse de Mes calculs du jour — le seul moment qui compte. `retour` :
  //   {module, niveau, juste, ms, type: "F" | "P", cause}
  //  - juste et due : la boîte monte (5 au plus), nouvelle échéance ;
  //    pour un niveau de faits, juste mais au-delà de 5 s : la boîte reste,
  //    l'échéance passe à demain ;
  //  - juste et pas due : rien ;
  //  - fausse ou passée : la boîte descend (1 au moins), échéance demain, un
  //    échec consécutif de plus ; au deuxième échec de suite, « J'apprends »
  //    est à refaire.
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
    const due = ligne.e[index] <= aujourdhui;
    if (retour.juste) {
      const lent = retour.type === "F" && Number(retour.ms) > SEUILS.jour.lentMs;
      if (due && lent) ligne.e[index] = ajouterJours(aujourdhui, 1);
      else if (due) {
        ligne.b[index] = Math.min(SEUILS.revision.boites, boite + 1);
        ligne.e[index] = echeanceDeBoite(ligne.b[index], aujourdhui);
      }
      ligne.x[index] = 0;
    } else {
      ligne.b[index] = Math.max(1, boite - 1);
      ligne.e[index] = ajouterJours(aujourdhui, 1);
      ligne.x[index] = Math.min(SEUILS.rattrapage.echecs, ligne.x[index] + 1);
      if (ligne.x[index] >= SEUILS.rattrapage.echecs) ligne.a[index] = 0;
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
  function ouvrirSeance(parcours, carte, {aujourdhui = jourLocal()} = {}) {
    const copie = normaliserParcours(parcours);
    if (seanceOuverte(copie, aujourdhui)) return copie;
    const plan = planNeuf(copie, carte, aujourdhui);
    plan[PLAN.ouverte] = 1;
    copie.seance = {jour: aujourdhui, etape: 0, n: copie.seance.n, p: plan};
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
    // le jour le plus récent, puis l'étape la plus avancée ; à égalité
    // complète, le texte le plus petit.
    const rang = cote => [cote.seance.n, cote.seance.jour || "", cote.seance.etape, JSON.stringify(cote.seance.p)];
    const [ra, rb] = [rang(a), rang(b)];
    const aDevant = ra[0] !== rb[0] ? ra[0] > rb[0] : ra[1] !== rb[1] ? ra[1] > rb[1] : ra[2] !== rb[2] ? ra[2] > rb[2] : ra[3] <= rb[3];
    fusion.seance = cloner(aDevant ? a.seance : b.seance);
    // Les séances finies : par date, le plus grand des deux comptes.
    const compte = liste => liste.reduce((m, jour) => m.set(jour, (m.get(jour) || 0) + 1), new Map());
    const [ca, cb] = [compte(a.seances), compte(b.seances)];
    const seances = [];
    [...new Set([...ca.keys(), ...cb.keys()])].forEach(jour => {
      for (let i = 0; i < Math.max(ca.get(jour) || 0, cb.get(jour) || 0); i += 1) seances.push(jour);
    });
    fusion.seances = normaliserSeances(seances);
    fusion.jours = normaliserJours([...a.jours, ...b.jours]);
    return normaliserParcours(fusion);
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
    fusionner
  });
});
