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

  const VERSION = 1;
  const CLE_STOCKAGE = "mathsgo-defi-tables-parcours";
  const TABLES = Object.freeze(Array.from({length: 9}, (_, index) => index + 2));
  const ORDRE_CONSEIL = Object.freeze([2, 10, 5, 3, 4, 6, 7, 8, 9]);
  const ACTIVITES_APPRENDS = Object.freeze(["construct", "gaps", "ordered", "random"]);
  const ENTRAINEMENTS = Object.freeze(["desordre", "trous", "mixte"]);
  const PRENOM_MAX = 20;

  const SEUILS = Object.freeze({
    entrainement: Object.freeze({total: 10, erreursMax: 1}),
    validation: Object.freeze({total: 20, dureeMax: 90, erreursMax: 2}),
    melange: Object.freeze({total: 25, dureeMax: 120, erreursMax: 2}),
    expert: Object.freeze({total: 25, dureeMax: 120, erreursMax: 2})
  });

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
      prenom: "",
      tables,
      melange: {tables: [], aJour: false, aRefaireAvec: null, dernier: null},
      expert: {niveau: 0, dernier: null, champion: null}
    };
  }

  function entier(valeur, minimum, maximum, defaut = 0) {
    const nombre = Number(valeur);
    if (!Number.isInteger(nombre) || nombre < minimum || nombre > maximum) return defaut;
    return nombre;
  }

  function texteOuNull(valeur) {
    return typeof valeur === "string" && valeur ? valeur : null;
  }

  function normaliserParcours(brut) {
    const parcours = creerParcours();
    if (!brut || typeof brut !== "object") return parcours;
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
      cible.acquise = texteOuNull(source.acquise);
    });
    if (brut.melange && typeof brut.melange === "object") {
      parcours.melange.aJour = Boolean(brut.melange.aJour);
      parcours.melange.aRefaireAvec = entier(brut.melange.aRefaireAvec, 2, 10, null);
      parcours.melange.dernier = texteOuNull(brut.melange.dernier);
    }
    if (brut.expert && typeof brut.expert === "object") {
      parcours.expert.niveau = entier(brut.expert.niveau, 0, 3);
      parcours.expert.dernier = texteOuNull(brut.expert.dernier);
      parcours.expert.champion = texteOuNull(brut.expert.champion);
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
        TABLES.forEach(table => {
          if (acquerir(copie, table, date, evenements)) evenement.tablesValidees.push(table);
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
    return {type: "champion", libelle: "Champion des tables : tout est validé !", config: null};
  }

  // Résumé prêt à afficher (sans DOM) : symboles par ligne.
  function etatAffichage(parcours) {
    const acquises = tablesAcquises(parcours);
    const lignes = TABLES.map(table => {
      const ligne = parcours.tables[table];
      return {
        table,
        apprends: ACTIVITES_APPRENDS.map(activite => ({activite, etat: ligne.apprends[activite], libelle: LIBELLES_APPRENDS[activite]})),
        entraine: ENTRAINEMENTS.map(entrainement => ({entrainement, etat: ligne.entraine[entrainement], libelle: LIBELLES_ENTRAINEMENTS[entrainement]})),
        dernierEntrainement: ligne.entraine.dernier,
        acquise: ligne.acquise
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
      prochaine: prochaineEtape(parcours)
    };
  }

  function charger(stockage) {
    try {
      const brut = stockage && stockage.getItem(CLE_STOCKAGE);
      if (!brut) return creerParcours();
      return normaliserParcours(JSON.parse(brut));
    } catch (_) {
      return creerParcours();
    }
  }

  function sauver(stockage, parcours) {
    try {
      if (!stockage) return false;
      stockage.setItem(CLE_STOCKAGE, JSON.stringify(normaliserParcours(parcours)));
      return true;
    } catch (_) {
      return false;
    }
  }

  function effacer(stockage) {
    try {
      if (stockage) stockage.removeItem(CLE_STOCKAGE);
      return true;
    } catch (_) {
      return false;
    }
  }

  function estVide(parcours) {
    return !parcours.prenom && !parcours.expert.niveau && TABLES.every(table => {
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
    prochaineEtape,
    etatAffichage,
    charger,
    sauver,
    effacer,
    estVide
  });
});
