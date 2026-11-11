(function initMathsGoCoffresParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MathsGoCoffresParcours = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // Le moteur du parcours élève de Coffres magiques (lot « Coffres magiques
  // sur le suivi », 21/10/2026), sur le modèle de celui de SPLAT!
  // (assets/js/splat-parcours.js) : chargé par l'appli solo
  // (outils/calcul_mental/coffres_magiques_solo.html) et copié octet pour
  // octet dans _serveur/public/prof/ pour l'espace élève (la tuile) et « Ma
  // classe ». Il porte trois choses, et rien d'autre :
  //
  //  1. LE FORMAT du parcours (ce que le serveur enregistre, une ligne par
  //     élève) — rien que des nombres, des booléens et des dates :
  //       { version, epoque,
  //         niveaux:    { "1": {tresors, parfaits, gloubi, cran}, "2": …, "3": … }
  //                     — par niveau, les trésors ouverts (dix clés) et, parmi
  //                     eux, les trésors PARFAITS (sans erreur ni solution
  //                     montrée) ; seuls les niveaux commencés y figurent.
  //                     Lot « le chemin des coffres et le cadeau Gloubi »
  //                     (09/11/2026) : les trois premiers trésors d'un niveau
  //                     sont ses coffres bronze, argent et or (rien de stocké :
  //                     ils se lisent dans `tresors`) ; le coffre d'or offre 3
  //                     matchs contre Gloubi : `gloubi` compte les matchs
  //                     JOUÉS (1 à 3, absent avant le premier — il ne fait que
  //                     monter, jamais un « restants » qui descendrait et
  //                     qu'une fusion par maximum ressusciterait) et `cran` le
  //                     Gloubi du match suivant (1 distrait, 2 gourmand,
  //                     3 malin, 4 champion), présent avec `gloubi` ;
  //         operations: { sum: {cles, aides, solutions, erreurs}, difference…,
  //                     product…, quotient… } — par opération, les CLÉS
  //                     gagnées (cumul, parties abandonnées comprises), les
  //                     aides ouvertes (« Aide »), les solutions montrées
  //                     (« Montrer une solution ») et les erreurs ; jamais les
  //                     calculs de l'élève ;
  //         dernier:    le jour du dernier trésor (« AAAA-MM-JJ »), absent
  //                     tant qu'il n'y en a pas ;
  //         partie:     LA partie en cours (une seule, la dernière) — niveau,
  //                     ops (les opérations choisies, numéros 1 à 4 dans
  //                     l'ordre sum / difference / product / quotient), serie
  //                     (les dix opérations de la série, dans l'ordre),
  //                     familles (les dix clés tirées parmi les familles de
  //                     faits), cles (0 à 10), parfait (encore sans erreur ni
  //                     solution montrée), jour (du dernier geste). Absente
  //                     quand aucune partie n'est en cours. Un élève qui ferme
  //                     la page à 6 clés reprend à 6, sur n'importe quel
  //                     appareil : le plateau, lui, est retiré (il ne se garde
  //                     pas). }
  //     Fusion entre deux appareils (et avec le serveur) : à époque différente
  //     la plus haute gagne en bloc (restauration par le professeur, lib/
  //     progression.php) ; sinon chaque compteur prend le maximum, « dernier »
  //     la date la plus récente, et la partie en cours est celle du jour le
  //     plus récent (à jour égal, la plus avancée).
  //
  //  2. LE RANGEMENT LOCAL PAR CODE, repris de SPLAT! et de Défi tables : la
  //     clé sans code « mathsgo-coffres-parcours » est celle de l'appareil ;
  //     sous un code, une case par empreinte du code (sel de l'appareil +
  //     SHA-256, jamais le code en clair dans une clé) et un état d'envoi à
  //     côté (mathsgo-coffres-sync). L'identité (code, prénom, classe) vit
  //     dans l'ONGLET, sous les MÊMES clés que Défi tables et SPLAT! : un
  //     élève identifié l'est pour toutes les applis.
  //
  //  3. LE CLIENT DU SUIVI (creerClient), celui de SPLAT! avec appli:
  //     "coffres" : échange de billet, lecture du parcours du serveur, envoi
  //     groupé 700 ms, sendBeacon à la fermeture (« dirty » gardé pendant un
  //     envoi en vol, correctif du 07/10/2026), 200/409/404/429/400/413/5xx,
  //     relances 2 s / 10 s / 60 s, « Se déconnecter » → ?oublier=1, garde
  //     d'inactivité 10 min. Une promesse `pret` dit quand le serveur a été
  //     lu : l'appli attend de savoir s'il y a une partie à reprendre.
  //
  //  4. LES RÉGLAGES DE LA CLASSE : le professeur peut n'ouvrir que certains
  //     niveaux et certaines opérations à une classe (« Ma classe », ⚙
  //     Réglages). Le serveur les rend avec l'identité (api/eleve.php,
  //     « reglages.coffres.niveaux » et « …operations », des listes de
  //     numéros ; rien = tout ouvert) ; le client les range dans l'ONGLET,
  //     liés au code (mathsgo-coffres-reglages), à chaque lecture de
  //     l'identité, et les oublie avec le code. Sans code : tout reste ouvert.
  //
  // Logique pure : ni DOM ni réseau en dehors de creerClient, qui reçoit tout
  // (window, document, navigator, fetch, stockages, horloge) en paramètre —
  // c'est ainsi que les tests l'exécutent dans node avec un faux monde.

  // Version 2 (lot S1 « les journaux », 07/11/2026) : le journal des jours
  // de travail (`jours`, `journal`, `depuis`, voir plus bas). Le serveur
  // refuse l'écriture d'une page de version 1 (lib/applis.php,
  // « version_min » 2) : elle ne connaît pas le journal et l'effacerait en
  // renvoyant le parcours ; elle garde son travail sur l'appareil, et la page
  // rechargée le renvoie, fusionné.
  // Version 3 (lot « le chemin des coffres et le cadeau Gloubi », relecture
  // Codex du 11/11/2026) : `gloubi` et `cran` par niveau. Une page de version 2
  // ne les connaît pas : en renvoyant le parcours après un conflit, elle les
  // effacerait (et rendrait des matchs déjà joués). Le serveur refuse donc son
  // envoi (lib/applis.php, « version_min » 3) ; elle garde son travail sur
  // l'appareil, et la page rechargée le renvoie, fusionné.
  const VERSION = 3;
  const APPLI = "coffres";
  const SUIVI_URL = "https://suivi.mathsgo.re";

  const CLE_STOCKAGE = "mathsgo-coffres-parcours";
  const CLE_SYNC = "mathsgo-coffres-sync";
  const CLE_SEL = "mathsgo-coffres-sel";
  // Les clés d'onglet de Défi tables et de SPLAT!, volontairement les mêmes.
  const CLE_CODE = "mathsgo-suivi-code";
  const CLE_IDENTITE = "mathsgo-suivi-identite";
  // Les réglages de la classe de l'élève, dans l'onglet, liés à son code :
  // {code, niveaux: [1, 2], operations: [1, 3]} — une liste absente ou null =
  // tout ouvert.
  const CLE_REGLAGES = "mathsgo-coffres-reglages";
  const CLE_DERNIER_GESTE = "mathsgo-suivi-dernier-geste";

  // Les quatre opérations, dans l'ordre de l'appli (assets/js/coffres-
  // settings.js) : leur NUMÉRO (1 à 4) est ce que le serveur range dans les
  // réglages de classe et dans la partie en cours ; leur clé nomme les
  // compteurs par opération.
  const OPERATIONS = Object.freeze([
    Object.freeze({numero: 1, cle: "sum", nom: "addition", resultat: "somme"}),
    Object.freeze({numero: 2, cle: "difference", nom: "soustraction", resultat: "différence"}),
    Object.freeze({numero: 3, cle: "product", nom: "multiplication", resultat: "produit"}),
    Object.freeze({numero: 4, cle: "quotient", nom: "division", resultat: "quotient"})
  ]);
  const CLES_OPERATIONS = Object.freeze(OPERATIONS.map(o => o.cle));
  const NIVEAUX = Object.freeze([1, 2, 3]);
  const NOMBRE_NIVEAUX = 3;
  const NOMBRE_OPERATIONS = 4;
  // Dix clés par trésor : la série 3/3/2/2 et les familles sont construites
  // sur dix (assets/js/coffres-settings.js, coffres-moteur.js).
  const CLES_PAR_TRESOR = 10;
  // Les coffres d'un niveau : le 1er trésor donne le bronze, le 2e l'argent,
  // le 3e l'or (30 clés dans le niveau). Les trésors suivants comptent encore,
  // sans nouveau coffre.
  const COFFRES = Object.freeze(["bronze", "argent", "or"]);
  // Le cadeau du coffre d'or : trois matchs contre Gloubi (Carrés gloutons).
  const MATCHS_GLOUBI = 3;
  // Les quatre Gloubi, du plus faible au plus fort (assets/js/gloubi-ia.js).
  const CRANS_GLOUBI = Object.freeze(["distrait", "gourmand", "malin", "champion"]);

  // Ce que lib/applis.php doit déclarer pour « coffres » : les clés (à toute
  // profondeur) et le motif des niveaux. Un test compare le texte du
  // catalogue à ces deux listes.
  const CLES_SERVEUR = Object.freeze(["version", "epoque", "niveaux", "tresors", "parfaits", "operations",
    "sum", "difference", "product", "quotient", "cles", "aides", "solutions", "erreurs",
    "dernier", "partie", "niveau", "ops", "serie", "familles", "parfait", "jour", "jours", "journal", "depuis",
    "gloubi", "cran"]);
  const MOTIF_NIVEAUX_PHP = "/^[1-3]$/";
  const COMPTE_MAX = 1000000;

  // ------------------------------------------------------------- utilitaires

  function cloner(valeur) {
    return JSON.parse(JSON.stringify(valeur));
  }

  function entier(valeur, minimum, maximum, defaut) {
    const nombre = typeof valeur === "string" && /^-?\d+$/.test(valeur) ? Number(valeur) : valeur;
    if (!Number.isInteger(nombre)) return defaut;
    return Math.min(maximum, Math.max(minimum, nombre));
  }

  function dateOuNull(valeur) {
    if (typeof valeur !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return null;
    const [annee, mois, jour] = valeur.split("-").map(Number);
    if (mois < 1 || mois > 12 || jour < 1) return null;
    const dernier = new Date(Date.UTC(annee, mois, 0)).getUTCDate();
    return jour <= dernier ? valeur : null;
  }

  // Le jour LOCAL de l'appareil (à la Réunion, le jour UTC bascule à 4 h du
  // matin) — la même règle que Défi tables et SPLAT!.
  function jourLocal(instant) {
    const d = instant instanceof Date ? instant : new Date(typeof instant === "number" ? instant : Date.now());
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

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

  function niveauValide(valeur) {
    return Number.isInteger(valeur) && valeur >= 1 && valeur <= NOMBRE_NIVEAUX;
  }

  function operationParNumero(numero) {
    return OPERATIONS.find(o => o.numero === numero) || null;
  }

  function operationParCle(cle) {
    return OPERATIONS.find(o => o.cle === cle) || null;
  }

  // Une liste de numéros (1 à `nombre`), propre : triée, sans doublon ; null
  // si rien de lisible ou si tout y est (tout ouvert).
  function listeNumeros(brut, nombre) {
    if (!Array.isArray(brut)) return null;
    const vus = [];
    brut.forEach(n => {
      const numero = entier(n, 0, nombre + 1, 0);
      if (numero >= 1 && numero <= nombre && vus.indexOf(numero) < 0) vus.push(numero);
    });
    if (!vus.length || vus.length === nombre) return null;
    return vus.sort((a, b) => a - b);
  }

  // ------------------------------------------------------------- le format

  function creer() {
    return {version: VERSION, epoque: 0, niveaux: {}, operations: {}};
  }

  function niveauVide() {
    return {tresors: 0, parfaits: 0};
  }

  function operationVide() {
    return {cles: 0, aides: 0, solutions: 0, erreurs: 0};
  }

  // Le cadeau Gloubi d'un niveau : des matchs joués seulement après son
  // coffre d'or ; le cran ramené aux bornes du niveau (niveaux 1 et 2 :
  // distrait à malin ; niveau 3 : malin ou champion).
  function bornerCran(niveau, cran) {
    const c = entier(cran, 1, CRANS_GLOUBI.length, cranDeDepart(niveau));
    return niveau === 3 ? Math.max(3, c) : Math.min(3, c);
  }

  function normaliserNiveau(brut, numero) {
    if (!brut || typeof brut !== "object") return null;
    const n = niveauVide();
    n.tresors = entier(brut.tresors, 0, COMPTE_MAX, 0);
    n.parfaits = Math.min(n.tresors, entier(brut.parfaits, 0, COMPTE_MAX, 0));
    const joues = n.tresors >= COFFRES.length ? entier(brut.gloubi, 0, MATCHS_GLOUBI, 0) : 0;
    if (joues) {
      n.gloubi = joues;
      n.cran = bornerCran(numero, brut.cran);
    }
    return n.tresors ? n : null;
  }

  function normaliserOperation(brut) {
    if (!brut || typeof brut !== "object") return null;
    const o = operationVide();
    o.cles = entier(brut.cles, 0, COMPTE_MAX, 0);
    o.aides = entier(brut.aides, 0, COMPTE_MAX, 0);
    o.solutions = entier(brut.solutions, 0, COMPTE_MAX, 0);
    o.erreurs = entier(brut.erreurs, 0, COMPTE_MAX, 0);
    return o.cles || o.aides || o.solutions || o.erreurs ? o : null;
  }

  // La partie en cours : rien d'à peu près — une série qui n'a pas dix
  // opérations, prises parmi les opérations choisies, n'est pas une partie.
  function normaliserPartie(brut) {
    if (!brut || typeof brut !== "object") return null;
    const niveau = entier(brut.niveau, 0, NOMBRE_NIVEAUX + 1, 0);
    if (!niveauValide(niveau)) return null;
    const ops = Array.isArray(brut.ops) ? brut.ops.map(n => entier(n, 0, NOMBRE_OPERATIONS + 1, 0)) : [];
    const choisies = [];
    ops.forEach(n => { if (n >= 1 && n <= NOMBRE_OPERATIONS && choisies.indexOf(n) < 0) choisies.push(n); });
    if (!choisies.length) return null;
    choisies.sort((a, b) => a - b);
    const serie = Array.isArray(brut.serie) ? brut.serie.map(n => entier(n, 0, NOMBRE_OPERATIONS + 1, 0)) : [];
    if (serie.length !== CLES_PAR_TRESOR || serie.some(n => choisies.indexOf(n) < 0)) return null;
    const familles = Array.isArray(brut.familles) && brut.familles.length === CLES_PAR_TRESOR
      ? brut.familles.map(f => f === true) : serie.map(() => false);
    return {
      niveau,
      ops: choisies,
      serie,
      familles,
      cles: entier(brut.cles, 0, CLES_PAR_TRESOR, 0),
      parfait: brut.parfait !== false,
      jour: dateOuNull(brut.jour)
    };
  }

  function normaliser(brut) {
    const p = creer();
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return p;
    p.epoque = entier(brut.epoque, 0, COMPTE_MAX, 0);
    const niveaux = brut.niveaux && typeof brut.niveaux === "object" ? brut.niveaux : {};
    NIVEAUX.forEach(numero => {
      const n = normaliserNiveau(niveaux[String(numero)], numero);
      if (n) p.niveaux[String(numero)] = n;
    });
    const operations = brut.operations && typeof brut.operations === "object" ? brut.operations : {};
    CLES_OPERATIONS.forEach(cle => {
      const o = normaliserOperation(operations[cle]);
      if (o) p.operations[cle] = o;
    });
    const dernier = dateOuNull(brut.dernier);
    if (dernier) p.dernier = dernier;
    const partie = normaliserPartie(brut.partie);
    if (partie) p.partie = partie;
    poserJournal(p, lignesDuJournal(brut.jours, brut.journal), brut.depuis);
    return p;
  }

  // ------------------------------------------------------------- le journal
  //
  // Lot S1 « les journaux » (07/11/2026, chantier « Suivre ses élèves ») :
  // une entrée par JOUR où l'élève a joué, pour que le professeur sache ce
  // qu'il a fait chaque jour (la fiche toutes applis, lot S2). Quatre listes
  // d'entiers alignées sur `jours` (les 60 derniers jours joués) :
  //   tresors    les trésors ouverts ce jour-là ;
  //   parfaits   parmi eux, les parfaits ;
  //   aides      les aides ouvertes ce jour-là ;
  //   solutions  les solutions montrées ce jour-là.
  // -1 : pas connu (une donnée abîmée). Ni heure, ni calcul, ni réponse.
  // `depuis` : le premier jour où ce parcours a tenu son journal.
  // Fusion : un jour vu de deux appareils prend le PLUS GRAND de chaque
  // colonne, jamais la somme (refusionner doublerait) ; un nombre connu bat
  // « pas connu » (-1 est le plus petit) ; puis les 60 jours les plus
  // récents. Refusionner avec l'une ou l'autre copie ne change plus rien.
  // Le léger sous-compte quand deux appareils servent le même jour est
  // accepté. Pas de journal tant que rien n'a été fait depuis le lot S1.
  const JOURNAL = Object.freeze(["tresors", "parfaits", "aides", "solutions"]);
  const JOURNAL_JOURS = 60;
  const JOURNAL_MAX = 9999;

  function valeurDuJournal(valeur) {
    return Number.isInteger(valeur) && valeur >= 0 && valeur <= JOURNAL_MAX ? valeur : -1;
  }

  // Les jours et leurs entrées, lus ensemble. Une colonne plus courte que
  // les jours (abîmée) s'aligne sur les plus récents : les plus anciens
  // valent -1 ; un jour qui n'en est pas part avec son entrée.
  function lignesDuJournal(joursBruts, journalBrut) {
    const dates = Array.isArray(joursBruts) ? joursBruts : [];
    const journal = journalBrut && typeof journalBrut === "object" && !Array.isArray(journalBrut) ? journalBrut : {};
    const colonnes = JOURNAL.map(champ => {
      const liste = Array.isArray(journal[champ]) ? journal[champ] : [];
      const decalage = dates.length - liste.length;
      return index => (index - decalage >= 0 && index - decalage < liste.length ? liste[index - decalage] : -1);
    });
    const lignes = [];
    dates.forEach((brute, index) => {
      const jour = dateOuNull(brute);
      if (jour) lignes.push({jour, entree: colonnes.map(lire => valeurDuJournal(lire(index)))});
    });
    return lignes;
  }

  // Une entrée par jour (deux du même jour : le plus grand, colonne par
  // colonne), dans l'ordre des jours, les 60 plus récents ; `depuis` jamais
  // après le premier jour gardé. Rien : pas de journal du tout.
  function poserJournal(p, lignes, depuisBrut) {
    delete p.jours;
    delete p.journal;
    delete p.depuis;
    const parJour = new Map();
    lignes.forEach(({jour, entree}) => {
      const avant = parJour.get(jour);
      parJour.set(jour, avant ? avant.map((valeur, index) => Math.max(valeur, entree[index])) : entree.slice());
    });
    const jours = [...parJour.keys()].sort().slice(-JOURNAL_JOURS);
    if (!jours.length) return p;
    p.jours = jours;
    p.journal = {};
    JOURNAL.forEach((champ, index) => { p.journal[champ] = jours.map(jour => parJour.get(jour)[index]); });
    p.depuis = dateLaPlusAncienne(dateOuNull(depuisBrut), jours[0]);
    return p;
  }

  // Ce qu'un geste ajoute au journal du jour : [trésors, parfaits, aides,
  // solutions]. Une colonne « pas connue » le reste tant qu'on n'y ajoute rien.
  function ajouterAuJournal(p, aujourdhui, ajouts) {
    const jour = dateOuNull(aujourdhui) || jourLocal();
    const lignes = lignesDuJournal(p.jours, p.journal);
    const ligne = lignes.find(l => l.jour === jour);
    if (ligne) ligne.entree = ligne.entree.map((valeur, index) => (ajouts[index] > 0 ? Math.min(JOURNAL_MAX, Math.max(0, valeur) + ajouts[index]) : valeur));
    else lignes.push({jour, entree: ajouts.map(n => Math.min(JOURNAL_MAX, Math.max(0, n)))});
    return poserJournal(p, lignes, dateLaPlusAncienne(p.depuis || null, jour));
  }

  // Vide : ni trésor, ni compteur d'opération, ni partie en cours.
  function estVide(parcours) {
    const p = normaliser(parcours);
    return !Object.keys(p.niveaux).length && !Object.keys(p.operations).length && !p.partie;
  }

  // La partie la plus utile à garder : celle du jour le plus récent ; à jour
  // égal (ou sans jour), la plus avancée ; à égalité, la première.
  function meilleurePartie(a, b) {
    if (!a) return b || null;
    if (!b) return a;
    if (a.jour !== b.jour) {
      if (!a.jour) return b;
      if (!b.jour) return a;
      return a.jour > b.jour ? a : b;
    }
    if (a.cles !== b.cles) return a.cles > b.cles ? a : b;
    return a;
  }

  // Deux parcours du même élève (deux appareils, ou le serveur et la case).
  function fusionner(premier, second) {
    const a = normaliser(premier);
    const b = normaliser(second);
    if (a.epoque !== b.epoque) return a.epoque > b.epoque ? a : b;
    const fusion = creer();
    fusion.epoque = a.epoque;
    NIVEAUX.forEach(numero => {
      const cle = String(numero);
      const na = a.niveaux[cle], nb = b.niveaux[cle];
      if (!na && !nb) return;
      const n = niveauVide();
      n.tresors = Math.max(na ? na.tresors : 0, nb ? nb.tresors : 0);
      n.parfaits = Math.min(n.tresors, Math.max(na ? na.parfaits : 0, nb ? nb.parfaits : 0));
      // Le cadeau Gloubi : les matchs joués montent (le plus grand) ; le cran
      // suit la copie qui en a joué le plus — à égalité, le plus fort (un
      // ordre fixe : le même résultat dans les deux sens).
      const ja = na && na.gloubi ? na.gloubi : 0, jb = nb && nb.gloubi ? nb.gloubi : 0;
      if (ja || jb) {
        n.gloubi = Math.max(ja, jb);
        n.cran = ja > jb ? na.cran : jb > ja ? nb.cran : Math.max(na.cran, nb.cran);
      }
      fusion.niveaux[cle] = n;
    });
    CLES_OPERATIONS.forEach(cle => {
      const oa = a.operations[cle], ob = b.operations[cle];
      if (!oa && !ob) return;
      const o = operationVide();
      ["cles", "aides", "solutions", "erreurs"].forEach(champ => {
        o[champ] = Math.max(oa ? oa[champ] : 0, ob ? ob[champ] : 0);
      });
      fusion.operations[cle] = o;
    });
    const dernier = dateLaPlusRecente(a.dernier || null, b.dernier || null);
    if (dernier) fusion.dernier = dernier;
    // Une partie ne survit que du côté qui connaît TOUS les trésors de son
    // niveau : la copie qui en a moins est d'avant un trésor gagné ailleurs, et
    // sa partie a fini en trésor (relecture Codex du 11/11/2026 — sinon une
    // vieille copie ressuscitait une partie terminée, et ses clés se
    // recomptaient en un second trésor). Le prix, accepté : une partie
    // commencée hors ligne pendant qu'un autre appareil gagnait un trésor du
    // même niveau repart à zéro (ses clés restent dans les cumuls).
    const aJour = (partie, cote) => {
      if (!partie) return null;
      const cle = String(partie.niveau);
      const ici = cote.niveaux[cle] ? cote.niveaux[cle].tresors : 0;
      const tous = fusion.niveaux[cle] ? fusion.niveaux[cle].tresors : 0;
      return ici >= tous ? partie : null;
    };
    const partie = meilleurePartie(aJour(a.partie || null, a), aJour(b.partie || null, b));
    if (partie) fusion.partie = cloner(partie);
    // Le journal (lot S1) : l'union des jours, le plus grand de chaque
    // colonne le même jour, et le plus ancien `depuis`.
    poserJournal(fusion, [...lignesDuJournal(a.jours, a.journal), ...lignesDuJournal(b.jours, b.journal)],
      dateLaPlusAncienne(a.depuis || null, b.depuis || null));
    return normaliser(fusion);
  }

  // --------------------------------------------------- les gestes de l'appli
  //
  // Chacun rend un parcours NEUF (le reçu n'est pas modifié). `aujourdhui` :
  // le jour local de la page (les tests le donnent).

  // Une partie commence (ou recommence) : elle remplace la partie en cours.
  // `partie` : {niveau, ops (numéros ou clés), serie (numéros ou clés),
  // familles (booléens), cles (0 par défaut)}.
  function commencerPartie(parcours, partie, aujourdhui) {
    const p = normaliser(parcours);
    if (!partie || typeof partie !== "object") return p;
    const numero = valeur => (typeof valeur === "string" ? (operationParCle(valeur) || {numero: 0}).numero : valeur);
    const propre = normaliserPartie({
      niveau: partie.niveau,
      ops: (Array.isArray(partie.ops) ? partie.ops : []).map(numero),
      serie: (Array.isArray(partie.serie) ? partie.serie : []).map(numero),
      familles: partie.familles,
      cles: partie.cles || 0,
      parfait: partie.parfait !== false,
      jour: dateOuNull(aujourdhui) || jourLocal()
    });
    if (propre) p.partie = propre;
    else delete p.partie;
    return p;
  }

  function compteurOperation(p, operation) {
    const o = operationParCle(operation) || operationParNumero(operation);
    if (!o) return null;
    if (!p.operations[o.cle]) p.operations[o.cle] = operationVide();
    return p.operations[o.cle];
  }

  function toucherPartie(p, aujourdhui) {
    if (p.partie) p.partie.jour = dateOuNull(aujourdhui) || jourLocal();
  }

  // Une clé gagnée sur cette opération : le cumul de l'opération monte, la
  // partie en cours avance d'une clé.
  function noterCle(parcours, operation, aujourdhui) {
    const p = normaliser(parcours);
    const o = compteurOperation(p, operation);
    if (!o) return p;
    o.cles = Math.min(COMPTE_MAX, o.cles + 1);
    if (p.partie) {
      p.partie.cles = Math.min(CLES_PAR_TRESOR, p.partie.cles + 1);
      toucherPartie(p, aujourdhui);
    }
    return p;
  }

  // Une mauvaise paire : une erreur de plus sur l'opération, et la partie en
  // cours n'est plus parfaite.
  function noterErreur(parcours, operation, aujourdhui) {
    const p = normaliser(parcours);
    const o = compteurOperation(p, operation);
    if (!o) return p;
    o.erreurs = Math.min(COMPTE_MAX, o.erreurs + 1);
    if (p.partie) { p.partie.parfait = false; toucherPartie(p, aujourdhui); }
    return p;
  }

  // « Aide » ouverte : comptée, la partie reste parfaite (regarder le cours
  // n'est pas tricher).
  function noterAide(parcours, operation, aujourdhui) {
    const p = normaliser(parcours);
    const o = compteurOperation(p, operation);
    if (!o) return p;
    o.aides = Math.min(COMPTE_MAX, o.aides + 1);
    if (p.partie) toucherPartie(p, aujourdhui);
    ajouterAuJournal(p, aujourdhui, [0, 0, 1, 0]);
    return p;
  }

  // « Montrer une solution » : comptée, et la partie n'est plus parfaite.
  function noterSolution(parcours, operation, aujourdhui) {
    const p = normaliser(parcours);
    const o = compteurOperation(p, operation);
    if (!o) return p;
    o.solutions = Math.min(COMPTE_MAX, o.solutions + 1);
    if (p.partie) { p.partie.parfait = false; toucherPartie(p, aujourdhui); }
    ajouterAuJournal(p, aujourdhui, [0, 0, 0, 1]);
    return p;
  }

  // Le trésor s'ouvre (dix clés) : un trésor de plus au niveau de la partie,
  // parfait s'il l'est resté ; le jour est noté ; la partie en cours s'efface.
  // Sans partie en cours (page rechargée au mauvais moment), `niveau` et
  // `parfait` peuvent être donnés directement.
  function noterTresor(parcours, aujourdhui, options) {
    const p = normaliser(parcours);
    const o = options || {};
    const niveau = p.partie ? p.partie.niveau : entier(o.niveau, 0, NOMBRE_NIVEAUX + 1, 0);
    if (!niveauValide(niveau)) return p;
    const parfait = p.partie ? p.partie.parfait : o.parfait === true;
    const cle = String(niveau);
    if (!p.niveaux[cle]) p.niveaux[cle] = niveauVide();
    p.niveaux[cle].tresors = Math.min(COMPTE_MAX, p.niveaux[cle].tresors + 1);
    if (parfait) p.niveaux[cle].parfaits = Math.min(p.niveaux[cle].tresors, p.niveaux[cle].parfaits + 1);
    p.dernier = dateLaPlusRecente(p.dernier || null, dateOuNull(aujourdhui) || jourLocal());
    delete p.partie;
    ajouterAuJournal(p, aujourdhui, [1, parfait ? 1 : 0, 0, 0]);
    return p;
  }

  // ------------------------------------- le chemin des coffres et Gloubi
  //
  // Lot « Coffres magiques : le chemin des coffres et le cadeau Gloubi »
  // (09/11/2026, décisions de Gwenaël). Pour l'élève connecté seulement.

  // Le Gloubi du premier match : distrait au niveau 1, gourmand au niveau 2,
  // malin au niveau 3.
  function cranDeDepart(niveau) {
    return niveau === 3 ? 3 : niveau === 2 ? 2 : 1;
  }

  // Le Gloubi du match suivant. Niveaux 1 et 2 : il s'adapte — match gagné,
  // un cran plus fort ; perdu, un plus faible ; nul, le même ; entre distrait
  // et malin. Niveau 3 (« un peu plus dur ») : jamais sous le malin ; un match
  // gagné contre le malin fait passer au champion, et on y reste.
  function cranSuivant(niveau, cran, issue) {
    const c = bornerCran(niveau, cran);
    if (niveau === 3) return c >= 4 || issue === "gagne" ? 4 : 3;
    if (issue === "gagne") return Math.min(3, c + 1);
    if (issue === "perdu") return Math.max(1, c - 1);
    return c;
  }

  // Les coffres gagnés d'un niveau : 0 à 3.
  function coffresDuNiveau(parcours, niveau) {
    const p = normaliser(parcours);
    const n = p.niveaux[String(niveau)];
    return n ? Math.min(COFFRES.length, n.tresors) : 0;
  }

  // Les matchs contre Gloubi qui restent à jouer dans un niveau : 3 − joués
  // si son coffre d'or est gagné, 0 sinon.
  function matchsRestants(parcours, niveau) {
    const p = normaliser(parcours);
    const n = p.niveaux[String(niveau)];
    if (!n || n.tresors < COFFRES.length) return 0;
    return MATCHS_GLOUBI - (n.gloubi || 0);
  }

  // Le Gloubi du prochain match d'un niveau (1 à 4).
  function cranGloubi(parcours, niveau) {
    const p = normaliser(parcours);
    const n = p.niveaux[String(niveau)];
    return n && n.gloubi ? n.cran : cranDeDepart(niveau);
  }

  // Un match contre Gloubi est FINI (deux manches) : un match joué de plus
  // dans ce niveau et le Gloubi du suivant. `issue` : « gagne », « perdu » ou
  // « nul » (pour l'élève). `cranJoue` : le Gloubi vraiment affronté (1 à 4) —
  // le suivant se calcule à partir de LUI, pas du cran rangé entre-temps par
  // un autre onglet (relecture Codex du 11/11/2026). Rien ne bouge sans match
  // restant. Un match
  // abandonné en route n'est jamais noté : il se rejoue en entier. Ce n'est
  // pas un jour de travail (le journal ne bouge pas, la partie non plus).
  function noterMatchGloubi(parcours, niveau, issue, cranJoue) {
    const p = normaliser(parcours);
    const numero = entier(niveau, 0, NOMBRE_NIVEAUX + 1, 0);
    if (!niveauValide(numero) || matchsRestants(p, numero) <= 0) return p;
    const n = p.niveaux[String(numero)];
    const joue = entier(cranJoue, 1, CRANS_GLOUBI.length, 0);
    const cran = joue ? bornerCran(numero, joue) : n.gloubi ? n.cran : cranDeDepart(numero);
    n.gloubi = (n.gloubi || 0) + 1;
    n.cran = cranSuivant(numero, cran, issue === "gagne" || issue === "perdu" ? issue : "nul");
    return p;
  }

  // La progression (décision de Gwenaël du 11/11/2026) : un niveau s'ouvre
  // quand l'élève a le coffre d'or du niveau ouvert juste en dessous. Le
  // premier niveau que le professeur a ouvert à la classe l'est d'office (une
  // classe sans le niveau 1 commence au niveau 2). Un niveau où l'élève a déjà
  // un trésor ou sa partie en cours reste ouvert : on ne lui retire jamais ce
  // qu'il a gagné (les trésors gardés depuis le 21/10/2026). Un niveau fermé
  // par le professeur n'est jamais débloqué.
  //   → pour chaque niveau : {numero, ouvert (professeur), debloque, apres}
  //     — `apres` : le niveau dont le coffre d'or l'ouvrira (null si débloqué
  //     ou fermé par le professeur).
  function progressionDesNiveaux(parcours, reglages) {
    const p = normaliser(parcours);
    const r = reglages || reglagesDeClasse(null);
    let precedent = null;
    return NIVEAUX.map(numero => {
      const n = p.niveaux[String(numero)];
      const ouvert = niveauOuvert(r, numero);
      let debloque = false;
      let apres = null;
      if (ouvert) {
        const dejaLa = Boolean(n && n.tresors) || Boolean(p.partie && p.partie.niveau === numero);
        const orDessous = precedent === null || coffresDuNiveau(p, precedent) >= COFFRES.length;
        debloque = dejaLa || orDessous;
        if (!debloque) apres = precedent;
        precedent = numero;
      }
      return {numero, ouvert, debloque, apres};
    });
  }

  // Les niveaux où l'élève connecté peut jouer (le chemin et l'entraînement
  // libre) : ouverts par le professeur ET débloqués.
  function niveauxDebloques(parcours, reglages) {
    return progressionDesNiveaux(parcours, reglages).filter(n => n.debloque).map(n => n.numero);
  }

  // Tout ce que la carte « Tes coffres » affiche : les trois niveaux (coffres
  // gagnés, ouvert ou fermé par le professeur, débloqué ou pas encore), le
  // PROCHAIN coffre conseillé (le premier niveau débloqué qui n'a pas son or ;
  // null quand tous l'ont), le prochain cadenas à ouvrir (`verrou` :
  // {niveau, apres} ou null), les matchs de Gloubi qui attendent (niveau par
  // niveau) et la partie en cours.
  function cheminDesCoffres(parcours, reglages) {
    const p = normaliser(parcours);
    const progression = progressionDesNiveaux(p, reglages || reglagesDeClasse(null));
    const niveaux = progression.map(etat => {
      const n = p.niveaux[String(etat.numero)];
      return {
        numero: etat.numero,
        tresors: n ? n.tresors : 0,
        coffres: n ? Math.min(COFFRES.length, n.tresors) : 0,
        ouvert: etat.ouvert,
        debloque: etat.debloque,
        apres: etat.apres
      };
    });
    const suivant = niveaux.find(n => n.debloque && n.coffres < COFFRES.length);
    const ferme = niveaux.find(n => n.ouvert && !n.debloque);
    const gloubi = NIVEAUX.map(numero => ({niveau: numero, restants: matchsRestants(p, numero), cran: cranGloubi(p, numero)}))
      .filter(g => g.restants > 0);
    return {
      niveaux,
      prochain: suivant ? {niveau: suivant.numero, coffre: COFFRES[suivant.coffres]} : null,
      verrou: ferme ? {niveau: ferme.numero, apres: ferme.apres} : null,
      gloubi,
      partie: p.partie ? cloner(p.partie) : null
    };
  }

  // La partie en cours s'abandonne (réglages changés par le professeur,
  // « Repartir à 0 clé ») : les clés gagnées restent dans le cumul, les
  // trésors restent.
  function oublierPartie(parcours) {
    const p = normaliser(parcours);
    delete p.partie;
    return p;
  }

  // Ce qui part au serveur : exactement le format, rien de plus — le local et
  // le serveur ont le même contenu (le plateau n'est jamais rangé).
  function pourServeur(parcours) {
    return normaliser(parcours);
  }

  // ------------------------------------------- les réglages de la classe
  //
  // Ce que le serveur rend (reglages.coffres.niveaux, .operations) → deux
  // listes propres, ou null quand tout est ouvert — ou quand la réponse ne
  // dit rien de lisible : dans le doute, on ouvre (un niveau ouvert à tort se
  // joue, un niveau fermé à tort bloque un élève).
  function reglagesDeClasse(reglages) {
    const r = reglages && typeof reglages === "object" && reglages.coffres && typeof reglages.coffres === "object"
      ? reglages.coffres : null;
    return {
      niveaux: r ? listeNumeros(r.niveaux, NOMBRE_NIVEAUX) : null,
      operations: r ? listeNumeros(r.operations, NOMBRE_OPERATIONS) : null
    };
  }

  function niveauOuvert(reglages, niveau) {
    const r = reglages && typeof reglages === "object" && "niveaux" in reglages ? reglages : reglagesDeClasse(reglages);
    return !Array.isArray(r.niveaux) || r.niveaux.indexOf(niveau) >= 0;
  }

  // `operation` : un numéro ou une clé.
  function operationOuverte(reglages, operation) {
    const r = reglages && typeof reglages === "object" && "operations" in reglages ? reglages : reglagesDeClasse(reglages);
    const o = typeof operation === "string" ? operationParCle(operation) : operationParNumero(operation);
    if (!o) return false;
    return !Array.isArray(r.operations) || r.operations.indexOf(o.numero) >= 0;
  }

  function niveauxOuverts(reglages) {
    return NIVEAUX.filter(n => niveauOuvert(reglages, n));
  }

  function operationsOuvertes(reglages) {
    return OPERATIONS.filter(o => operationOuverte(reglages, o.numero));
  }

  // La partie en cours tient-elle avec les réglages de la classe ? Non quand
  // son niveau est fermé, ou quand l'une de ses opérations est retirée.
  // Ouvrir davantage ne change rien à la partie.
  function partieCompatible(partie, reglages) {
    const p = normaliserPartie(partie);
    if (!p) return true;
    const r = reglagesDeClasse(reglages && "niveaux" in reglages ? {coffres: reglages} : reglages);
    if (!niveauOuvert(r, p.niveau)) return false;
    return p.ops.every(n => operationOuverte(r, n));
  }

  function chargerReglagesOnglet(stockage, code) {
    try {
      const propre = normaliserCode(code || "");
      const brut = stockage && codeValide(propre) ? stockage.getItem(CLE_REGLAGES) : null;
      if (!brut) return reglagesDeClasse(null);
      const lu = JSON.parse(brut);
      if (!lu || typeof lu !== "object" || lu.code !== propre) return reglagesDeClasse(null);
      return reglagesDeClasse({coffres: {niveaux: lu.niveaux, operations: lu.operations}});
    } catch (_) {
      return reglagesDeClasse(null);
    }
  }

  function sauverReglagesOnglet(stockage, code, reglages) {
    try {
      const propre = normaliserCode(code || "");
      if (!stockage || !codeValide(propre)) return false;
      const r = reglages && "niveaux" in reglages ? reglages : reglagesDeClasse(reglages);
      if (!Array.isArray(r.niveaux) && !Array.isArray(r.operations)) stockage.removeItem(CLE_REGLAGES);
      else stockage.setItem(CLE_REGLAGES, JSON.stringify({code: propre, niveaux: r.niveaux, operations: r.operations}));
      return true;
    } catch (_) {
      return false;
    }
  }

  // ------------------------------------------------------- la vue du professeur

  // Les mots pour une liste d'opérations : « addition et multiplication »,
  // « addition, soustraction et division ».
  function nommerOperations(liste) {
    const noms = (Array.isArray(liste) ? liste : [])
      .map(n => (typeof n === "string" ? operationParCle(n) : operationParNumero(n)))
      .filter(Boolean)
      .map(o => o.nom);
    if (!noms.length) return "";
    if (noms.length === 1) return noms[0];
    return `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
  }

  // Tout ce que « Ma classe » affiche d'un élève, lu ici et nulle part
  // ailleurs : par niveau, trésors et parfaits ; par opération, les quatre
  // compteurs ; le jour du dernier trésor ; la partie en cours (à partir
  // d'une clé : une partie à 0 clé n'est qu'un choix de réglages).
  function resumeProf(parcours) {
    const p = normaliser(parcours);
    const niveaux = NIVEAUX.map(numero => {
      const n = p.niveaux[String(numero)] || niveauVide();
      return {numero, tresors: n.tresors, parfaits: n.parfaits, coffres: Math.min(COFFRES.length, n.tresors)};
    });
    const operations = OPERATIONS.map(o => {
      const c = p.operations[o.cle] || operationVide();
      return {cle: o.cle, numero: o.numero, nom: o.nom, cles: c.cles, aides: c.aides, solutions: c.solutions, erreurs: c.erreurs};
    });
    const tresors = niveaux.reduce((somme, n) => somme + n.tresors, 0);
    const partie = p.partie && p.partie.cles > 0
      ? {niveau: p.partie.niveau, ops: p.partie.ops.slice(), operations: nommerOperations(p.partie.ops), cles: p.partie.cles, total: CLES_PAR_TRESOR}
      : null;
    return {
      niveaux, operations, tresors,
      parfaits: niveaux.reduce((somme, n) => somme + n.parfaits, 0),
      dernier: p.dernier || null,
      partie,
      commence: tresors > 0 || Boolean(partie)
    };
  }

  // La tuile de l'espace élève : une ligne par niveau commencé (un trésor, ou
  // la partie en cours à partir d'une clé), et la partie en cours au bout de
  // la ligne de son niveau. Rien tant que l'élève n'a ni trésor ni partie.
  // Lot « le chemin des coffres » (choix A de Gwenaël, 09/11/2026) : la ligne
  // montre les trois coffres du niveau (`coffres`, 0 à 3) ; rien de Gloubi.
  function resumeTuile(parcours) {
    const r = resumeProf(parcours);
    const lignes = r.niveaux
      .filter(n => n.tresors > 0 || (r.partie && r.partie.niveau === n.numero))
      .map(n => ({
        niveau: n.numero,
        tresors: n.tresors,
        coffres: n.coffres,
        cles: r.partie && r.partie.niveau === n.numero ? r.partie.cles : null,
        total: CLES_PAR_TRESOR
      }));
    return {lignes, vide: !lignes.length};
  }

  // --------------------------------------- pour « Suivre ses élèves » (S2)
  //
  // Lot S1 « les journaux » (07/11/2026) : la même fonction, avec la même
  // forme de réponse, dans les cinq moteurs suivis (voir splat-parcours.js,
  // resumeSuivi, pour la forme complète). Rien ne l'affiche encore.
  // Coffres magiques : un jour de travail = un jour avec un trésor ouvert ;
  // lot « Coffres : un jour dès la première clé » (choix de Gwenaël,
  // 08/11/2026, « l'élève a fait quelque chose ») : AUSSI le dernier jour
  // joué de la partie en cours quand elle a au moins une clé — sans rien
  // changer aux données (la partie garde déjà ses clés et son jour). Limite
  // acceptée : la même partie reprise un autre jour ne garde que ce jour-là.
  // Ce jour-là, sa ligne ne dit pas de trésor (null) — l'aide et les
  // solutions vues, si le journal les a notées ;
  // une ligne par jour {tresors, parfaits, aides, solutions} ; à aider : des
  // solutions vues cette semaine ({type: "solutions-vues", solutions}) ; à
  // féliciter : rien (aucune règle décidée pour Coffres).
  function jourPlus(jour, nombre) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    d.setDate(d.getDate() + nombre);
    return jourLocal(d);
  }

  function lundiDu(jour) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return jourLocal(d);
  }

  function aujourdhuiDes(options) {
    const o = typeof options === "string" ? {aujourdhui: options} : (options || {});
    return dateOuNull(o.aujourdhui) || jourLocal();
  }

  function resumeSuivi(parcours, options) {
    const aujourdhui = aujourdhuiDes(options);
    const p = normaliser(parcours);
    const debut = jourPlus(lundiDu(aujourdhui), -21);
    const lundi = lundiDu(aujourdhui);
    const lignes = lignesDuJournal(p.jours, p.journal).filter(l => l.jour <= aujourdhui);
    const nombre = valeur => (valeur >= 0 ? valeur : null);
    // Un trésor ouvert (une valeur pas connue compte : le jour est dans le
    // journal, on ne sait pas ce qui s'y est fait).
    const travail = lignes.filter(l => l.entree[0] !== 0);
    // Le jour de la partie en cours, dès sa première clé (pas un jour à
    // venir : horloge fausse d'un autre appareil).
    const partie = p.partie && p.partie.cles >= 1 ? dateOuNull(p.partie.jour) : null;
    if (partie && partie <= aujourdhui && !travail.some(l => l.jour === partie)) {
      const duJour = lignes.find(l => l.jour === partie);
      travail.push({jour: partie, entree: [-1, -1, duJour ? duJour.entree[2] : -1, duJour ? duJour.entree[3] : -1]});
      travail.sort((a, b) => (a.jour < b.jour ? -1 : a.jour > b.jour ? 1 : 0));
    }
    const jours = travail.filter(l => l.jour >= debut).map(l => ({
      jour: l.jour,
      lignes: [{tresors: nombre(l.entree[0]), parfaits: nombre(l.entree[1]), aides: nombre(l.entree[2]), solutions: nombre(l.entree[3])}]
    }));
    let dernier = travail.length ? travail[travail.length - 1].jour : null;
    if (p.dernier && p.dernier <= aujourdhui && (!dernier || p.dernier > dernier)) dernier = p.dernier;
    let connuDepuis = null;
    if (p.depuis) connuDepuis = p.jours.length >= JOURNAL_JOURS && p.jours[0] > p.depuis ? p.jours[0] : p.depuis;
    else if (!estVide(p)) connuDepuis = jourPlus(aujourdhui, 1);
    const solutions = lignes.filter(l => l.jour >= lundi).reduce((somme, l) => somme + Math.max(0, l.entree[3]), 0);
    return {
      appli: APPLI, aujourdhui, debut, connuDepuis, dernier, jours,
      aider: solutions ? [{type: "solutions-vues", solutions}] : [],
      feliciter: []
    };
  }

  // ------------------------------------------------------------- empreintes
  //
  // Le même rangement que Défi tables (lot 8) : la clé d'une case à code porte
  // l'EMPREINTE du code, pas le code — SHA-256 répété ITERATIONS_EMPREINTE fois
  // de « sel:code », tronqué à 16 caractères, le sel étant tiré une fois par
  // appareil. Qui lit le stockage d'une tablette n'en tire aucun code.

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
  const ITERATIONS_EMPREINTE = 10000;
  const LONGUEUR_EMPREINTE = 16;
  const memoEmpreintes = new Map();

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

  // ------------------------------------------------------------- le code élève

  const ALPHABET_CODE = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const LONGUEUR_CODE = 6;

  function normaliserCode(brut) {
    if (typeof brut !== "string") return "";
    return brut.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, LONGUEUR_CODE);
  }

  function codeValide(brut) {
    const code = normaliserCode(brut);
    if (code.length !== LONGUEUR_CODE) return false;
    for (let i = 0; i < code.length; i += 1) if (ALPHABET_CODE.indexOf(code[i]) < 0) return false;
    return true;
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

  const PRENOM_MAX = 24;

  function nettoyerPrenom(valeur) {
    if (typeof valeur !== "string") return "";
    return valeur.replace(/\s+/g, " ").trim().slice(0, PRENOM_MAX);
  }

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

  // ------------------------------------------------------- les cases locales

  function cleStockage(code, stockage) {
    const propre = normaliserCode(code || "");
    return codeValide(propre) ? CLE_STOCKAGE + ":" + empreinteCode(propre, selAppareil(stockage)) : CLE_STOCKAGE;
  }

  function charger(stockage, code) {
    try {
      const brut = stockage && stockage.getItem(cleStockage(code, stockage));
      if (!brut) return creer();
      return normaliser(JSON.parse(brut));
    } catch (_) {
      return creer();
    }
  }

  function sauver(stockage, parcours, code) {
    try {
      if (!stockage) return false;
      stockage.setItem(cleStockage(code, stockage), JSON.stringify(normaliser(parcours)));
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

  // L'état de synchronisation d'une case, rangé À CÔTÉ d'elle : la dernière
  // révision connue du serveur, si du travail attend d'être envoyé (dirty), si
  // le code a été refusé (detache), quand la case a bougé (maj).
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
    sync.revision = entier(lu.revision, 0, 1000000000, 0);
    sync.dirty = Boolean(lu.dirty);
    sync.detache = Boolean(lu.detache);
    sync.maj = entier(lu.maj, 0, Number.MAX_SAFE_INTEGER, 0);
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
      stockage.setItem(cleSync(code, stockage), JSON.stringify(normaliserSync(Object.assign(syncNeutre(), sync || {}))));
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

  // Vrai si une clé du stockage laisse lire un code élève : ce que le lot 8 de
  // Défi tables interdit, et ce que les tests vérifient après une séance.
  function clesRevelentUnCode(stockage) {
    return clesDuStockage(stockage).some(cle => {
      return cle.split(":").slice(1).some(morceau => morceau.length === LONGUEUR_CODE && codeValide(morceau));
    });
  }

  // La purge : une case à code que personne n'a ouverte depuis 90 jours quitte
  // l'appareil (élève parti, tablette de CDI). Le serveur garde tout. La case
  // active (« garder »), la case sans code et une case sans date ne bougent pas.
  const DUREE_CONSERVATION_MS = 90 * 24 * 60 * 60 * 1000;

  function purger(stockage, options) {
    const o = options || {};
    const maintenant = typeof o.maintenant === "number" ? o.maintenant : Date.now();
    const duree = typeof o.duree === "number" ? o.duree : DUREE_CONSERVATION_MS;
    let retirees = 0;
    try {
      if (!stockage) return 0;
      const gardee = codeValide(o.garder || "") ? cleSync(o.garder, stockage) : null;
      clesDuStockage(stockage).forEach(cle => {
        if (cle.indexOf(CLE_SYNC + ":") !== 0 || cle === gardee) return;
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

  // ------------------------------------------------------------- le client
  //
  // Ce que porte l'adresse d'entrée : le billet (#b=…) que l'espace élève a mis
  // dans le fragment. Lu par le petit script du <head> de la page (qui le range
  // dans window.MATHSGO_ENTREE et nettoie l'adresse) ; repli ici. Une ancre
  // ordinaire (#enq-bonus) n'est pas une entrée.
  function lireEntree(fenetre) {
    const e = fenetre && fenetre.MATHSGO_ENTREE;
    if (e && typeof e === "object") return {billet: String(e.billet || "")};
    let adresse = "";
    try { adresse = (fenetre && fenetre.location && fenetre.location.hash) || ""; } catch (_) { adresse = ""; }
    const fragment = adresse.replace(/^#/, "");
    if (!/(^|&)b=/.test(fragment)) return {billet: ""};
    try {
      return {billet: new URLSearchParams(fragment).get("b") || ""};
    } catch (_) {
      return {billet: ""};
    }
  }
  const GARDE_INACTIVITE_MS = 10 * 60 * 1000;
  const GARDE_ESSAIS_MAX = 3;
  const ENVOI_GROUPE_MS = 700;
  const PALIERS_RELANCE_MS = [2000, 10000, 60000];

  // Les textes du repère de suivi, les mêmes que Défi tables ; chaque page les
  // dessine à sa façon (bandeau sur la carte, pastille dans les outils).
  const TEXTES = Object.freeze({
    detache: "Ton code ne marche plus · demande le nouveau à ton professeur",
    erreur: "Suivi par ton professeur · impossible d’envoyer ce travail",
    horsLigne: "Suivi par ton professeur · travail gardé ici, pas encore envoyé",
    suivi: "Suivi par ton professeur",
    expire: "Ce lien a expiré, repasse par ton espace",
    injoignable: "Le serveur ne répond pas, repasse par ton espace",
    sortie: "Se déconnecter",
    espace: "Mon espace"
  });

  // env : { fenetre, document, navigator, fetch, stockage(), stockageSession(),
  //         horloge (Date), rendre: {parcours(), repere(), garde()}, enJeu() }
  // Tout est facultatif : sans fenêtre ni réseau, le client reste muet et la
  // case sans code fonctionne comme aujourd'hui.
  function creerClient(env) {
    const o = env || {};
    const fenetre = o.fenetre || (typeof window !== "undefined" ? window : null);
    const doc = o.document || (typeof document !== "undefined" ? document : null);
    const nav = o.navigator || (typeof navigator !== "undefined" ? navigator : null);
    const horloge = o.horloge || Date;
    const appelReseau = o.fetch || (typeof fetch === "function" ? fetch : null);
    const stockage = typeof o.stockage === "function" ? o.stockage : () => {
      try { return fenetre ? fenetre.localStorage : null; } catch (_) { return null; }
    };
    const stockageSession = typeof o.stockageSession === "function" ? o.stockageSession : () => {
      try { return fenetre ? fenetre.sessionStorage : null; } catch (_) { return null; }
    };
    const rendre = Object.assign({parcours() {}, repere() {}, garde() {}}, o.rendre || {});
    const enJeu = typeof o.enJeu === "function" ? o.enJeu : () => false;
    const minuteur = (fn, ms) => (fenetre && typeof fenetre.setTimeout === "function" ? fenetre.setTimeout(fn, ms) : setTimeout(fn, ms));
    const annuler = id => { if (fenetre && typeof fenetre.clearTimeout === "function") fenetre.clearTimeout(id); else clearTimeout(id); };
    const maintenant = () => horloge.now();

    const ENTREE = lireEntree(fenetre);

    // Le code actif : celui de l'onglet, et rien d'autre. Un billet est une
    // entrée NEUVE : l'identité que l'onglet gardait ne compte plus, et le code
    // n'arrive qu'après l'échange avec le serveur.
    if (ENTREE.billet) effacerCode(stockageSession());
    let codeSuivi = ENTREE.billet ? "" : chargerCode(stockageSession());
    purger(stockage(), {maintenant: maintenant(), garder: codeSuivi});
    let parcours = charger(stockage(), codeSuivi);
    let sync = chargerSync(stockage(), codeSuivi);
    let suiviIdentite = chargerIdentiteOnglet(stockageSession(), codeSuivi);
    // Les réglages de la classe (niveaux et opérations ouverts) : ceux que
    // l'onglet a gardés, en attendant la relecture de l'identité (à chaque
    // ouverture de page).
    let reglagesClasse = chargerReglagesOnglet(stockageSession(), codeSuivi);
    // « Prêt » : le serveur a été lu (ou n'a pas pu l'être, ou personne n'est
    // suivi) — l'appli attend ce moment pour savoir s'il y a une partie à
    // reprendre. Résolu une seule fois, avec {actif, lu}.
    let resoudrePret = null;
    let pretResolu = false;
    const pret = new Promise(resoudre => { resoudrePret = resoudre; });
    function direPret(lu) {
      if (pretResolu) return;
      pretResolu = true;
      resoudrePret({actif: suiviActif(), lu: Boolean(lu)});
    }
    let suiviHorsLigne = false;
    let envoiEnAttente = null;
    // Vrai tant qu'un envoi groupé est programmé et n'est pas encore parti.
    // Tenu à part de l'identifiant du minuteur : un minuteur qui s'exécute
    // avant de rendre son identifiant (les tests) laisserait l'identifiant
    // debout après le départ.
    let envoiGroupe = false;
    let envoiEnVol = false;
    let renvoiDemande = false;
    let relance = null;
    let echecsSuccessifs = 0;
    let fusionsSuccessives = 0;
    let erreurDefinitive = false;
    let entreeRefusee = null; // "expire" | "injoignable" | null
    let billetEnCours = false;

    function suiviActif() { return Boolean(codeSuivi); }

    function ecrireSync() {
      if (!sync.maj) sync.maj = maintenant();
      sauverSync(stockage(), codeSuivi, sync);
    }

    function sauverCase() {
      sauver(stockage(), parcours, codeSuivi);
    }

    function prenomAffiche() {
      return suiviActif() && suiviIdentite && suiviIdentite.prenom ? suiviIdentite.prenom : "";
    }

    // Un seul point de contact avec le serveur : il n'échoue jamais, il renvoie
    // un statut 0 quand rien n'a répondu.
    async function appelSuivi(chemin, options) {
      if (!appelReseau) return {statut: 0, donnees: null};
      try {
        const controle = typeof AbortController === "function" ? new AbortController() : null;
        const garde = controle ? minuteur(() => controle.abort(), 8000) : null;
        try {
          const reponse = await appelReseau(SUIVI_URL + chemin, Object.assign(
            {cache: "no-store"}, controle ? {signal: controle.signal} : {}, options || {}));
          const donnees = await reponse.json().catch(() => null);
          let reessai = null;
          try {
            const valeur = reponse.headers && reponse.headers.get ? reponse.headers.get("Retry-After") : null;
            if (valeur && /^\d+$/.test(valeur)) reessai = parseInt(valeur, 10);
          } catch (_) {}
          return {statut: reponse.status, donnees, reessai};
        } finally {
          if (garde !== null) annuler(garde);
        }
      } catch (_) {
        return {statut: 0, donnees: null};
      }
    }

    const corpsTexte = objet => ({
      method: "POST",
      headers: {"Content-Type": "text/plain;charset=UTF-8"},
      body: JSON.stringify(objet)
    });

    // Le code ne voyage JAMAIS dans l'adresse d'une requête (journaux de
    // l'hébergeur) : il part dans le corps, comme l'enregistrement.
    function lireParcoursDuServeur(code) {
      return appelSuivi("/api/parcours.php", corpsTexte({code, appli: APPLI, lire: true}));
    }

    function lireIdentiteDuServeur(code) {
      return appelSuivi("/api/eleve.php", corpsTexte({code}));
    }

    function echangerBillet(billet) {
      return appelSuivi("/api/eleve.php", corpsTexte({billet, appli: APPLI}));
    }

    // base_revision : la révision que cet appareil a lue en dernier. Le serveur
    // refuse (409) d'écrire par-dessus un état qu'on n'a pas vu, et le renvoie :
    // on fusionne, on renvoie.
    function paquetParcours(code, source, baseRevision) {
      const paquet = {code, appli: APPLI, parcours: pourServeur(source)};
      if (Number.isInteger(baseRevision)) paquet.base_revision = baseRevision;
      return JSON.stringify(paquet);
    }

    function envoiPossible() {
      return suiviActif() && !sync.detache && !erreurDefinitive;
    }

    // Envoi groupé : jamais plus d'une fois par 700 ms, jamais deux en même temps.
    function envoyerParcours() {
      if (!envoiPossible()) return;
      annulerEnvoiGroupe();
      envoiGroupe = true;
      envoiEnAttente = minuteur(() => {
        envoiEnAttente = null;
        envoiGroupe = false;
        envoyerMaintenant();
      }, ENVOI_GROUPE_MS);
    }

    function annulerEnvoiGroupe() {
      if (envoiEnAttente !== null) annuler(envoiEnAttente);
      envoiEnAttente = null;
      envoiGroupe = false;
    }

    function envoyerMaintenant() {
      if (!envoiPossible()) return;
      if (envoiEnVol) { renvoiDemande = true; return; }
      envoiEnVol = true;
      renvoiDemande = false;
      const code = codeSuivi;
      const base = sync.revision;
      appelSuivi("/api/parcours.php", {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=UTF-8"},
        body: paquetParcours(code, parcours, base)
      }).then(reponse => {
        envoiEnVol = false;
        // Réponse tardive d'un élève qui n'est plus là : elle ne touche à rien.
        if (code !== codeSuivi) return;
        traiterReponseEnvoi(reponse, base);
      });
    }

    function planifierRelance(delai) {
      if (relance !== null) annuler(relance);
      relance = minuteur(() => {
        relance = null;
        if (sync.dirty) envoyerMaintenant();
      }, delai);
    }

    //  200  parti — on note la révision ; du nouveau pendant le vol repart aussitôt ;
    //  409  l'état a bougé ailleurs — fusion avec ce que le serveur renvoie, sa
    //       révision, renvoi (deux fois de suite au plus, puis 10 s) ;
    //  404  le code ne vaut plus rien — détaché, tout est gardé ici ;
    //  400/413  refusé pour de bon — pas de relance ;
    //  429  trop de demandes — on attend ce que le serveur demande (Retry-After) ;
    //  5xx/0  panne ou coupure — relances à 2 s, 10 s, 60 s, puis au retour du
    //       réseau et au prochain démarrage.
    function traiterReponseEnvoi(reponse, base) {
      const donnees = reponse.donnees;
      if (reponse.statut === 200 && donnees && donnees.ok) {
        sync.revision = Number.isInteger(donnees.revision) ? donnees.revision : base + 1;
        // Du nouveau pendant le vol : soit un envoi direct demandé (renvoiDemande),
        // soit un envoi GROUPÉ encore en attente (relecture de Code, lot 1 SPLAT!, repris ici) —
        // dans les deux cas la case n'est pas à jour sur le serveur, « dirty »
        // reste levé, sinon une fermeture d'onglet avant les 700 ms perdrait la
        // dernière série (sendBeacon ne part que si dirty).
        sync.dirty = renvoiDemande || envoiGroupe;
        echecsSuccessifs = 0;
        fusionsSuccessives = 0;
        suiviHorsLigne = false;
        ecrireSync();
        rendre.repere();
        if (suiviIdentite === null) chargerIdentite(codeSuivi);
        if (renvoiDemande) envoyerMaintenant();
        return;
      }
      if (reponse.statut === 409 && donnees && donnees.parcours !== undefined) {
        parcours = fusionner(parcours, normaliser(donnees.parcours));
        sync.revision = Number.isInteger(donnees.revision) ? donnees.revision : base;
        sync.dirty = true;
        sauverCase();
        ecrireSync();
        if (!enJeu()) rendre.parcours();
        fusionsSuccessives += 1;
        if (fusionsSuccessives <= 2) envoyerMaintenant();
        else planifierRelance(10000);
        return;
      }
      if (reponse.statut === 404) {
        detacher();
        return;
      }
      if (reponse.statut === 400 || reponse.statut === 413) {
        erreurDefinitive = true;
        suiviHorsLigne = true;
        rendre.repere();
        try { console.warn("Coffres magiques : envoi refusé par le serveur (" + reponse.statut + ")", donnees); } catch (_) {}
        return;
      }
      suiviHorsLigne = true;
      rendre.repere();
      if (reponse.statut === 429) {
        planifierRelance((reponse.reessai || 60) * 1000);
        return;
      }
      if (echecsSuccessifs < PALIERS_RELANCE_MS.length) planifierRelance(PALIERS_RELANCE_MS[echecsSuccessifs]);
      echecsSuccessifs += 1;
    }

    // À la fermeture de la page, le navigateur se charge de l'envoi tout seul ;
    // sa réponse ne se lit pas : « dirty » reste levé, le prochain démarrage
    // confirmera (au pire par un 409 sans conséquence).
    function envoyerAvantDeFermer() {
      if (!envoiPossible() || !sync.dirty) return;
      annulerEnvoiGroupe();
      const paquet = paquetParcours(codeSuivi, parcours, sync.revision);
      try {
        if (nav && typeof nav.sendBeacon === "function") {
          nav.sendBeacon(SUIVI_URL + "/api/parcours.php", new Blob([paquet], {type: "text/plain;charset=UTF-8"}));
          return;
        }
      } catch (_) {}
      appelSuivi("/api/parcours.php", {method: "POST", headers: {"Content-Type": "text/plain;charset=UTF-8"}, body: paquet});
    }

    // Le parcours a bougé sur cet appareil : on range la case, et sous un code
    // on marque « à envoyer » puis on envoie (groupé).
    function noterChangement() {
      sauverCase();
      if (suiviActif()) {
        sync.dirty = true;
        sync.maj = maintenant();
        ecrireSync();
      }
      envoyerParcours();
    }

    function sauverParcours(nouveau) {
      if (nouveau) parcours = normaliser(nouveau);
      noterChangement();
    }

    // Les gestes de l'appli, par le moteur : la case locale d'abord, le
    // serveur ensuite. Le jour est celui de l'horloge de la page.
    const geste = fn => {
      parcours = fn(parcours, jourLocal(maintenant()));
      noterChangement();
      return parcours;
    };
    function commencerUnePartie(partie) { return geste((p, jour) => commencerPartie(p, partie, jour)); }
    function noterUneCle(operation) { return geste((p, jour) => noterCle(p, operation, jour)); }
    function noterUneErreur(operation) { return geste((p, jour) => noterErreur(p, operation, jour)); }
    function noterUneAide(operation) { return geste((p, jour) => noterAide(p, operation, jour)); }
    function noterUneSolution(operation) { return geste((p, jour) => noterSolution(p, operation, jour)); }
    function noterUnTresor(options) { return geste((p, jour) => noterTresor(p, jour, options)); }
    function oublierLaPartie() { return geste(p => oublierPartie(p)); }

    // Le code a été refusé pour de bon : plus d'envoi, l'élève reste dans SA
    // case, son travail continue de s'y ranger.
    function detacher() {
      sync.detache = true;
      ecrireSync();
      suiviIdentite = null;
      // Un élève détaché n'est plus suivi : plus de niveau ni d'opération
      // fermés pour lui.
      if (codeSuivi) noterReglages(codeSuivi, null);
      suiviHorsLigne = false;
      if (relance !== null) { annuler(relance); relance = null; }
      rendre.repere();
    }

    function reprendreLesEnvois() {
      if (envoiPossible() && sync.dirty) envoyerMaintenant();
    }

    // Les réglages de la classe, tels que le serveur vient de les rendre :
    // rangés dans l'onglet. Vrai s'ils ont changé.
    function noterReglages(code, reglages) {
      const avant = JSON.stringify(reglagesClasse);
      // Un code détaché n'est plus suivi : plus rien de fermé, même si une
      // identité relue arrive après (elle partait avant le 404).
      reglagesClasse = sync.detache ? reglagesDeClasse(null) : reglagesDeClasse(reglages);
      sauverReglagesOnglet(stockageSession(), code, reglagesClasse);
      return JSON.stringify(reglagesClasse) !== avant;
    }

    async function chargerIdentite(code) {
      const reponse = await lireIdentiteDuServeur(code);
      if (code !== codeSuivi) return;
      if (reponse.statut === 200 && reponse.donnees && reponse.donnees.ok) {
        suiviIdentite = {prenom: reponse.donnees.prenom || "", classe: reponse.donnees.classe || ""};
        sauverIdentiteOnglet(stockageSession(), code, suiviIdentite);
        noterReglages(code, reponse.donnees.reglages);
      } else if (reponse.statut === 404) {
        suiviIdentite = null;
        noterReglages(code, null);
      }
      rendre.repere();
      if (!enJeu()) rendre.parcours();
    }

    // L'état du repère, pour que chaque page le dessine : etat ∈ cache
    // (personne n'est suivi), refuse (billet refusé), detache, erreur,
    // hors-ligne, ok ; le texte à lire ; prénom et classe à part.
    function etatRepere() {
      if (!suiviActif() && entreeRefusee) {
        return {etat: "refuse", texte: entreeRefusee === "expire" ? TEXTES.expire : TEXTES.injoignable, prenom: "", classe: ""};
      }
      if (!suiviActif()) return {etat: "cache", texte: "", prenom: "", classe: ""};
      const prenom = prenomAffiche();
      const classe = suiviIdentite && suiviIdentite.classe ? suiviIdentite.classe : "";
      if (sync.detache) return {etat: "detache", texte: TEXTES.detache, prenom, classe};
      if (erreurDefinitive) return {etat: "erreur", texte: TEXTES.erreur, prenom, classe};
      if (suiviHorsLigne) return {etat: "hors-ligne", texte: TEXTES.horsLigne, prenom, classe};
      return {etat: "ok", texte: TEXTES.suivi + (prenom ? " · " + prenom : "") + (classe ? " · " + classe : ""), prenom, classe};
    }

    // Adopter un code en cours de route (après l'échange d'un billet) : la case
    // de ce code, son état d'envoi, et rien de l'état d'avant.
    function adopterCode(code) {
      codeSuivi = code;
      noterDernierGeste(maintenant());
      entreeRefusee = null;
      suiviIdentite = null;
      suiviHorsLigne = false;
      erreurDefinitive = false;
      echecsSuccessifs = 0;
      fusionsSuccessives = 0;
      parcours = charger(stockage(), codeSuivi);
      sync = chargerSync(stockage(), codeSuivi);
      reglagesClasse = chargerReglagesOnglet(stockageSession(), codeSuivi);
      rendre.repere();
      rendre.parcours();
    }

    // L'entrée par un billet : l'échange d'abord, puis tout se passe comme si le
    // code était dans l'onglet. Un billet refusé laisse la page sans code et le dit.
    async function entrerParBillet(billet) {
      billetEnCours = true;
      rendre.parcours();
      const reponse = await echangerBillet(billet);
      billetEnCours = false;
      const donnees = reponse.statut === 200 && reponse.donnees && reponse.donnees.ok ? reponse.donnees : null;
      const code = donnees && donnees.type === "entree" ? normaliserCode(donnees.code || "") : "";
      if (!codeValide(code)) {
        entreeRefusee = reponse.statut === 404 || donnees ? "expire" : "injoignable";
        rendre.repere();
        if (!enJeu()) rendre.parcours();
        direPret(false);
        return false;
      }
      // Les réglages de la classe d'abord : adopterCode() les relit de
      // l'onglet, l'appli doit les connaître avant de proposer ses choix.
      sauverReglagesOnglet(stockageSession(), code, reglagesDeClasse(donnees.reglages));
      adopterCode(code);
      suiviIdentite = {prenom: donnees.prenom || "", classe: donnees.classe || ""};
      sauverIdentiteOnglet(stockageSession(), code, suiviIdentite);
      demarrerSuivi();
      return true;
    }

    // « Se déconnecter » : on envoie ce qui restait, on oublie le code, on
    // revient à la case sans code (celle de l'élève reste sur l'appareil), puis
    // l'espace élève oublie lui aussi ce code dans cet onglet (?oublier=1).
    function quitterSuivi() {
      envoyerAvantDeFermer();
      if (relance !== null) { annuler(relance); relance = null; }
      annulerEnvoiGroupe();
      codeSuivi = "";
      entreeRefusee = null;
      suiviIdentite = null;
      suiviHorsLigne = false;
      erreurDefinitive = false;
      echecsSuccessifs = 0;
      fusionsSuccessives = 0;
      gardeVisible = false;
      gardeErreur = "";
      gardeEssais = 0;
      noterDernierGeste(maintenant());
      effacerCode(stockageSession());
      reglagesClasse = reglagesDeClasse(null);
      parcours = charger(stockage(), "");
      sync = chargerSync(stockage(), "");
      rendre.repere();
      rendre.garde();
      rendre.parcours();
      try { fenetre.location.assign(SUIVI_URL + "/?oublier=1"); } catch (_) {}
    }

    // Le garde-fou de temps (Défi tables, lot « appareil partagé ») : après dix
    // minutes sans un geste, ou quand la page redevient visible après une aussi
    // longue absence, on redemande « C'est toujours toi ? » — et il faut RETAPER
    // le code (comparaison locale, aucun appel) ; trois erreurs rendent l'onglet
    // au camarade suivant. L'instant du dernier geste vit dans l'ONGLET (un F5 ne
    // remet pas le compteur à zéro), sous la clé de Défi tables.
    function lireDernierGeste() {
      try {
        const onglet = stockageSession();
        const brut = onglet ? onglet.getItem(CLE_DERNIER_GESTE) : null;
        if (brut !== null && brut !== "") {
          const lu = Number(brut);
          if (Number.isFinite(lu) && lu >= 0 && lu <= maintenant()) return lu;
        }
      } catch (_) {}
      return maintenant();
    }

    function noterDernierGeste(instant) {
      derniereActivite = instant;
      try {
        const onglet = stockageSession();
        if (onglet) onglet.setItem(CLE_DERNIER_GESTE, String(instant));
      } catch (_) {}
    }

    let derniereActivite = lireDernierGeste();
    let gardeVisible = false;
    let gardeEssais = 0;
    let gardeErreur = "";

    function absenceTropLongue() {
      return suiviActif() && maintenant() - derniereActivite > GARDE_INACTIVITE_MS;
    }

    function verifierGarde() {
      if (gardeVisible || !absenceTropLongue()) return false;
      gardeVisible = true;
      gardeEssais = 0;
      gardeErreur = "";
      rendre.garde();
      return true;
    }

    function retenir(evenement) {
      if (!evenement || typeof evenement.preventDefault !== "function") return;
      evenement.preventDefault();
      if (typeof evenement.stopPropagation === "function") evenement.stopPropagation();
    }

    // À brancher sur pointerdown / keydown / touchstart (capture). `dansLaGarde`
    // dit si le geste vise la question elle-même : tant qu'elle est posée, seuls
    // ses boutons répondent.
    function noterActivite(evenement, dansLaGarde) {
      if (gardeVisible) {
        if (!dansLaGarde) retenir(evenement);
        return;
      }
      if (absenceTropLongue()) {
        retenir(evenement);
        verifierGarde();
        return;
      }
      noterDernierGeste(maintenant());
    }

    function nettoyerCodeSaisi(brut) {
      let propre = "";
      const base = normaliserCode(brut);
      for (let i = 0; i < base.length; i += 1) if (ALPHABET_CODE.indexOf(base[i]) >= 0) propre += base[i];
      return propre;
    }

    function repondreGarde(cestMoi, codeTape) {
      if (!cestMoi) {
        gardeErreur = "";
        gardeEssais = 0;
        quitterSuivi();
        return false;
      }
      if (nettoyerCodeSaisi(codeTape) === codeSuivi && suiviActif()) {
        gardeVisible = false;
        gardeErreur = "";
        gardeEssais = 0;
        noterDernierGeste(maintenant());
        rendre.garde();
        return true;
      }
      gardeEssais += 1;
      if (gardeEssais >= GARDE_ESSAIS_MAX) {
        gardeErreur = "";
        gardeEssais = 0;
        quitterSuivi();
        return false;
      }
      gardeErreur = "Ce n’est pas le bon code.";
      rendre.garde();
      return false;
    }

    // Les écouteurs de la page : retour du réseau et retour du cache arrière-
    // avant (ce qui attendait part), fermeture (sendBeacon), gestes et
    // visibilité (la garde), un contrôle par minute.
    let branche = false;
    function brancher() {
      if (branche) return;
      branche = true;
      try {
        if (fenetre && typeof fenetre.addEventListener === "function") {
          fenetre.addEventListener("online", reprendreLesEnvois);
          fenetre.addEventListener("pageshow", evenement => { if (evenement && evenement.persisted) reprendreLesEnvois(); });
          fenetre.addEventListener("pagehide", envoyerAvantDeFermer);
        }
        if (doc && typeof doc.addEventListener === "function") {
          doc.addEventListener("visibilitychange", () => {
            if (doc.visibilityState === "hidden") envoyerAvantDeFermer();
            if (doc.visibilityState === "visible") verifierGarde();
          });
          ["pointerdown", "keydown", "touchstart"].forEach(type => {
            doc.addEventListener(type, evenement => {
              const cible = evenement && evenement.target;
              const dansLaGarde = Boolean(cible && typeof cible.closest === "function" && cible.closest("[data-suivi-garde]"));
              noterActivite(evenement, dansLaGarde);
            }, true);
          });
        }
        if (fenetre && typeof fenetre.setInterval === "function") fenetre.setInterval(verifierGarde, 60000);
      } catch (_) {}
      verifierGarde();
      rendre.garde();
    }

    // Au démarrage sous un code : le serveur fait foi, fusion D3 avec la case du
    // code, renvoi seulement si cet appareil apporte quelque chose.
    function demarrerSuivi() {
      if (!suiviActif()) { direPret(false); return; }
      sauverCode(stockageSession(), codeSuivi);
      // Du travail dans la case et aucune révision confirmée : à envoyer.
      if (!sync.detache && sync.revision === 0 && !sync.dirty && !estVide(parcours)) {
        sync.dirty = true;
        ecrireSync();
      }
      rendre.repere();
      if (sync.detache) { direPret(false); return; }
      chargerIdentite(codeSuivi);
      const code = codeSuivi;
      lireParcoursDuServeur(code).then(reponse => {
        if (code !== codeSuivi) { direPret(false); return; }
        if (reponse.statut === 404) {
          detacher();
          if (!enJeu()) rendre.parcours();
          direPret(false);
          return;
        }
        suiviHorsLigne = reponse.statut !== 200 || !reponse.donnees || !reponse.donnees.ok;
        if (!suiviHorsLigne && reponse.donnees.existe) {
          const distant = normaliser(reponse.donnees.parcours);
          const fusion = fusionner(parcours, distant);
          sync.revision = Number.isInteger(reponse.donnees.revision) ? reponse.donnees.revision : 0;
          const apporte = sync.dirty || JSON.stringify(pourServeur(fusion)) !== JSON.stringify(pourServeur(distant));
          parcours = fusion;
          sauverCase();
          sync.dirty = apporte;
          ecrireSync();
          if (apporte) envoyerParcours();
        } else if (!suiviHorsLigne) {
          sync.revision = 0;
          ecrireSync();
          if (!estVide(parcours)) { sync.dirty = true; ecrireSync(); envoyerParcours(); }
        } else if (sync.dirty) {
          planifierRelance(2000);
        }
        rendre.repere();
        if (!enJeu()) rendre.parcours();
        direPret(!suiviHorsLigne);
      });
    }

    // Tout en un, pour une page : brancher les écouteurs, puis entrer (billet
    // ou code d'onglet). Rend une promesse qui se résout quand on sait qui joue.
    async function demarrer() {
      brancher();
      if (ENTREE.billet) return entrerParBillet(ENTREE.billet);
      demarrerSuivi();
      return suiviActif();
    }

    // Les réglages de la classe tels qu'on les connaît (null = tout ouvert) et
    // la partie en cours de la case, pour que l'appli décide quoi montrer.
    function reglagesOuverts() { return reglagesClasse; }
    function partieEnCours() { return parcours && parcours.partie ? cloner(parcours.partie) : null; }

    return {
      get codeSuivi() { return codeSuivi; },
      get parcours() { return parcours; },
      get sync() { return sync; },
      get suiviHorsLigne() { return suiviHorsLigne; },
      get suiviIdentite() { return suiviIdentite; },
      get erreurDefinitive() { return erreurDefinitive; },
      get entreeRefusee() { return entreeRefusee; },
      get billetEnCours() { return billetEnCours; },
      // {niveaux, operations} : null = tout ouvert ; sinon la liste des
      // numéros ouverts à la classe. Tout ouvert sans code, à la déconnexion
      // et au détachement.
      get reglagesClasse() { return reglagesClasse; },
      pret: () => pret,
      get gardeVisible() { return gardeVisible; },
      get gardeErreur() { return gardeErreur; },
      ENTREE, TEXTES, GARDE_INACTIVITE_MS, GARDE_ESSAIS_MAX,
      suiviActif, prenomAffiche, etatRepere,
      appelSuivi, echangerBillet, lireParcoursDuServeur, paquetParcours,
      envoyerParcours, envoyerMaintenant, envoyerAvantDeFermer,
      sauverParcours, commencerUnePartie, noterUneCle, noterUneErreur, noterUneAide, noterUneSolution, noterUnTresor, oublierLaPartie,
      demarrer, demarrerSuivi, entrerParBillet, adopterCode, quitterSuivi, brancher, reglagesOuverts, partieEnCours,
      verifierGarde, noterActivite, repondreGarde
    };
  }

  return Object.freeze({
    VERSION,
    APPLI,
    SUIVI_URL,
    CLE_STOCKAGE,
    CLE_SYNC,
    CLE_SEL,
    CLE_CODE,
    CLE_IDENTITE,
    CLE_REGLAGES,
    CLE_DERNIER_GESTE,
    OPERATIONS,
    CLES_OPERATIONS,
    NIVEAUX,
    NOMBRE_NIVEAUX,
    NOMBRE_OPERATIONS,
    CLES_PAR_TRESOR,
    COFFRES,
    MATCHS_GLOUBI,
    CRANS_GLOUBI,
    CLES_SERVEUR,
    MOTIF_NIVEAUX_PHP,
    TEXTES,
    GARDE_INACTIVITE_MS,
    GARDE_ESSAIS_MAX,
    ENVOI_GROUPE_MS,
    ITERATIONS_EMPREINTE,
    LONGUEUR_EMPREINTE,
    LONGUEUR_CODE,
    DUREE_CONSERVATION_MS,
    jourLocal,
    operationParNumero,
    operationParCle,
    nommerOperations,
    creer,
    normaliser,
    normaliserPartie,
    estVide,
    meilleurePartie,
    fusionner,
    commencerPartie,
    noterCle,
    noterErreur,
    noterAide,
    noterSolution,
    noterTresor,
    oublierPartie,
    cranDeDepart,
    cranSuivant,
    coffresDuNiveau,
    matchsRestants,
    cranGloubi,
    noterMatchGloubi,
    cheminDesCoffres,
    progressionDesNiveaux,
    niveauxDebloques,
    pourServeur,
    resumeProf,
    resumeTuile,
    JOURNAL,
    resumeSuivi,
    reglagesDeClasse,
    niveauOuvert,
    operationOuverte,
    niveauxOuverts,
    operationsOuvertes,
    partieCompatible,
    chargerReglagesOnglet,
    sauverReglagesOnglet,
    sha256Hex,
    selAppareil,
    empreinteCode,
    cleStockage,
    charger,
    sauver,
    effacer,
    cleSync,
    chargerSync,
    sauverSync,
    effacerSync,
    purger,
    clesRevelentUnCode,
    normaliserCode,
    codeValide,
    chargerCode,
    sauverCode,
    effacerCode,
    nettoyerPrenom,
    chargerIdentiteOnglet,
    sauverIdentiteOnglet,
    lireEntree,
    creerClient
  });
});
