(function initDefiTablesMonParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_TABLES_MON_PARCOURS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // Moteur de « Mon parcours » (logique pure, sans DOM) pour Défi tables.
  // Règles décidées le 29/08/2026 :
  //  - par table (2 à 10) : J'apprends (4 activités), Je m'entraîne (3 entraînements
  //    différents), Acquise (validation 20 questions, 1 min 30, 2 erreurs max) ;
  //  - Mélange des tables acquises (dès 2 tables) : un ✓ « à jour » qui repasse
  //    « à refaire » à chaque nouvelle table acquise ;
  //  - Expert : grand mélange des tables 2 à 10, ★ produits, ★★ + trous,
  //    ★★★ + divisions ; ★ valide toutes les tables d'un coup.
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

  const VERSION = 1;
  const CLE_STOCKAGE = "mathsgo-defi-tables-parcours";
  const TABLES = Object.freeze(Array.from({length: 9}, (_, index) => index + 2));
  const ORDRE_CONSEIL = Object.freeze([2, 10, 5, 3, 4, 6, 7, 8, 9]);
  const ACTIVITES_APPRENDS = Object.freeze(["construct", "gaps", "ordered", "random"]);
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
    validation: Object.freeze({total: 20, dureeMax: 90, erreursMax: 2}),
    melange: Object.freeze({total: 25, dureeMax: 120, erreursMax: 2}),
    expert: Object.freeze({total: 25, dureeMax: 120, erreursMax: 2}),
    revision: Object.freeze({total: 10, casesMax: 3, conseil: 5, aRevoirMin: 2})
  });

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
    construct: "je construis le bâton",
    gaps: "je complète un bâton à trous",
    ordered: "je réponds dans l’ordre",
    random: "je réponds dans le désordre"
  });

  function cloner(valeur) {
    return JSON.parse(JSON.stringify(valeur));
  }

  function tableVide() {
    return {
      apprends: {construct: 0, gaps: 0, ordered: 0, random: 0},
      entraine: {desordre: 0, trous: 0, mixte: 0, dernier: null},
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
      expert: {niveau: 0, dernier: null, champion: null},
      calculs: {}
    };
  }

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

  function normaliserParcours(brut) {
    const parcours = creerParcours();
    if (!brut || typeof brut !== "object") return parcours;
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
      cible.acquise = dateOuNull(source.acquise);
    });
    if (brut.melange && typeof brut.melange === "object") {
      parcours.melange.aJour = Boolean(brut.melange.aJour);
      parcours.melange.aRefaireAvec = entier(brut.melange.aRefaireAvec, 2, 10, null);
      parcours.melange.dernier = dateOuNull(brut.melange.dernier);
    }
    if (brut.expert && typeof brut.expert === "object") {
      parcours.expert.niveau = entier(brut.expert.niveau, 0, 3);
      parcours.expert.dernier = dateOuNull(brut.expert.dernier);
      parcours.expert.champion = dateOuNull(brut.expert.champion);
    }
    if (brut.calculs && typeof brut.calculs === "object") {
      FAITS.forEach(cle => {
        const source = brut.calculs[cle];
        if (!source || typeof source !== "object") return;
        const vu = dateOuNull(source.vu);
        if (!vu) return;
        parcours.calculs[cle] = {
          cases: entier(source.cases, 0, SEUILS.revision.casesMax),
          vu,
          erreur: dateOuNull(source.erreur),
          gagne: dateOuNull(source.gagne)
        };
      });
    }
    parcours.melange.tables = tablesAcquises(parcours);
    if (parcours.melange.tables.length < 2) {
      parcours.melange.aJour = false;
      parcours.melange.aRefaireAvec = null;
    }
    return parcours;
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
      if (table === null || Number(config.total) !== SEUILS.validation.total) return null;
      const duree = Number(config.duration);
      if (!duree) return null;
      return duree <= SEUILS.validation.dureeMax
        ? {type: "validation", table}
        : {type: "preparation", table, duree};
    }
    if (config.mode === "test") {
      const duree = Number(config.duration);
      if (Number(config.total) !== SEUILS.expert.total || !duree || duree > SEUILS.expert.dureeMax) return null;
      const tables = (config.tables || []).map(Number);
      if (memesTables(tables, TABLES)) return {type: "expert", niveau: entier(config.testLevel, 1, 3, 1)};
      const acquises = tablesAcquises(parcours);
      if (acquises.length >= 2 && !toutesAcquises(parcours) && memesTables(tables, acquises) && entier(config.testLevel, 1, 3, 1) === 1) {
        return {type: "melange", tables: acquises};
      }
      return null;
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

  function acquerir(copie, table, date, evenements) {
    const ligne = copie.tables[table];
    if (ligne.acquise) return false;
    ligne.acquise = date;
    const acquises = tablesAcquises(copie);
    copie.melange.tables = acquises;
    if (acquises.length >= 2 && !toutesAcquises(copie)) {
      const etaitAJour = copie.melange.aJour;
      copie.melange.aJour = false;
      copie.melange.aRefaireAvec = acquises.length === 2 ? null : table;
      if (acquises.length === 2) evenements.push({type: "melange-debloque", tables: acquises});
      else if (etaitAJour) evenements.push({type: "melange-a-refaire", table, tables: acquises});
    }
    if (toutesAcquises(copie)) {
      copie.melange.aJour = false;
      copie.melange.aRefaireAvec = null;
      evenements.push({type: "toutes-acquises"});
    }
    return true;
  }

  // Applique une série TERMINÉE au parcours. resultat = {correct, total, date}.
  function appliquerSerie(parcours, config, resultat) {
    const evenements = [];
    const classement = classerSerie(parcours, config);
    if (!classement) return {parcours, evenements, classement: null};
    const copie = cloner(parcours);
    const date = resultat && typeof resultat.date === "string" ? resultat.date : new Date().toISOString().slice(0, 10);
    const correct = entier(resultat && resultat.correct, 0, 100);
    const total = entier(resultat && resultat.total, 1, 100, 1);
    const erreurs = total - correct;

    if (classement.type === "apprends") {
      const ligne = copie.tables[classement.table];
      ligne.apprends[classement.activite] = 2;
      const termines = ACTIVITES_APPRENDS.filter(activite => ligne.apprends[activite] === 2).length;
      evenements.push({type: "apprends", table: classement.table, activite: classement.activite, termines});
    } else if (classement.type === "entraine") {
      const ligne = copie.tables[classement.table];
      const reussi = erreurs <= SEUILS.entrainement.erreursMax;
      const dejaReussi = ligne.entraine[classement.entrainement] === 2;
      if (reussi) ligne.entraine[classement.entrainement] = 2;
      else if (ligne.entraine[classement.entrainement] === 0) ligne.entraine[classement.entrainement] = 1;
      ligne.entraine.dernier = {entrainement: classement.entrainement, score: correct, total};
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
        pret: reussites === ENTRAINEMENTS.length
      });
    } else if (classement.type === "validation") {
      const reussi = erreurs <= SEUILS.validation.erreursMax;
      const dejaAcquise = Boolean(copie.tables[classement.table].acquise);
      const evenement = {type: "validation", table: classement.table, reussi, score: correct, total, dejaAcquise, nouvelle: false};
      evenements.push(evenement);
      if (reussi) evenement.nouvelle = acquerir(copie, classement.table, date, evenements);
    } else if (classement.type === "preparation") {
      const reussi = erreurs <= SEUILS.validation.erreursMax;
      evenements.push({type: "preparation", table: classement.table, reussi, score: correct, total, duree: classement.duree});
    } else if (classement.type === "melange") {
      const reussi = erreurs <= SEUILS.melange.erreursMax;
      if (reussi) {
        copie.melange.aJour = true;
        copie.melange.aRefaireAvec = null;
        copie.melange.dernier = date;
      }
      evenements.push({type: "melange", reussi, score: correct, total, tables: classement.tables});
    } else if (classement.type === "expert") {
      const reussi = erreurs <= SEUILS.expert.erreursMax;
      const niveauAvant = copie.expert.niveau;
      const evenement = {type: "expert", niveau: classement.niveau, reussi, score: correct, total, niveauAvant, nouveau: false, champion: false, tablesValidees: []};
      evenements.push(evenement);
      if (reussi) {
        copie.expert.dernier = date;
        if (classement.niveau > copie.expert.niveau) {
          copie.expert.niveau = classement.niveau;
          evenement.nouveau = true;
        }
        // Les acquisitions déclenchées par l'étoile ne racontent pas leurs étapes
        // intermédiaires (mélange débloqué, à refaire, toutes acquises) : c'est
        // l'événement expert lui-même qui dit que les tables sont validées.
        const evenementsAcquisition = [];
        TABLES.forEach(table => {
          if (acquerir(copie, table, date, evenementsAcquisition)) evenement.tablesValidees.push(table);
        });
        if (copie.expert.niveau === 3 && !copie.expert.champion) {
          copie.expert.champion = date;
          evenement.champion = true;
        }
      }
    }
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

  function configMelange(parcours) {
    const acquises = tablesAcquises(parcours);
    if (acquises.length < 2 || toutesAcquises(parcours)) return null;
    return {mode: "test", tables: acquises, testLevel: 1, total: SEUILS.melange.total, duration: SEUILS.melange.dureeMax};
  }

  function configExpert(niveau) {
    return {mode: "test", tables: [...TABLES], testLevel: entier(niveau, 1, 3, 1), total: SEUILS.expert.total, duration: SEUILS.expert.dureeMax};
  }

  /* ---------- Mes calculs (grille des 36 faits) ---------- */

  function dateDuJour(valeur) {
    return typeof valeur === "string" && valeur ? valeur : new Date().toISOString().slice(0, 10);
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

  function etatFait(fait) {
    if (!fait) return "jamais-vu";
    if (fait.cases >= SEUILS.revision.casesMax) return "su";
    if (fait.cases === 0) return "a-travailler";
    return "en-cours";
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
  // Au plus UNE case gagnée par calcul et par jour (idée de Claire) : savoir,
  // c'est retrouver le calcul un autre jour, pas le répéter dans l'heure. Être
  // « su » demande donc trois jours différents. Les erreurs, elles, comptent
  // toujours, sans limite : une réussite juste après la correction prouve peu,
  // une erreur prouve beaucoup.
  function appliquerReponse(parcours, cleBrute, reponse = {}) {
    const cle = cleFait(cleBrute);
    if (!cle) return {parcours, fait: null};
    const copie = cloner(parcours);
    const date = dateDuJour(reponse.date);
    const avant = copie.calculs[cle] || {cases: 0, vu: null, erreur: null, gagne: null};
    const fait = {...avant, vu: date};
    if (reponse.correcte) {
      // Pas de gain le jour d'une erreur sur ce calcul : le raté « revient dans
      // un nouveau défi » (Claire), c'est-à-dire un autre jour — pas dans l'heure
      // qui suit la correction.
      if (avant.gagne !== date && avant.erreur !== date && avant.cases < SEUILS.revision.casesMax) {
        fait.cases = avant.cases + 1;
        fait.gagne = date;
      }
    } else {
      fait.cases = Math.max(0, avant.cases - 1);
      fait.erreur = date;
    }
    copie.calculs[cle] = fait;
    return {parcours: copie, fait: {cle, cases: fait.cases, etat: etatFait(fait)}};
  }

  function resumeCalculs(parcours) {
    const resume = {sus: 0, enCours: 0, aTravailler: 0, jamaisVus: 0, total: FAITS.length};
    FAITS.forEach(cle => {
      const etat = etatFait(parcours.calculs[cle]);
      if (etat === "su") resume.sus += 1;
      else if (etat === "en-cours") resume.enCours += 1;
      else if (etat === "a-travailler") resume.aTravailler += 1;
      else resume.jamaisVus += 1;
    });
    return resume;
  }

  // La grille 8×8 prête à afficher : lignes 2 à 9, colonnes 2 à 9. La moitié
  // haute (ligne ≤ colonne) est active, l'autre est le miroir grisé du même fait.
  function grilleCalculs(parcours) {
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
          cases: fait ? fait.cases : 0,
          etat: etatFait(fait),
          vu: fait ? fait.vu : null,
          erreur: fait ? fait.erreur : null
        };
      })
    }));
    return {lignes, resume: resumeCalculs(parcours)};
  }

  function trierParErreurRecente(entrees) {
    return entrees.slice().sort((premier, second) => String(second[1].erreur || "").localeCompare(String(premier[1].erreur || "")));
  }

  function trierParVuAncien(entrees) {
    return entrees.slice().sort((premier, second) => String(premier[1].vu || "").localeCompare(String(second[1].vu || "")));
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

  // Le plan des 10 questions de révision : priorité 0 case (ratés récemment
  // d'abord), puis 1 case, puis 2, puis les faits jamais vus des tables DÉJÀ
  // ACQUISES (on ne confronte pas l'élève à une table qu'il n'a pas apprise),
  // puis l'entretien des faits sus les plus anciens, et en tout dernier recours
  // les faits jamais vus des autres tables (grille encore vide). Jamais deux
  // fois le même fait, sauf quand la grille d'une table (8 faits) ne suffit pas
  // à remplir la série.
  function planRevision(parcours, {table = null, random = Math.random} = {}) {
    const dansLaTable = cle => table === null || facteursFait(cle).includes(Number(table));
    const enregistres = Object.entries(parcours.calculs).filter(([cle]) => dansLaTable(cle));
    const groupe = cases => enregistres.filter(([, fait]) => fait.cases === cases);
    const acquises = tablesAcquises(parcours);
    const jamaisVus = melanger(FAITS.filter(cle => dansLaTable(cle) && !parcours.calculs[cle]), random);
    const jamaisVusAcquis = jamaisVus.filter(cle => facteursFait(cle).some(facteur => acquises.includes(facteur)));
    const ordre = [
      ...trierParErreurRecente(groupe(0)),
      ...trierParVuAncien(groupe(1)),
      ...trierParVuAncien(groupe(2))
    ].map(([cle]) => cle);
    ordre.push(...jamaisVusAcquis);
    ordre.push(...trierParVuAncien(groupe(SEUILS.revision.casesMax)).map(([cle]) => cle));
    ordre.push(...jamaisVus.filter(cle => !jamaisVusAcquis.includes(cle)));
    const selection = ordre.slice(0, SEUILS.revision.total);
    for (let index = 0; selection.length < SEUILS.revision.total && ordre.length; index += 1) {
      selection.push(ordre[index % ordre.length]);
    }
    const divisionsPermises = parcours.expert.niveau >= 3;
    const categories = melanger(selection.map((_, index) => {
      if (divisionsPermises && index % 3 === 2) return "division";
      return index % 2 ? "missing" : "direct";
    }), random);
    return selection.map((cle, index) => {
      const [premier, second] = melanger(facteursFait(cle), random);
      const categorie = categories[index];
      const type = categorie === "direct"
        ? "direct"
        : categorie === "division"
          ? FORMES_DIVISION[Math.floor(random() * FORMES_DIVISION.length)]
          : FORMES_TROU[Math.floor(random() * FORMES_TROU.length)];
      return {cle, type, first: premier, second};
    });
  }

  function configRevision(table = null) {
    return {mode: "revision", table: TABLES.includes(Number(table)) ? Number(table) : null};
  }

  function etapeTable(parcours, table) {
    const ligne = parcours.tables[table];
    if (ligne.acquise) return null;
    const reussites = ENTRAINEMENTS.filter(entrainement => ligne.entraine[entrainement] === 2).length;
    if (reussites === ENTRAINEMENTS.length) {
      return {type: "validation", table, libelle: `Table de ${table} : valide ta table (20 questions en 1 min 30)`, config: configValidation(table)};
    }
    const commence = ACTIVITES_APPRENDS.some(activite => ligne.apprends[activite] > 0) || ENTRAINEMENTS.some(entrainement => ligne.entraine[entrainement] > 0);
    if (!commence) {
      return {type: "apprends", table, activite: "construct", libelle: `Table de ${table} : construis le bâton`, config: configApprends(table, "construct")};
    }
    const entrainement = ENTRAINEMENTS.find(candidat => ligne.entraine[candidat] !== 2);
    return {
      type: "entraine",
      table,
      entrainement,
      libelle: `Table de ${table} : entraînement « ${LIBELLES_ENTRAINEMENTS[entrainement]} »`,
      config: configEntraine(table, entrainement)
    };
  }

  function prochaineEtape(parcours) {
    const aTravailler = calculsATravailler(parcours);
    if (aTravailler.length >= SEUILS.revision.conseil) {
      return {
        type: "revision",
        libelle: `Révise tes calculs : ${aTravailler.length} calculs à travailler (10 questions, sans chrono)`,
        config: configRevision()
      };
    }
    const acquises = tablesAcquises(parcours);
    if (acquises.length >= 2 && !toutesAcquises(parcours) && !parcours.melange.aJour) {
      const avec = parcours.melange.aRefaireAvec;
      return {
        type: "melange",
        libelle: avec ? `Refais le mélange de tes tables acquises avec la table de ${avec}` : `Mélange tes tables acquises (${acquises.join(", ")})`,
        config: configMelange(parcours)
      };
    }
    for (const table of ORDRE_CONSEIL) {
      const etape = etapeTable(parcours, table);
      if (etape) return etape;
    }
    if (parcours.expert.niveau < 3) {
      const niveau = parcours.expert.niveau + 1;
      const libelles = {1: "Expert ★ : toutes les tables, produits", 2: "Expert ★★ : toutes les tables, produits et trous", 3: "Expert ★★★ : toutes les tables, avec les divisions"};
      return {type: "expert", niveau, libelle: libelles[niveau], config: configExpert(niveau)};
    }
    // Champion, mais les étoiles valident par échantillon (25 questions) : le
    // parcours ne dit « fini » que quand chacun des 36 calculs de la grille est
    // vert — c'est elle, la preuve complète.
    const resume = resumeCalculs(parcours);
    const restants = resume.total - resume.sus;
    if (restants) {
      return {
        type: "revision",
        libelle: `Champion des tables ! Pour une grille parfaite, il reste ${restants} calcul${restants > 1 ? "s" : ""} à passer au vert dans Mes calculs`,
        config: configRevision()
      };
    }
    return {type: "champion", libelle: "Champion des tables, et les 36 calculs sont verts : tout est là !", config: null};
  }

  // Résumé prêt à afficher (sans DOM) : symboles par ligne.
  function etatAffichage(parcours) {
    const acquises = tablesAcquises(parcours);
    const aRevoir = tablesARevoir(parcours);
    const lignes = TABLES.map(table => {
      const ligne = parcours.tables[table];
      return {
        table,
        apprends: ACTIVITES_APPRENDS.map(activite => ({activite, etat: ligne.apprends[activite], libelle: LIBELLES_APPRENDS[activite]})),
        entraine: ENTRAINEMENTS.map(entrainement => ({entrainement, etat: ligne.entraine[entrainement], libelle: LIBELLES_ENTRAINEMENTS[entrainement]})),
        dernierEntrainement: ligne.entraine.dernier,
        acquise: ligne.acquise,
        aRevoir: aRevoir.includes(table)
      };
    });
    const melange = acquises.length >= 2 && !toutesAcquises(parcours)
      ? {visible: true, tables: acquises, aJour: parcours.melange.aJour, aRefaireAvec: parcours.melange.aRefaireAvec}
      : {visible: false, tables: acquises, aJour: false, aRefaireAvec: null};
    return {
      prenom: parcours.prenom,
      lignes,
      acquises,
      melange,
      expert: {niveau: parcours.expert.niveau, etoiles: [1, 2, 3].map(niveau => niveau <= parcours.expert.niveau), champion: parcours.expert.champion},
      calculs: resumeCalculs(parcours),
      prochaine: prochaineEtape(parcours)
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

    fusion.expert.niveau = Math.max(a.expert.niveau, b.expert.niveau);
    fusion.expert.dernier = dateLaPlusRecente(a.expert.dernier, b.expert.dernier);
    fusion.expert.champion = dateLaPlusAncienne(a.expert.champion, b.expert.champion);

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
      fusion.calculs[cle] = {
        cases: Math.max(faitA.cases, faitB.cases),
        vu: faitA.vu,
        // Erreur et gain les plus récents : la fusion ne rouvre jamais le droit
        // de gagner une case le jour même.
        erreur: dateLaPlusRecente(faitA.erreur, faitB.erreur),
        gagne: dateLaPlusRecente(faitA.gagne, faitB.gagne)
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
    return !parcours.prenom && !parcours.expert.niveau && !Object.keys(parcours.calculs).length && TABLES.every(table => {
      const ligne = parcours.tables[table];
      return !ligne.acquise
        && ACTIVITES_APPRENDS.every(activite => ligne.apprends[activite] === 0)
        && ENTRAINEMENTS.every(entrainement => ligne.entraine[entrainement] === 0);
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
    LIBELLES_ENTRAINEMENTS,
    LIBELLES_APPRENDS,
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
    configExpert,
    FAITS,
    cleFait,
    facteursFait,
    libelleFait,
    faitsDeLaTable,
    etatFait,
    serieAlimenteGrille,
    appliquerReponse,
    resumeCalculs,
    grilleCalculs,
    calculsATravailler,
    tablesARevoir,
    planRevision,
    configRevision,
    prochaineEtape,
    etatAffichage,
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
