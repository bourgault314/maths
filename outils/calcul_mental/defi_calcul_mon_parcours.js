// Défi calcul — la progression de l'élève (lot 1a, 03/10/2026).
//
// Ce fichier ne connaît AUCUN texte ni aucun générateur : seulement les
// codes des modules et leur nombre de niveaux. Il tient le format enregistré
// (version 1), la validation d'un niveau, le mélange du jour (boîtes au
// niveau du MODULE), la file de la séance, la fusion entre deux appareils et
// le rangement par code sur l'appareil.
//
// Copié de defi_tables_mon_parcours.js puis adapté, jamais partagé : Défi
// tables reste intact. Le rangement par code (empreinte SHA-256 salée, purge
// des 90 jours, état de synchronisation) est repris à l'identique, sous les
// clés « mathsgo-defi-calcul-… ».
//
// Tout ce qui est enregistré tient dans des clés courtes : le serveur compte
// les clés à toute profondeur (2 000 au plus) et borne la progression à
// 40 000 octets. Aucun prénom sous un code, aucun texte libre, aucun calcul
// en clair.
(function initDefiCalculMonParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_CALCUL_MON_PARCOURS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const VERSION = 1;
  const CLE_STOCKAGE = "mathsgo-defi-calcul-parcours";
  const PRENOM_MAX = 20;
  // Le code de suivi et l'identité vivent dans l'ONGLET, sous les mêmes clés
  // que Défi tables : c'est le même élève, entré par le même espace.
  const CLE_CODE = "mathsgo-suivi-code";
  const ALPHABET_CODE = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const LONGUEUR_CODE = 6;

  // Les 71 codes et leur nombre de niveaux, dans l'ordre conseillé (les 42
  // modules construits ou à construire, puis les 29 réservés). Un test
  // compare cette table aux fiches de defi_calcul_core.js.
  const NIVEAUX = Object.freeze({
    A1: 3, A2: 4, M1: 3, A3: 2, M2: 2, A4: 3, M4: 3, A5: 4, A6: 4, M3: 3,
    M6: 4, A7: 4, M7: 5, A8: 3, M5: 2, C1: 3, C4: 2, M8: 3, A9: 3, M10: 3, C3: 3, M11: 2, M12: 3, M9: 3,
    D1: 3, D2: 4, D3: 3, F2: 3, D4: 3, F3: 4, D5: 3, D6: 4, F1: 3, D7: 3, D8: 4, F4: 3, D9: 2,
    F5: 3, F6: 3, F8: 3, F9: 2, F11: 3,
    D10: 3, D11: 3, D12: 2, D13: 3, D14: 3, D15: 3, F7: 3, F10: 3, F12: 2, F13: 3,
    P1: 3, P2: 3, P3: 4, P4: 3, R1: 2, R2: 3, R3: 3, R4: 3, R5: 4, R6: 2,
    X1: 3, X2: 3, X3: 2, X4: 3, X5: 4, X6: 3, X7: 3, C2: 4, C5: 3
  });
  const CODES = Object.freeze(Object.keys(NIVEAUX));

  const SEUILS = Object.freeze({
    // Un entraînement : 10 calculs, réussi à 8 justes (première réponse).
    entraine: Object.freeze({total: 10, justes: 8}),
    // Un niveau de faits : 12 calculs, 10 justes, 4 s par calcul en moyenne.
    faits: Object.freeze({total: 12, justes: 10, moyenneMs: 4000}),
    // Un niveau de procédure : 10 calculs, 8 justes ; un calcul juste
    // au-delà de 30 s est « juste, mais trop long » et ne compte pas.
    procedures: Object.freeze({total: 10, justes: 8, plafondMs: 30000}),
    // Les boîtes de Défi tables : 0, 1, 3, 7, 14 jours.
    revision: Object.freeze({boites: 5, delais: Object.freeze([0, 1, 3, 7, 14])}),
    // Le mélange : 10 calculs, les modules à tour de rôle (donc au plus 3
    // d'un module quand plus de 3 sont dus) ; « à revoir » dès 2 erreurs,
    // 5 calculs de reprise, 4 justes.
    melange: Object.freeze({total: 10, erreursRevoir: 2, reprise: 5, repriseJustes: 4}),
    seance: Object.freeze({etapesMax: 4, garder: 60, objectifSemaine: 4}),
    jours: Object.freeze({garder: 14}),
    compteur: 9999,
    causes: 12
  });

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

  // Le jour où un module revient quand il vient d'entrer dans une boîte.
  function echeanceDeBoite(boite, jour) {
    const rang = entier(boite, 1, SEUILS.revision.boites, 1);
    return ajouterJours(jour, SEUILS.revision.delais[rang - 1]);
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

  function moduleVide(id) {
    const k = NIVEAUX[id];
    return {vu: null, ok: null, nv: 1, v: listeDe(k), a: listeDe(k), t: listeDe(k), f: listeDe(k), err: 0, r: false, c: {}};
  }

  function creerParcours() {
    return {
      version: VERSION,
      epoque: 0,
      prenom: "",
      mod: "",
      modules: {},
      seance: {jour: null, etape: 0, n: 0},
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
    ligne.nv = entier(brut.nv, 1, k, 1);
    ligne.v = normaliserListe(brut.v, k, 1);
    ligne.a = normaliserListe(brut.a, k, 1);
    ligne.t = normaliserListe(brut.t, k, SEUILS.compteur);
    ligne.f = normaliserListe(brut.f, k, SEUILS.compteur);
    ligne.err = entier(brut.err, 0, 99);
    ligne.r = brut.r === true;
    if (brut.c && typeof brut.c === "object" && !Array.isArray(brut.c)) {
      Object.keys(brut.c).filter(cause => /^\d{1,2}$/.test(cause)).sort((x, y) => Number(x) - Number(y))
        .slice(0, SEUILS.causes).forEach(cause => {
          const compte = entier(brut.c[cause], 1, SEUILS.compteur);
          if (compte) ligne.c[String(Number(cause))] = compte;
        });
    }
    // La boîte et l'échéance n'existent que si un niveau est validé.
    if (ligne.v.some(Boolean)) {
      ligne.b = entier(brut.b, 1, SEUILS.revision.boites, 1);
      ligne.e = dateOuNull(brut.e) || ligne.vu || jourLocal();
    } else {
      ligne.ok = null;
      ligne.err = 0;
      ligne.r = false;
    }
    // Le module est « validé » le jour où tous ses niveaux le sont.
    if (!ligne.v.every(Boolean)) ligne.ok = null;
    return ligne;
  }

  function normaliserParcours(brut) {
    const parcours = creerParcours();
    if (!brut || typeof brut !== "object") return parcours;
    parcours.epoque = entier(brut.epoque, 0, 1000000);
    parcours.prenom = nettoyerPrenom(brut.prenom);
    parcours.mod = typeof brut.mod === "string" && Object.prototype.hasOwnProperty.call(NIVEAUX, brut.mod) ? brut.mod : "";
    if (brut.modules && typeof brut.modules === "object" && !Array.isArray(brut.modules)) {
      CODES.forEach(id => {
        if (Object.prototype.hasOwnProperty.call(brut.modules, id)) parcours.modules[id] = normaliserModule(id, brut.modules[id]);
      });
    }
    const seance = brut.seance && typeof brut.seance === "object" ? brut.seance : {};
    parcours.seance = {
      jour: dateOuNull(seance.jour),
      etape: entier(seance.etape, 0, SEUILS.seance.etapesMax),
      n: entier(seance.n, 0, SEUILS.compteur)
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

  // ------------------------------------------------- les modules : ouverts, en cours

  // `carte` : la liste rendue par CORE.carte() — l'ordre conseillé, les
  // « avant », ce qui est construit, les pilotes ouverts pendant l'essai.
  function ficheCarte(carte, id) {
    return (carte || []).find(fiche => fiche.id === id) || null;
  }

  function estValide(parcours, id) {
    return Boolean(parcours.modules[id] && parcours.modules[id].ok);
  }

  // Un module s'ouvre quand tous ses « avant » sont validés — ou quand le
  // professeur le met en avant, ou pendant l'essai pour les pilotes.
  function estOuvert(parcours, id, carte, {enAvant = null} = {}) {
    const fiche = ficheCarte(carte, id);
    if (!fiche || !fiche.construit) return false;
    if (fiche.pilote || enAvant === id) return true;
    return fiche.avant.every(avant => estValide(parcours, avant));
  }

  // Les cinq états du parcours, plus « bientôt » pour un module pas encore
  // construit : validé, à revoir, en cours, pas commencé, pas encore ouvert.
  function etatModule(parcours, id, carte, {enAvant = null} = {}) {
    const fiche = ficheCarte(carte, id);
    const ligne = ligneDe(parcours, id);
    const base = {id, niveau: ligne.nv, niveaux: NIVEAUX[id], apres: []};
    if (!fiche || !fiche.construit) return Object.assign(base, {etat: "bientot"});
    if (ligne.ok) return Object.assign(base, {etat: ligne.r ? "revoir" : "valide"});
    if (!estOuvert(parcours, id, carte, {enAvant})) {
      return Object.assign(base, {etat: "ferme", apres: fiche.avant.filter(avant => !estValide(parcours, avant))});
    }
    const commence = parcours.mod === id || ligne.v.some(Boolean) || ligne.f.some(Boolean) || ligne.a.some(Boolean);
    return Object.assign(base, {etat: commence ? "encours" : "libre"});
  }

  // Le module à faire : le premier de l'ordre conseillé qui n'est pas validé
  // et qui est ouvert. null quand tout ce qui est ouvert est validé.
  function moduleSuivant(parcours, carte, {enAvant = null} = {}) {
    const fiche = (carte || []).find(f => f.construit && !estValide(parcours, f.id) && estOuvert(parcours, f.id, carte, {enAvant}));
    return fiche ? fiche.id : null;
  }

  // « Mon module » : celui que l'élève a choisi, sinon le suivant.
  function moduleCourant(parcours, carte, options = {}) {
    if (parcours.mod && estOuvert(parcours, parcours.mod, carte, options) && !estValide(parcours, parcours.mod)) return parcours.mod;
    return moduleSuivant(parcours, carte, options) || parcours.mod || null;
  }

  function compter(parcours, carte) {
    const paliers = new Map();
    (carte || []).filter(fiche => fiche.palier > 0).forEach(fiche => {
      const compte = paliers.get(fiche.palier) || {palier: fiche.palier, valides: 0, total: 0};
      compte.total += 1;
      if (estValide(parcours, fiche.id)) compte.valides += 1;
      paliers.set(fiche.palier, compte);
    });
    const liste = [...paliers.values()].sort((x, y) => x.palier - y.palier);
    return {
      paliers: liste,
      valides: liste.reduce((s, p) => s + p.valides, 0),
      total: liste.reduce((s, p) => s + p.total, 0)
    };
  }

  function choisirModule(parcours, id, aujourdhui = jourLocal()) {
    const copie = normaliserParcours(parcours);
    if (!Object.prototype.hasOwnProperty.call(NIVEAUX, id)) return copie;
    copie.mod = id;
    copie.modules[id] = ligneDe(copie, id);
    copie.modules[id].vu = aujourdhui;
    return copie;
  }

  // Les niveaux sont libres dans un module ouvert : toucher une case en fait
  // le niveau que la séance propose.
  function choisirNiveau(parcours, id, niveau, aujourdhui = jourLocal()) {
    const copie = choisirModule(parcours, id, aujourdhui);
    if (copie.modules[id]) copie.modules[id].nv = entier(niveau, 1, NIVEAUX[id], copie.modules[id].nv);
    return copie;
  }

  // ---------------------------------------------------------- valider, s'entraîner

  // Le verdict d'un entraînement : `reponses` = les premières réponses,
  // {juste}. Réussi à 8 justes sur 10.
  function verdictEntrainement(reponses) {
    const justes = reponses.filter(r => r && r.juste).length;
    return {justes, total: reponses.length, reussi: justes >= SEUILS.entraine.justes};
  }

  // Le verdict d'une validation. `reponses` = {juste, ms} dans l'ordre ; un
  // calcul passé est faux, avec son temps.
  //  - fait (F) : 10 justes sur 12 ET 4 s par calcul en moyenne, sinon
  //    « trop lentement » ;
  //  - procédure (P) : 8 justes sur 10 ; un calcul juste au-delà de 30 s est
  //    « juste, mais trop long » et ne compte pas dans les 8.
  function verdictValidation(type, reponses) {
    const total = reponses.length;
    const exactes = reponses.filter(r => r && r.juste).length;
    const moyenneMs = total ? reponses.reduce((s, r) => s + Math.max(0, Number(r && r.ms) || 0), 0) / total : 0;
    if (type === "F") {
      const assez = exactes >= SEUILS.faits.justes;
      const tropLent = assez && moyenneMs > SEUILS.faits.moyenneMs;
      return {type, total, justes: exactes, lents: [], tropLent, moyenneMs, valide: assez && !tropLent};
    }
    const lents = [];
    reponses.forEach((r, index) => { if (r && r.juste && r.ms > SEUILS.procedures.plafondMs) lents.push(index); });
    const justes = exactes - lents.length;
    return {type, total, justes, lents, tropLent: false, moyenneMs, valide: justes >= SEUILS.procedures.justes};
  }

  function ajouterCauses(ligne, causes) {
    Object.keys(causes || {}).forEach(cause => {
      if (!/^\d{1,2}$/.test(cause)) return;
      const cle = String(Number(cause));
      const ajout = entier(causes[cause], 0, SEUILS.compteur);
      if (ajout) ligne.c[cle] = Math.min(SEUILS.compteur, (ligne.c[cle] || 0) + ajout);
    });
  }

  // Une série finie, hors mélange. `serie` :
  //   {module, niveau, genre: "apprends" | "entraine" | "valide", type: "F" | "P",
  //    reponses: [{juste, ms}], causes: {cause: nombre}}
  // Rend le parcours, le verdict et les événements (« niveau » validé,
  // « module » validé avec le module suivant).
  // Le niveau à faire : celui qu'on donne s'il n'est pas validé, sinon le
  // premier qui ne l'est pas (le même quand tous le sont).
  function niveauAFaire(valides, niveau) {
    if (!valides[niveau - 1]) return niveau;
    const premier = valides.findIndex(valide => !valide);
    return premier >= 0 ? premier + 1 : niveau;
  }

  function appliquerSerie(parcours, serie, {aujourdhui = jourLocal(), carte = null, enAvant = null} = {}) {
    const copie = normaliserParcours(parcours);
    const id = serie && serie.module;
    const evenements = [];
    if (!Object.prototype.hasOwnProperty.call(NIVEAUX, id)) return {parcours: copie, verdict: null, evenements};
    const k = NIVEAUX[id];
    const n = entier(serie.niveau, 1, k, 1);
    const ligne = ligneDe(copie, id);
    copie.modules[id] = ligne;
    ligne.vu = aujourdhui;
    if (serie.genre === "apprends") {
      ligne.a[n - 1] = 1;
      return {parcours: copie, verdict: null, evenements};
    }
    const reponses = Array.isArray(serie.reponses) ? serie.reponses : [];
    ligne.f[n - 1] = Math.min(SEUILS.compteur, ligne.f[n - 1] + 1);
    ajouterCauses(ligne, serie.causes);
    noterJour(copie, aujourdhui);
    if (serie.genre !== "valide") return {parcours: copie, verdict: verdictEntrainement(reponses), evenements};
    const verdict = verdictValidation(serie.type === "F" ? "F" : "P", reponses);
    if (!verdict.valide) return {parcours: copie, verdict, evenements};
    const premier = !ligne.v.some(Boolean);
    ligne.v[n - 1] = 1;
    ligne.t[n - 1] = Math.max(1, Math.min(SEUILS.compteur, Math.round(verdict.moyenneMs / 100)));
    // Le niveau à faire : le premier qui n'est pas encore validé.
    ligne.nv = niveauAFaire(ligne.v, n);
    evenements.push({type: "niveau", module: id, niveau: n});
    // Le module entre dans le mélange dès son premier niveau validé :
    // boîte 1, il revient demain.
    if (premier) {
      ligne.b = 1;
      ligne.e = ajouterJours(aujourdhui, 1);
    }
    // Le module est validé quand tous ses niveaux le sont (décision du
    // 03/10/2026) : réussir le dernier seul ne suffit pas.
    if (ligne.v.every(Boolean) && !ligne.ok) {
      ligne.ok = aujourdhui;
      const etaitMonModule = !copie.mod || copie.mod === id;
      const suivant = moduleSuivant(copie, carte, {enAvant});
      if (etaitMonModule && suivant) copie.mod = suivant;
      evenements.push({type: "module", module: id, suivant});
    }
    return {parcours: copie, verdict, evenements};
  }

  // ------------------------------------------------------------------ le mélange

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

  function moduleDu(ligne, aujourdhui = jourLocal()) {
    return Boolean(ligne && ligne.e && ligne.e <= aujourdhui);
  }

  function trierParEcheance(entrees) {
    return entrees.slice().sort((premier, second) =>
      String(premier[1].e || "").localeCompare(String(second[1].e || ""))
      || String(premier[1].vu || "").localeCompare(String(second[1].vu || ""))
      || CODES.indexOf(premier[0]) - CODES.indexOf(second[0]));
  }

  // Entrelace des entrées [code, ligne] boîte par boîte, chaque boîte triée
  // par échéance (le plus en retard, ou le plus proche, d'abord).
  function tourDeRole(entrees) {
    const files = Array.from({length: SEUILS.revision.boites}, (_, index) =>
      trierParEcheance(entrees.filter(([, ligne]) => ligne.b === index + 1)).map(([code]) => code));
    const ordre = [];
    while (files.some(file => file.length)) {
      files.forEach(file => { if (file.length) ordre.push(file.shift()); });
    }
    return ordre;
  }

  // Les modules qui peuvent revenir : au moins un niveau validé. Un module
  // mis en avant par le professeur n'y est pas, sauf s'il est déjà validé.
  function modulesDuMelange(parcours, {enAvant = null} = {}) {
    return Object.entries(parcours.modules).filter(([id, ligne]) =>
      ligne.v.some(Boolean) && (id !== enAvant || Boolean(ligne.ok)));
  }

  // `nombre` tirages parmi des modules, à tour de rôle : avec plus de 3
  // modules, aucun n'a plus de 3 calculs sur 10.
  function distribuer(codes, nombre) {
    const tirages = [];
    while (codes.length && tirages.length < nombre) {
      for (const code of codes) {
        if (tirages.length >= nombre) break;
        tirages.push(code);
      }
    }
    return tirages;
  }

  // Le mélange du jour : 10 tirages {module, niveau, du, reprise}.
  //  - d'abord, s'il y a un module « à revoir » : 5 calculs de ce module
  //    (le plus ancien si plusieurs), puis 5 du mélange ordinaire ;
  //  - les modules dus, à tour de rôle par boîte : au plus 3 calculs d'un
  //    même module quand plus de 3 modules sont dus ;
  //  - rien n'est dû : les modules non dus, par échéance la plus proche
  //    (entretien) ;
  //  - le niveau est tiré au hasard parmi les niveaux validés du module.
  // La page demande ensuite le calcul au générateur du niveau.
  function tirerMelange(parcours, {aujourdhui = jourLocal(), graine = 1, enAvant = null, total = SEUILS.melange.total} = {}) {
    const candidats = modulesDuMelange(parcours, {enAvant});
    if (!candidats.length) return [];
    const rng = mulberry32(graine);
    const aRevoir = trierParEcheance(candidats.filter(([, ligne]) => ligne.r));
    const reprise = aRevoir.length ? aRevoir[0][0] : null;
    const nombreReprise = reprise ? Math.min(SEUILS.melange.reprise, total) : 0;
    const dus = tourDeRole(candidats.filter(([, ligne]) => moduleDu(ligne, aujourdhui)));
    const nonDus = trierParEcheance(candidats.filter(([, ligne]) => !moduleDu(ligne, aujourdhui))).map(([code]) => code);
    const reste = total - nombreReprise;
    // Les modules dus d'abord ; rien n'est dû : l'entretien, par échéance.
    const ordinaires = distribuer(dus.length ? dus : nonDus, reste);
    const codes = [...listeDe(nombreReprise, reprise), ...ordinaires];
    return codes.map((code, index) => {
      const ligne = parcours.modules[code];
      const valides = ligne.v.map((v, i) => (v ? i + 1 : 0)).filter(Boolean);
      return {
        module: code,
        niveau: valides[Math.floor(rng() * valides.length)],
        du: moduleDu(ligne, aujourdhui),
        reprise: index < nombreReprise
      };
    });
  }

  // ------------------------------------------------------------ la séance du jour

  // La file des étapes du jour (4 au plus) :
  //  1. le module mis en avant par le professeur, s'il n'est pas validé :
  //     « J'apprends » si ce niveau n'a jamais été appris, sinon
  //     « Je m'entraîne » ;
  //  2. « Mes calculs du jour », s'il existe un module avec un niveau validé ;
  //  3. Mon module : « J'apprends » (si pas fait) puis « Je m'entraîne »,
  //     puis « Je valide » — jouée seulement si l'entraînement du jour est
  //     réussi (voir suiteDeFile).
  // La validation attend le lendemain si elle tombe au-delà de 4 étapes.
  function fileSeance(parcours, carte, {enAvant = null} = {}) {
    const file = [];
    const avant = enAvant && ficheCarte(carte, enAvant) && ficheCarte(carte, enAvant).construit && !estValide(parcours, enAvant) ? enAvant : null;
    if (avant) {
      const ligne = ligneDe(parcours, avant);
      file.push({type: ligne.a[ligne.nv - 1] ? "entraine" : "apprends", module: avant, niveau: ligne.nv, enAvant: true});
    }
    if (modulesDuMelange(parcours, {enAvant: avant}).length) file.push({type: "melange", calculs: SEUILS.melange.total});
    const mod = moduleCourant(parcours, carte, {enAvant: avant});
    if (mod && mod !== avant && !estValide(parcours, mod)) {
      const ligne = ligneDe(parcours, mod);
      if (!ligne.a[ligne.nv - 1]) file.push({type: "apprends", module: mod, niveau: ligne.nv});
      file.push({type: "entraine", module: mod, niveau: ligne.nv});
      file.push({type: "valide", module: mod, niveau: ligne.nv, conditionnelle: true});
    }
    return file.slice(0, SEUILS.seance.etapesMax);
  }

  // Après l'entraînement de Mon module : raté, la validation qui suivait
  // devient « Je m'entraîne encore » (sans validation ce jour-là).
  function suiteDeFile(file, index, {reussi = false} = {}) {
    const etape = file[index];
    if (!etape || etape.type !== "entraine" || etape.enAvant || reussi) return file.slice();
    return file.map((suivante, rang) => (rang > index && suivante.type === "valide" && suivante.module === etape.module
      ? {type: "entraine", module: suivante.module, niveau: suivante.niveau, encore: true}
      : suivante));
  }

  // « Cette semaine » : les jours avec une séance finie depuis lundi.
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
  // choix qui ne dépend pas de l'ordre des arguments (la boîte la plus
  // basse, puis le texte le plus petit).
  function coteLePlusRecent(a, b) {
    const va = a.vu || "";
    const vb = b.vu || "";
    if (va !== vb) return va > vb ? a : b;
    const ba = a.b || 0;
    const bb = b.b || 0;
    if (ba !== bb) return ba < bb ? a : b;
    return JSON.stringify(a) <= JSON.stringify(b) ? a : b;
  }

  function fusionnerModule(id, a, b) {
    if (!a) return cloner(b);
    if (!b) return cloner(a);
    const k = NIVEAUX[id];
    const ligne = moduleVide(id);
    ligne.vu = dateLaPlusRecente(a.vu, b.vu);
    ligne.ok = dateLaPlusAncienne(a.ok, b.ok);
    for (let i = 0; i < k; i += 1) {
      ligne.v[i] = Math.max(a.v[i], b.v[i]);
      ligne.a[i] = Math.max(a.a[i], b.a[i]);
      ligne.f[i] = Math.max(a.f[i], b.f[i]);
      // Le temps : celui du côté qui a le plus joué ce niveau.
      ligne.t[i] = a.f[i] === b.f[i] ? Math.max(a.t[i], b.t[i]) : a.f[i] > b.f[i] ? a.t[i] : b.t[i];
    }
    ligne.nv = niveauAFaire(ligne.v, Math.max(a.nv, b.nv));
    // Deux appareils qui ont validé chacun une partie des niveaux : le
    // module est validé le jour du dernier travail.
    if (!ligne.ok && ligne.v.every(Boolean)) ligne.ok = ligne.vu;
    [...new Set([...Object.keys(a.c), ...Object.keys(b.c)])].sort((x, y) => Number(x) - Number(y)).forEach(cause => {
      ligne.c[cause] = Math.max(a.c[cause] || 0, b.c[cause] || 0);
    });
    // La boîte, l'échéance, les erreurs du mélange et « à revoir » : en bloc,
    // du côté qui a vu le module le plus récemment.
    const recent = coteLePlusRecent(a, b);
    ligne.err = recent.err;
    ligne.r = recent.r;
    if (ligne.v.some(Boolean)) {
      const source = recent.b ? recent : (a.b ? a : b);
      ligne.b = source.b || 1;
      ligne.e = source.e || ligne.vu || jourLocal();
    }
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
    // « Mon module » : celui du côté qui l'a vu le plus récemment.
    const vuDe = cote => (cote.mod && cote.modules[cote.mod] && cote.modules[cote.mod].vu) || "";
    if (!a.mod || !b.mod) fusion.mod = a.mod || b.mod;
    else if (vuDe(a) !== vuDe(b)) fusion.mod = vuDe(a) > vuDe(b) ? a.mod : b.mod;
    else fusion.mod = CODES.indexOf(a.mod) <= CODES.indexOf(b.mod) ? a.mod : b.mod;
    // La séance : celle qui a le plus de séances finies.
    const rangSeance = s => [s.n, s.jour || "", s.etape];
    const [ra, rb] = [rangSeance(a.seance), rangSeance(b.seance)];
    const aDevant = ra[0] !== rb[0] ? ra[0] > rb[0] : ra[1] !== rb[1] ? ra[1] > rb[1] : ra[2] >= rb[2];
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
    echeanceDeBoite,
    estValide,
    estOuvert,
    etatModule,
    moduleSuivant,
    moduleCourant,
    compter,
    choisirModule,
    choisirNiveau,
    verdictEntrainement,
    verdictValidation,
    appliquerSerie,
    moduleDu,
    trierParEcheance,
    tourDeRole,
    tirerMelange,
    fileSeance,
    suiteDeFile,
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
