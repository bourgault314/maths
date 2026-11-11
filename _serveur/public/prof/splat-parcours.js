(function initMathsGoSplatParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MathsGoSplatParcours = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // Le moteur partagé du parcours élève de l'univers SPLAT! (lot 1 « moteur »
  // du chantier SPLAT! ↔ suivi, 07/10/2026 — conception D2, D3, D4).
  //
  // Il est chargé par la carte des mondes (outils/splat_univers.html) et par
  // les trois outils du parcours (splat.html, splat_tache_barre.html,
  // equasplat.html), et copié octet pour octet dans _serveur/public/prof/
  // pour « Ma classe ». Il porte trois choses, et rien d'autre :
  //
  //  1. LE FORMAT du parcours (ce que le serveur enregistre, une ligne par
  //     élève et par appli) : { version, epoque, etapes: { <parcours>: étape } }
  //     où une étape est { fait, etoiles, cartes, vues, essais, date, idx? }.
  //       fait    : l'étoile — série finie sans carte rouge restante (la même
  //                 chose que la carte des mondes) ;
  //       etoiles : cartes réussies du premier coup, dans la meilleure série ;
  //       cartes  : taille de la série ;
  //       vues    : cartes dont la réponse a été montrée (3e essai, « Passer »)
  //                 — la donnée nouvelle, celle que demande le professeur ;
  //       essais  : séries commencées sur cette étape ;
  //       date    : jour de la première réussite (ou du dernier passage tant
  //                 que ce n'est pas fait) ;
  //       idx     : carte atteinte quand une série est en cours (absent sinon).
  //     « La meilleure série gagne » (D3) : une entrée n'est remplacée que par
  //     une meilleure — fait d'abord, puis vues le plus petit, puis etoiles le
  //     plus grand. C'est aussi la règle de fusion entre deux appareils.
  //     Le détail d'une série en cours (enCours{sig, idx, etoiles, res}) sert à
  //     la reprise sur CET appareil : il reste dans la case locale, il n'est
  //     JAMAIS envoyé (des chaînes : le serveur les refuserait, et une reprise
  //     vaut le temps d'un appareil).
  //
  //  2. LE RANGEMENT LOCAL PAR CODE, repris de Défi tables : la clé sans code
  //     « mathsgo-splat-parcours » est celle d'aujourd'hui (son contenu
  //     d'aujourd'hui — un objet par parcours {fait, etoiles, cartes, date,
  //     enCours} — se lit tel quel) ; sous un code, une case par empreinte du
  //     code (sel de l'appareil + SHA-256, jamais le code en clair dans une
  //     clé), et un état d'envoi à côté (mathsgo-splat-sync). L'identité
  //     (code, prénom, classe) vit dans l'ONGLET, sous les MÊMES clés que Défi
  //     tables : un élève identifié l'est pour les deux applis.
  //
  //  3. LE CLIENT DU SUIVI (creerClient), repris du bloc « suivi de classe »
  //     de Défi tables avec appli: "splat" : échange de billet, lecture du
  //     parcours du serveur, envoi groupé 700 ms, sendBeacon à la fermeture,
  //     200/409/404/429/400/413/5xx, relances 2 s / 10 s / 60 s, « Se
  //     déconnecter » → ?oublier=1, garde d'inactivité 10 min. Une seule
  //     implémentation, que chaque page habille (bandeau, pastille).
  //
  //  4. LES MONDES OUVERTS À LA CLASSE (lot « splat-suivi-5 », 08/10/2026) :
  //     le professeur peut n'ouvrir que certains mondes à une classe. Le
  //     serveur les rend avec l'identité (api/eleve.php, « reglages.splat.
  //     mondes ») ; le client les range dans l'ONGLET, liés au code
  //     (mathsgo-splat-mondes), à chaque lecture de l'identité, et les oublie
  //     avec le code. La carte grise les mondes fermés ; « Étape suivante »
  //     (assets/js/splat-etapes.js, qui relit la même clé) ne les propose
  //     plus. Sans code : tout reste ouvert.
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
  const VERSION = 2;
  const APPLI = "splat";
  const SUIVI_URL = "https://suivi.mathsgo.re";

  const CLE_STOCKAGE = "mathsgo-splat-parcours";
  const CLE_SYNC = "mathsgo-splat-sync";
  const CLE_SEL = "mathsgo-splat-sel";
  // Les clés d'onglet de Défi tables, volontairement les mêmes.
  const CLE_CODE = "mathsgo-suivi-code";
  const CLE_IDENTITE = "mathsgo-suivi-identite";
  // Lot « splat-suivi-5 » : les mondes ouverts à la classe de l'élève, dans
  // l'onglet, liés à son code : {code, mondes: [1, 2]} — « mondes: null » ou
  // pas de clé = tous ouverts. assets/js/splat-etapes.js la lit aussi.
  const CLE_MONDES = "mathsgo-splat-mondes";
  const CLE_DERNIER_GESTE = "mathsgo-suivi-dernier-geste";

  // LA CARTE DES MONDES, RÉDUITE à ce que le suivi doit en savoir : pour
  // chaque parcours, son numéro sur la carte (14, ou « 11d » pour un Bonus) et
  // le numéro de son monde — ETAPES puis BONUS de assets/js/splat-etapes.js,
  // dans cet ordre, SANS les titres.
  //
  // Lot 3 « serveur + tuile » (07/10/2026) : resumeProf a besoin de savoir à
  // quel monde appartient chaque étape. Les pages du site le lui donnent depuis
  // splat-etapes.js ; les pages du serveur de suivi (la tuile de l'espace élève,
  // puis « Ma classe ») n'ont que ce moteur, copié dans _serveur/public/prof/.
  // Copier aussi splat-etapes.js là-bas obligerait à redéposer un fichier par
  // FTP à chaque retouche d'un titre ou d'un monde « en préparation » : le
  // moteur porte donc la carte sans ce qui bouge souvent. Elle ne change que
  // si une étape naît, change de numéro ou de monde — et alors la liste fermée
  // du serveur change aussi (motif de lib/applis.php).
  // tests/splat-parcours.test.mjs compare ces lignes à splat-etapes.js et
  // affiche la liste à recopier au premier écart.
  //
  // Échauffement du monde 6 (14/10/2026) : trois étapes avant la 38, comptées
  // comme les autres (« ⭐ 0 / 9 », « sur 40 »). Leur numéro est un code, « É1 »,
  // comme « 11d » pour un Bonus : la 38 reste la 38. Le lot 2 « suivi » les met
  // ici et dans le motif du serveur AVANT que la carte les ait (lot 3), pour
  // qu'aucune étoile d'échauffement ne soit retirée par le serveur.
  const MONDES = Object.freeze([
    Object.freeze([1, "Petit SPLAT!"]),
    Object.freeze([2, "SPLAT! Classique"]),
    Object.freeze([3, "SPLAT! Enquête"]),
    Object.freeze([4, "SPLAT! Système"]),
    Object.freeze([5, "SPLAT! Équations"]),
    Object.freeze([6, "SPLAT! Relatifs"])
  ]);
  // [parcours, numéro sur la carte (ou code « É1 »), numéro du monde]
  const CARTE_ETAPES = Object.freeze([
    ["m1e1", 1, 1], ["m1e2", 2, 1], ["m1e3", 3, 1], ["m1e4", 4, 1], ["m1e5", 5, 1], ["m1e6", 6, 1],
    ["m2e1", 7, 2], ["m2e4", 8, 2], ["m2e5", 9, 2],
    ["enq10", 10, 3], ["enq11", 11, 3], ["enq12", 12, 3], ["enq13", 13, 3], ["enq14", 14, 3],
    ["enq15", 15, 3], ["enq16", 16, 3], ["enq17", 17, 3], ["enq18", 18, 3], ["enq19", 19, 3],
    ["enq20", 20, 3], ["enq21", 21, 3], ["enq22", 22, 3], ["enq23", 23, 3], ["enq24", 24, 3],
    ["sys25", 25, 4], ["sys26", 26, 4], ["sys27", 27, 4], ["sys28", 28, 4],
    ["m3e1", 35, 5], ["m3e2", 36, 5], ["m3e4", 37, 5],
    ["ech1", "É1", 6], ["ech2", "É2", 6], ["ech3", "É3", 6],
    ["m4e1", 38, 6], ["m4e2", 39, 6], ["m4e3", 40, 6], ["m4e4", 41, 6], ["m4e5", 42, 6], ["m4e6", 43, 6]
  ].map(Object.freeze));
  // [parcours, code du Bonus, numéro du monde]
  const CARTE_BONUS = Object.freeze([
    ["enq11d", "11d", 3], ["enq12d", "12d", 3], ["enq13d", "13d", 3], ["enq16d", "16d", 3], ["enq17d", "17d", 3],
    ["enq18d", "18d", 3], ["enq20d", "20d", 3], ["enq22d", "22d", 3], ["enq19d", "19d", 3], ["enq24d", "24d", 3],
    ["sys25d", "25d", 4], ["sys26d", "26d", 4], ["sys27d", "27d", 4], ["sys28d", "28d", 4]
  ].map(Object.freeze));

  // Les mêmes lignes au format de splat-etapes.js — [parcours, numéro, titre,
  // monde, numéro du monde] —, le titre vide : c'est ce que resumeProf lit
  // quand on ne lui donne pas la carte (les pages du serveur de suivi).
  const nomDuMonde = numero => {
    const monde = MONDES.find(m => m[0] === numero);
    return monde ? monde[1] : "";
  };
  const CARTE = Object.freeze({
    MONDES,
    ETAPES: Object.freeze(CARTE_ETAPES.map(e => Object.freeze([e[0], e[1], "", nomDuMonde(e[2]), e[2]]))),
    BONUS: Object.freeze(CARTE_BONUS.map(b => Object.freeze([b[0], b[1], "", nomDuMonde(b[2]), b[2]])))
  });

  // La liste fermée des parcours sous lesquels un outil SPLAT! enregistre une
  // série : les étapes puis les Bonus de la carte ci-dessus, dans cet ordre.
  // Le motif PHP du serveur (lib/applis.php) se recopie de motifPhp() ;
  // tests/suivi-splat-serveur.test.mjs échoue si les deux diffèrent.
  const PARCOURS_VALIDES = Object.freeze(CARTE_ETAPES.map(e => e[0]).concat(CARTE_BONUS.map(b => b[0])));
  const ENSEMBLE_VALIDES = new Set(PARCOURS_VALIDES);

  // Les clés que le serveur devra déclarer pour « splat » (lib/applis.php) :
  // tout ce que pourServeur() écrit, et rien d'autre.
  const CLES_SERVEUR = Object.freeze(["version", "epoque", "etapes", "fait", "etoiles", "cartes", "vues", "essais", "date", "idx",
    "jours", "journal", "series", "reussies", "depuis"]);

  function motifPhp() {
    return "/^(?:" + PARCOURS_VALIDES.join("|") + ")$/";
  }

  const ETATS = Object.freeze({vide: "vide", cours: "cours", reussie: "reussie", aide: "aide"});
  const COMPTE_MAX = 1000;
  const ESSAIS_MAX = 1000000;
  const RESULTATS_MAX = 200;

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
  // matin) — la même règle que Défi tables, et pas « toISOString().slice(0, 10) »
  // qu'écrivaient les outils jusqu'ici.
  function jourLocal(instant) {
    const d = instant instanceof Date ? instant : new Date(typeof instant === "number" ? instant : Date.now());
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function dateLaPlusAncienne(premiere, seconde) {
    if (!premiere) return seconde || null;
    if (!seconde) return premiere;
    return premiere <= seconde ? premiere : seconde;
  }

  function dateLaPlusRecente(premiere, seconde) {
    if (!premiere) return seconde || null;
    if (!seconde) return premiere;
    return premiere >= seconde ? premiere : seconde;
  }

  function parcoursIdValide(valeur) {
    return typeof valeur === "string" && /^[a-z0-9]{1,24}$/i.test(valeur);
  }

  // ------------------------------------------------------------- le format

  function creer() {
    return {version: VERSION, epoque: 0, etapes: {}};
  }

  function etapeVide() {
    return {fait: false, etoiles: 0, cartes: 0, vues: 0, essais: 0, date: null};
  }

  // Le détail d'une série en cours, local seulement : l'empreinte de la série
  // (sig), la prochaine carte (idx), les cartes réussies du premier coup
  // (etoiles) et la pastille de chaque carte jouée (res : true, false, "ko",
  // null). C'est exactement ce que les outils écrivaient et relisaient jusqu'ici.
  function normaliserEnCours(brut) {
    if (!brut || typeof brut !== "object") return null;
    const idx = entier(brut.idx, 0, COMPTE_MAX, 0);
    if (!idx) return null;
    const res = Array.isArray(brut.res)
      ? brut.res.slice(0, RESULTATS_MAX).map(r => (r === true || r === false || r === "ko" ? r : null))
      : [];
    const enCours = {
      sig: typeof brut.sig === "string" ? brut.sig.slice(0, 400) : "",
      idx,
      // ÉquaSplat écrivait « resolues » là où les deux autres outils écrivent
      // « etoiles » : les deux se lisent.
      etoiles: entier(brut.etoiles !== undefined ? brut.etoiles : brut.resolues, 0, COMPTE_MAX, 0),
      res
    };
    // Lot S1 : les réponses vues de cette série déjà portées au journal
    // (local, comme le reste de la reprise ; absent : aucune) — chacune n'y
    // entre qu'une fois.
    const vj = entier(brut.vj, 0, COMPTE_MAX, 0);
    if (vj) enCours.vj = vj;
    return enCours;
  }

  function vuesDe(res) {
    return res.filter(r => r === "ko").length;
  }

  // ------------------------------------------------------------- le journal
  //
  // Lot S1 « les journaux » (07/11/2026, chantier « Suivre ses élèves ») :
  // une entrée par JOUR où l'élève a joué, pour que le professeur sache ce
  // qu'il a fait chaque jour (la fiche toutes applis, lot S2). Trois listes
  // d'entiers alignées sur `jours` (les 60 derniers jours joués) :
  //   series    les séries commencées ce jour-là (comptées comme `essais`) ;
  //   reussies  les séries finies avec l'étoile ce jour-là ;
  //   vues      les réponses montrées ce jour-là (3e essai, « Passer »).
  // -1 : pas connu (une donnée abîmée). Ni heure, ni calcul, ni réponse.
  // `depuis` : le premier jour où ce parcours a tenu son journal — avant,
  // on ne sait pas (le lot S2 ne compte pas ces jours-là pour « rien fait »).
  // Fusion : un jour vu de deux appareils prend le PLUS GRAND de chaque
  // colonne, jamais la somme (refusionner doublerait) ; un nombre connu bat
  // « pas connu » (-1 est le plus petit) ; puis les 60 jours les plus
  // récents. Le plus grand ne dépend ni de l'ordre ni du nombre de fusions :
  // refusionner avec l'une ou l'autre copie ne change plus rien. Le léger
  // sous-compte quand deux appareils servent le même jour est accepté.
  // Le journal n'existe qu'à partir du premier jour joué : un parcours qui
  // n'a rien fait depuis le lot S1 n'a ni `jours`, ni `journal`, ni `depuis`.
  const JOURNAL = Object.freeze(["series", "reussies", "vues"]);
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

  // Ce qu'un geste ajoute au journal du jour : [séries, réussies, vues].
  // Une colonne « pas connue » reste pas connue tant qu'on n'y ajoute rien.
  // `joue` : l'élève a répondu ce jour-là — le jour est noté même si rien ne
  // s'ajoute (une série commencée la veille et continuée aujourd'hui :
  // correctif S1, relecture de Codex).
  function ajouterAuJournal(p, jour, ajouts, joue = false) {
    if (!joue && !ajouts.some(n => n > 0)) return p;
    const lignes = lignesDuJournal(p.jours, p.journal);
    const ligne = lignes.find(l => l.jour === jour);
    if (ligne) ligne.entree = ligne.entree.map((valeur, index) => (ajouts[index] > 0 ? Math.min(JOURNAL_MAX, Math.max(0, valeur) + ajouts[index]) : valeur));
    else lignes.push({jour, entree: ajouts.map(n => Math.min(JOURNAL_MAX, Math.max(0, n)))});
    return poserJournal(p, lignes, dateLaPlusAncienne(p.depuis || null, jour));
  }

  // Une entrée telle qu'un outil l'a écrite — format d'aujourd'hui ({fait,
  // etoiles, cartes, date} et/ou {enCours}) ou format D2 — devient une étape
  // complète. Rend null pour une entrée qui ne dit rien.
  function normaliserEtape(brut) {
    if (!brut || typeof brut !== "object") return null;
    const enCours = normaliserEnCours(brut.enCours);
    const fait = brut.fait === true;
    const etape = etapeVide();
    etape.fait = fait;
    etape.cartes = entier(brut.cartes, 0, COMPTE_MAX, 0);
    if (fait) {
      etape.etoiles = entier(brut.etoiles, 0, COMPTE_MAX, 0);
      etape.vues = entier(brut.vues, 0, COMPTE_MAX, 0);
    } else {
      // Pas d'étoile : ce que l'entrée dit de la série en cours — le format D2
      // (idx, etoiles, vues au niveau de l'étape) d'abord, sinon l'ancien
      // enCours des outils.
      const idx = entier(brut.idx, 0, COMPTE_MAX, 0) || (enCours ? enCours.idx : 0);
      if (idx) etape.idx = idx;
      etape.etoiles = entier(brut.etoiles, 0, COMPTE_MAX, enCours ? enCours.etoiles : 0);
      etape.vues = entier(brut.vues, 0, COMPTE_MAX, enCours ? vuesDe(enCours.res) : 0);
    }
    etape.date = dateOuNull(brut.date);
    const commencee = fait || Boolean(etape.idx) || Boolean(enCours);
    etape.essais = entier(brut.essais, 0, ESSAIS_MAX, commencee ? 1 : 0);
    if (!etape.fait && !etape.idx && !enCours && !etape.essais) return null;
    if (enCours) etape.enCours = enCours;
    return etape;
  }

  // Accepte le format D2 ({version, epoque, etapes}) ET le contenu d'aujourd'hui
  // de la clé « mathsgo-splat-parcours » (un objet par parcours, à plat).
  function normaliser(brut) {
    const p = creer();
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return p;
    const enveloppe = brut.etapes && typeof brut.etapes === "object" && !Array.isArray(brut.etapes);
    const source = enveloppe ? brut.etapes : brut;
    if (enveloppe) p.epoque = entier(brut.epoque, 0, ESSAIS_MAX, 0);
    Object.keys(source).forEach(id => {
      if (!parcoursIdValide(id)) return;
      const etape = normaliserEtape(source[id]);
      if (etape) p.etapes[id] = etape;
    });
    if (enveloppe) poserJournal(p, lignesDuJournal(brut.jours, brut.journal), brut.depuis);
    return p;
  }

  function estVide(parcours) {
    return !parcours || !parcours.etapes || Object.keys(parcours.etapes).length === 0;
  }

  // La meilleure de deux étapes : fait d'abord, puis vues le plus petit, puis
  // etoiles le plus grand ; à égalité, la première (celle qu'on a déjà).
  function meilleure(a, b) {
    if (!a) return b || null;
    if (!b) return a;
    if (a.fait !== b.fait) return a.fait ? a : b;
    if (a.vues !== b.vues) return a.vues < b.vues ? a : b;
    if (a.etoiles !== b.etoiles) return a.etoiles > b.etoiles ? a : b;
    return a;
  }

  // Deux étapes du même parcours (deux appareils, ou le serveur et la case) :
  // la meilleure donne fait/etoiles/cartes/vues ; essais prend le maximum (deux
  // appareils portent le même parcours, pas deux moitiés à additionner) ; la
  // date est la plus ancienne des réussites, ou le dernier passage tant que ce
  // n'est pas fait ; une série en cours ne remplace jamais une étape faite ; la
  // reprise locale (enCours) suit, elle ne vient jamais du serveur.
  function fusionnerEtape(a, b) {
    if (!a || !b) return cloner(a || b);
    const gagnante = meilleure(a, b);
    const autre = gagnante === a ? b : a;
    const fusion = etapeVide();
    fusion.fait = gagnante.fait;
    fusion.etoiles = gagnante.etoiles;
    fusion.cartes = gagnante.cartes;
    fusion.vues = gagnante.vues;
    fusion.essais = Math.max(a.essais, b.essais);
    if (a.fait && b.fait) fusion.date = dateLaPlusAncienne(a.date, b.date);
    else if (fusion.fait) fusion.date = gagnante.date;
    else fusion.date = dateLaPlusRecente(a.date, b.date);
    if (!fusion.fait) {
      const idx = gagnante.idx || autre.idx || 0;
      if (idx) fusion.idx = idx;
    }
    const enCours = a.enCours || b.enCours || null;
    if (enCours) fusion.enCours = cloner(enCours);
    return fusion;
  }

  // Une remise à zéro ou une restauration par le professeur (lib/progression.php
  // relève l'époque) gagne EN BLOC : à époque différente, la plus haute l'emporte
  // entièrement. Sans cela, « la meilleure série gagne » ferait revenir tout ce
  // qu'on vient d'effacer dès qu'un autre appareil se synchronise.
  function fusionner(premier, second) {
    const a = normaliser(premier);
    const b = normaliser(second);
    if (a.epoque !== b.epoque) return a.epoque > b.epoque ? a : b;
    const fusion = creer();
    fusion.epoque = a.epoque;
    const ids = Object.keys(a.etapes);
    Object.keys(b.etapes).forEach(id => { if (!(id in a.etapes)) ids.push(id); });
    ids.forEach(id => {
      fusion.etapes[id] = fusionnerEtape(a.etapes[id] || null, b.etapes[id] || null);
    });
    // Le journal (lot S1) : l'union des jours, le plus grand de chaque
    // colonne le même jour, et le plus ancien `depuis`.
    poserJournal(fusion, [...lignesDuJournal(a.jours, a.journal), ...lignesDuJournal(b.jours, b.journal)],
      dateLaPlusAncienne(a.depuis || null, b.depuis || null));
    return normaliser(fusion);
  }

  // Une série finie. `fait` : plus aucune carte rouge ; `etoiles` : réussies du
  // premier coup ; `cartes` : la taille de la série ; `vues` : réponses montrées.
  // L'entrée n'est remplacée que si la série est meilleure ; `essais` compte
  // UNE fois chaque série (comptée au premier enregistrerEnCours si elle en a
  // eu un, sinon ici) ; la reprise locale s'efface : la série est finie.
  function enregistrerSerie(parcours, parcoursId, serie, aujourdhui) {
    const p = normaliser(parcours);
    if (!parcoursIdValide(parcoursId) || !serie || typeof serie !== "object") return p;
    const jour = dateOuNull(aujourdhui) || jourLocal();
    const avant = p.etapes[parcoursId] || etapeVide();
    const nouvelle = etapeVide();
    nouvelle.fait = serie.fait === true;
    nouvelle.etoiles = entier(serie.etoiles, 0, COMPTE_MAX, 0);
    nouvelle.cartes = entier(serie.cartes, 0, COMPTE_MAX, 0);
    nouvelle.vues = entier(serie.vues, 0, COMPTE_MAX, 0);
    nouvelle.date = jour;
    const dejaComptee = Boolean(avant.enCours);
    // Le journal du jour (lot S1) : une série de plus si elle n'a pas déjà
    // été comptée en commençant, une étoile si elle est faite, et les
    // réponses vues qui n'y sont pas encore.
    ajouterAuJournal(p, jour, [dejaComptee ? 0 : 1, nouvelle.fait ? 1 : 0,
      Math.max(0, nouvelle.vues - (dejaComptee ? avant.enCours.vj || 0 : 0))], true);
    const gagnante = meilleure(avant, nouvelle);
    const etape = etapeVide();
    etape.fait = gagnante.fait;
    etape.etoiles = gagnante.etoiles;
    etape.cartes = gagnante.cartes;
    etape.vues = gagnante.vues;
    etape.essais = Math.min(ESSAIS_MAX, avant.essais + (dejaComptee ? 0 : 1));
    if (etape.fait) etape.date = avant.fait ? dateLaPlusAncienne(avant.date, jour) : jour;
    else etape.date = jour;
    p.etapes[parcoursId] = etape;
    return p;
  }

  // Une série en cours : la carte atteinte (idx), les cartes réussies du premier
  // coup, les réponses montrées, la taille de la série ; `sig` et `res` servent
  // à la reprise sur cet appareil et restent locaux. Une nouvelle série (pas de
  // reprise en cours, ou une autre empreinte) compte un essai. Jamais par-dessus
  // une étape faite : son étoile, ses comptes et sa date ne bougent pas.
  function enregistrerEnCours(parcours, parcoursId, etat, aujourdhui) {
    const p = normaliser(parcours);
    if (!parcoursIdValide(parcoursId) || !etat || typeof etat !== "object") return p;
    const idx = entier(etat.idx, 0, COMPTE_MAX, 0);
    if (idx < 1) return p;
    const jour = dateOuNull(aujourdhui) || jourLocal();
    const avant = p.etapes[parcoursId] || etapeVide();
    const enCours = normaliserEnCours({sig: etat.sig, idx, etoiles: etat.etoiles, res: etat.res});
    const memeSerie = Boolean(avant.enCours) && (etat.sig === undefined || avant.enCours.sig === enCours.sig);
    // Le journal du jour (lot S1) : une série de plus quand elle commence,
    // et les réponses vues depuis la dernière note (chacune une fois : `vj`).
    const vuesDejaNotees = memeSerie ? avant.enCours.vj || 0 : 0;
    const vuesMaintenant = entier(etat.vues, 0, COMPTE_MAX, vuesDe(enCours.res));
    if (Math.max(vuesDejaNotees, vuesMaintenant)) enCours.vj = Math.max(vuesDejaNotees, vuesMaintenant);
    // Une réponse de plus (la carte atteinte ou les pastilles ont bougé) : le
    // jour est un jour joué, même pour une série commencée la veille.
    const avance = !memeSerie || avant.enCours.idx !== idx || JSON.stringify(avant.enCours.res) !== JSON.stringify(enCours.res);
    ajouterAuJournal(p, jour, [memeSerie ? 0 : 1, 0, Math.max(0, vuesMaintenant - vuesDejaNotees)], avance);
    const etape = cloner(avant);
    etape.essais = Math.min(ESSAIS_MAX, avant.essais + (memeSerie ? 0 : 1));
    if (!etape.fait) {
      etape.idx = idx;
      etape.etoiles = entier(etat.etoiles, 0, COMPTE_MAX, enCours.etoiles);
      etape.cartes = entier(etat.cartes, 0, COMPTE_MAX, avant.cartes);
      etape.vues = entier(etat.vues, 0, COMPTE_MAX, vuesDe(enCours.res));
      etape.date = jour;
    }
    etape.enCours = enCours;
    p.etapes[parcoursId] = etape;
    return p;
  }

  // « Rejouer toute la série » : la reprise s'efface, l'étoile reste.
  function effacerEnCours(parcours, parcoursId) {
    const p = normaliser(parcours);
    const etape = p.etapes[parcoursId];
    if (!etape) return p;
    delete etape.enCours;
    if (!etape.fait) delete etape.idx;
    return p;
  }

  // vide : jamais commencée · cours : commencée, pas d'étoile · reussie :
  // l'étoile, sans réponse montrée · aide : l'étoile, avec des réponses montrées.
  function etatEtape(parcours, parcoursId) {
    const etape = parcours && parcours.etapes ? parcours.etapes[parcoursId] : null;
    if (!etape) return ETATS.vide;
    if (etape.fait) return etape.vues > 0 ? ETATS.aide : ETATS.reussie;
    return etape.idx || etape.essais || etape.enCours ? ETATS.cours : ETATS.vide;
  }

  // Ce qui part au serveur : la version, l'époque et, pour chaque parcours de la
  // liste fermée, les sept nombres/booléens/date de l'étape — jamais enCours,
  // jamais un parcours inconnu (le serveur le jetterait de toute façon).
  function pourServeur(parcours) {
    const p = normaliser(parcours);
    const sortie = {version: VERSION, epoque: p.epoque, etapes: {}};
    PARCOURS_VALIDES.forEach(id => {
      const etape = p.etapes[id];
      if (!etape) return;
      const e = {fait: etape.fait, etoiles: etape.etoiles, cartes: etape.cartes, vues: etape.vues, essais: etape.essais, date: etape.date};
      if (!etape.fait && etape.idx) e.idx = etape.idx;
      sortie.etapes[id] = e;
    });
    if (p.jours) {
      sortie.jours = p.jours.slice();
      sortie.journal = cloner(p.journal);
      sortie.depuis = p.depuis;
    }
    return sortie;
  }

  // ------------------------------------------------------- la vue du professeur

  function lignes(brut) {
    return (Array.isArray(brut) ? brut : [])
      .map(ligne => (Array.isArray(ligne)
        ? {parcours: ligne[0], numero: ligne[1], titre: ligne[2], monde: ligne[3], numeroMonde: ligne[4]}
        : ligne))
      .filter(ligne => ligne && typeof ligne.parcours === "string");
  }

  // Par monde : étapes faites / total, réussites avec réponses vues, étapes en
  // cours, et l'état du monde (vide / cours / fini — fini quand ses étapes sont
  // faites, bonus ou pas, comme la carte) ; les Bonus comptés à part ; l'état de
  // chaque parcours. `etapes` et `bonus` : ETAPES et BONUS de splat-etapes.js ;
  // sans eux (les pages du serveur de suivi, qui n'ont que ce moteur), la carte
  // réduite du moteur — mêmes parcours, mêmes numéros, mêmes mondes.
  function resumeProf(parcours, etapes, bonus) {
    if (etapes === undefined) etapes = CARTE.ETAPES;
    if (bonus === undefined) bonus = CARTE.BONUS;
    const p = normaliser(parcours);
    const etats = {};
    const compter = liste => {
      const compte = {total: liste.length, faits: 0, aides: 0, cours: 0};
      liste.forEach(ligne => {
        const etat = etatEtape(p, ligne.parcours);
        etats[ligne.parcours] = etat;
        if (etat === ETATS.reussie || etat === ETATS.aide) compte.faits += 1;
        if (etat === ETATS.aide) compte.aides += 1;
        if (etat === ETATS.cours) compte.cours += 1;
      });
      return compte;
    };
    const E = lignes(etapes);
    const B = lignes(bonus);
    const mondes = [];
    const mondeDe = ligne => {
      let monde = mondes.find(m => m.numero === ligne.numeroMonde);
      if (!monde) {
        monde = {numero: ligne.numeroMonde, nom: typeof ligne.monde === "string" ? ligne.monde : "", etapes: [], bonus: []};
        mondes.push(monde);
      }
      return monde;
    };
    E.forEach(ligne => mondeDe(ligne).etapes.push(ligne));
    B.forEach(ligne => mondeDe(ligne).bonus.push(ligne));
    const total = compter(E);
    const totalBonus = compter(B);
    const resumeMondes = mondes.map(monde => {
      const c = compter(monde.etapes);
      const cb = compter(monde.bonus);
      const etat = c.total && c.faits === c.total ? "fini"
        : (c.faits || c.cours || cb.faits || cb.cours ? "cours" : "vide");
      return {numero: monde.numero, nom: monde.nom, total: c.total, faits: c.faits, aides: c.aides, cours: c.cours,
        bonus: {total: cb.total, faits: cb.faits, aides: cb.aides, cours: cb.cours}, etat};
    });
    return {
      total: total.total, faits: total.faits, aides: total.aides, cours: total.cours,
      bonus: {total: totalBonus.total, faits: totalBonus.faits, aides: totalBonus.aides, cours: totalBonus.cours},
      mondes: resumeMondes,
      etapes: etats
    };
  }

  // --------------------------------------- pour « Suivre ses élèves » (S2)
  //
  // Lot S1 « les journaux » (07/11/2026) : la même fonction, avec la même
  // forme de réponse, dans les cinq moteurs suivis (Défi tables, Coffres
  // magiques, Anzan, Défi calcul, SPLAT!). La page du professeur l'appellera
  // au lot S2 ; rien ne l'affiche encore. Des nombres, des dates et des codes,
  // jamais une phrase : c'est la page qui écrit.
  //   resumeSuivi(parcours, {aujourdhui}) → {
  //     appli, aujourdhui,
  //     debut        le lundi d'il y a trois semaines (les 4 dernières semaines) ;
  //     connuDepuis  null : rien n'est coupé ; une date : les jours d'avant ne
  //                  sont pas connus (journal commencé ce jour-là, ou borne) ;
  //     dernier      le dernier jour de travail connu (null : aucun) ;
  //     jours        [{jour, lignes: [{…nombres}]}] — les jours de travail de
  //                  debut à aujourdhui, du plus ancien au plus récent (un
  //                  jour futur, horloge fausse, n'y est pas) ; null dans une
  //                  ligne : pas connu ;
  //     aider        [{type, …}] ce qui est « à aider » maintenant ;
  //     feliciter    [{type, …}] ce qui est « à féliciter » cette semaine }
  // L'absence (rien depuis 7 jours, toutes applis confondues) se calcule
  // dans la page : une appli seule ne le sait pas.
  // SPLAT! : un jour de travail = un jour du journal (une série y a été
  // jouée) ; une ligne par jour {series, reussies, vues} ; à aider : des
  // réponses vues cette semaine ({type: "reponses-vues", vues}) ; à
  // féliciter : un monde fini cette semaine ({type: "monde", monde}).
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
    const jours = lignes.filter(l => l.jour >= debut).map(l => ({
      jour: l.jour,
      lignes: [{series: nombre(l.entree[0]), reussies: nombre(l.entree[1]), vues: nombre(l.entree[2])}]
    }));
    // Le dernier jour : le journal, ou à défaut les dates des étapes (le jour
    // de la première étoile, ou du dernier passage) — un élève qui n'a rien
    // joué depuis le lot S1 a quand même un dernier jour.
    let dernier = lignes.length ? lignes[lignes.length - 1].jour : null;
    Object.keys(p.etapes).forEach(id => {
      const date = p.etapes[id].date;
      if (date && date <= aujourdhui && (!dernier || date > dernier)) dernier = date;
    });
    // Connu depuis : le premier jour du journal (et, la borne des 60 jours
    // atteinte, le plus ancien jour gardé) ; un parcours qui a joué sans
    // journal (avant le lot S1) : rien de connu jusqu'à aujourd'hui compris.
    let connuDepuis = null;
    if (p.depuis) connuDepuis = p.jours.length >= JOURNAL_JOURS && p.jours[0] > p.depuis ? p.jours[0] : p.depuis;
    else if (!estVide(p)) connuDepuis = jourPlus(aujourdhui, 1);
    const vues = lignes.filter(l => l.jour >= lundi).reduce((somme, l) => somme + Math.max(0, l.entree[2]), 0);
    const aider = vues ? [{type: "reponses-vues", vues}] : [];
    const feliciter = [];
    CARTE.MONDES.forEach(([numero]) => {
      const etapes = CARTE.ETAPES.filter(e => e[4] === numero).map(e => p.etapes[e[0]]);
      if (!etapes.length || !etapes.every(e => e && e.fait)) return;
      const fin = etapes.reduce((plusTard, e) => (e.date && e.date > plusTard ? e.date : plusTard), "");
      if (fin >= lundi && fin <= aujourdhui) feliciter.push({type: "monde", monde: numero});
    });
    return {appli: APPLI, aujourdhui, debut, connuDepuis, dernier, jours, aider, feliciter};
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
        stockage.removeItem(CLE_MONDES);
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

  // ------------------------------------------- les mondes ouverts à la classe
  //
  // Ce que le serveur rend (reglages.splat.mondes) → la liste des mondes
  // OUVERTS, triée, sans doublon, de 1 au nombre de mondes de la carte ; null
  // quand ils le sont tous — ou quand la réponse ne dit rien de lisible : dans
  // le doute, on ouvre (un monde ouvert à tort se joue, un monde fermé à tort
  // bloque un élève).
  function mondesDeReglages(reglages) {
    const liste = reglages && typeof reglages === "object" && reglages.splat && typeof reglages.splat === "object"
      ? reglages.splat.mondes : null;
    if (!Array.isArray(liste)) return null;
    const nombre = MONDES.length;
    const vus = [];
    liste.forEach(monde => {
      if (Number.isInteger(monde) && monde >= 1 && monde <= nombre && vus.indexOf(monde) < 0) vus.push(monde);
    });
    if (!vus.length || vus.length === nombre) return null;
    return vus.sort((a, b) => a - b);
  }

  // Un monde (numéro de la carte) est-il ouvert ? mondes = null : tous.
  function mondeOuvert(mondes, numero) {
    return !Array.isArray(mondes) || mondes.indexOf(numero) >= 0;
  }

  function chargerMondesOnglet(stockage, code) {
    try {
      const propre = normaliserCode(code || "");
      const brut = stockage && codeValide(propre) ? stockage.getItem(CLE_MONDES) : null;
      if (!brut) return null;
      const lu = JSON.parse(brut);
      if (!lu || typeof lu !== "object" || lu.code !== propre) return null;
      return mondesDeReglages({splat: {mondes: lu.mondes}});
    } catch (_) {
      return null;
    }
  }

  function sauverMondesOnglet(stockage, code, mondes) {
    try {
      const propre = normaliserCode(code || "");
      if (!stockage || !codeValide(propre)) return false;
      if (!Array.isArray(mondes)) stockage.removeItem(CLE_MONDES);
      else stockage.setItem(CLE_MONDES, JSON.stringify({code: propre, mondes}));
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
  //         horloge (Date), rendre: {parcours(), repere(), garde()}, enSerie() }
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
    const enSerie = typeof o.enSerie === "function" ? o.enSerie : () => false;
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
    // Les mondes ouverts à la classe : ceux que l'onglet a gardés, en attendant
    // la relecture de l'identité (à chaque ouverture de page).
    let mondesOuverts = chargerMondesOnglet(stockageSession(), codeSuivi);
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
      // Lot « code en cases » (exigence de l'audit GPT, F01) : pendant que
      // « C'est toujours toi ? » est posée — ou dès que l'absence a assez duré
      // pour qu'elle le soit —, RIEN ne part : ni envoi groupé, ni relance, ni
      // envoi de fermeture d'onglet. Le travail reste rangé ici et part quand
      // l'élève a retapé son code (ou à sa prochaine entrée sur cet appareil).
      return suiviActif() && !sync.detache && !erreurDefinitive && !envoisRetenus();
    }

    // try : appelée avant que la garde soit déclarée plus bas, elle répond « non ».
    function envoisRetenus() {
      try { return gardeVisible || absenceTropLongue(); } catch (_) { return false; }
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
        // soit un envoi GROUPÉ encore en attente (relecture de Code, lot 1 SPLAT!) —
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
        if (!enSerie()) rendre.parcours();
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
        try { console.warn("SPLAT! : envoi refusé par le serveur (" + reponse.statut + ")", donnees); } catch (_) {}
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

    // Les trois gestes des outils, par le moteur : la case locale d'abord, le
    // serveur ensuite. Le jour est celui de l'horloge de la page.
    function noterSerie(parcoursId, serie) {
      parcours = enregistrerSerie(parcours, parcoursId, serie, jourLocal(maintenant()));
      noterChangement();
      return parcours;
    }

    function noterEnCours(parcoursId, etat) {
      parcours = enregistrerEnCours(parcours, parcoursId, etat, jourLocal(maintenant()));
      noterChangement();
      return parcours;
    }

    function oublierEnCours(parcoursId) {
      parcours = effacerEnCours(parcours, parcoursId);
      noterChangement();
      return parcours;
    }

    // Le code a été refusé pour de bon : plus d'envoi, l'élève reste dans SA
    // case, son travail continue de s'y ranger.
    function detacher() {
      sync.detache = true;
      ecrireSync();
      suiviIdentite = null;
      // Un élève détaché n'est plus suivi : plus de mondes fermés pour lui.
      if (codeSuivi) noterMondes(codeSuivi, null);
      suiviHorsLigne = false;
      if (relance !== null) { annuler(relance); relance = null; }
      rendre.repere();
    }

    function reprendreLesEnvois() {
      if (envoiPossible() && sync.dirty) envoyerMaintenant();
    }

    // Les mondes ouverts à la classe, tels que le serveur vient de les rendre :
    // rangés dans l'onglet (pour « Étape suivante » et le retour sur la carte).
    // Vrai s'ils ont changé.
    function noterMondes(code, reglages) {
      const avant = JSON.stringify(mondesOuverts);
      // Un code détaché n'est plus suivi : plus de mondes fermés, même si une
      // identité relue arrive après (elle partait avant le 404).
      mondesOuverts = sync.detache ? null : mondesDeReglages(reglages);
      sauverMondesOnglet(stockageSession(), code, mondesOuverts);
      return JSON.stringify(mondesOuverts) !== avant;
    }

    async function chargerIdentite(code) {
      const reponse = await lireIdentiteDuServeur(code);
      if (code !== codeSuivi) return;
      if (reponse.statut === 200 && reponse.donnees && reponse.donnees.ok) {
        suiviIdentite = {prenom: reponse.donnees.prenom || "", classe: reponse.donnees.classe || ""};
        sauverIdentiteOnglet(stockageSession(), code, suiviIdentite);
        noterMondes(code, reponse.donnees.reglages);
      } else if (reponse.statut === 404) {
        suiviIdentite = null;
        noterMondes(code, null);
      }
      rendre.repere();
      if (!enSerie()) rendre.parcours();
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
      mondesOuverts = chargerMondesOnglet(stockageSession(), codeSuivi);
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
        if (!enSerie()) rendre.parcours();
        return false;
      }
      // Les mondes ouverts à la classe d'abord : adopterCode() redessine la
      // carte, elle doit les connaître (sinon elle s'ouvre puis se grise).
      sauverMondesOnglet(stockageSession(), code, mondesDeReglages(donnees.reglages));
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
      mondesOuverts = null;
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
      return suiviActif() && maintenant() - derniereActivite >= GARDE_INACTIVITE_MS;
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
        // Ce qui attendait pendant la question part maintenant (le démarrage
        // remis à après la question relit le serveur et envoie lui-même).
        if (demarrageEnAttente) demarrerSuivi();
        else if (sync.dirty) envoyerParcours();
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
          // Lot « code en cases » : le clic et le clic du milieu aussi (un lien
      // s'ouvre parfois sans « pointerdown » ; repris de l'audit GPT).
      ["pointerdown", "keydown", "touchstart", "click", "auxclick"].forEach(type => {
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
    // Démarrage remis à après la question (relecture GPT, D01) ; var : lue
    // avant que cette ligne ne soit passée, elle vaut « non ».
    var demarrageEnAttente = false;
    function demarrerSuivi() {
      if (!suiviActif()) return;
      sauverCode(stockageSession(), codeSuivi);
      // Du travail dans la case et aucune révision confirmée : à envoyer.
      if (!sync.detache && sync.revision === 0 && !sync.dirty && !estVide(parcours)) {
        sync.dirty = true;
        ecrireSync();
      }
      rendre.repere();
      if (sync.detache) return;
      // Lot « code en cases », relecture GPT (D01) : rouverte (F5, adresse
      // retapée) alors que la question est due, l'appli ne relit RIEN au serveur
      // — ni l'identité, ni le parcours, ni l'évaluation : le démarrage attend le
      // bon code (repondreGarde le relance).
      if (envoisRetenus()) { demarrageEnAttente = true; return; }
      demarrageEnAttente = false;
      chargerIdentite(codeSuivi);
      const code = codeSuivi;
      lireParcoursDuServeur(code).then(reponse => {
        if (code !== codeSuivi) return;
        if (reponse.statut === 404) {
          detacher();
          if (!enSerie()) rendre.parcours();
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
        if (!enSerie()) rendre.parcours();
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

    return {
      get codeSuivi() { return codeSuivi; },
      get parcours() { return parcours; },
      get sync() { return sync; },
      get suiviHorsLigne() { return suiviHorsLigne; },
      get suiviIdentite() { return suiviIdentite; },
      get erreurDefinitive() { return erreurDefinitive; },
      get entreeRefusee() { return entreeRefusee; },
      get billetEnCours() { return billetEnCours; },
      // null = tous les mondes ouverts ; sinon la liste des mondes ouverts à
      // la classe. Remise à null sans code, à la déconnexion et au détachement.
      get mondesOuverts() { return mondesOuverts; },
      get gardeVisible() { return gardeVisible; },
      get gardeErreur() { return gardeErreur; },
      ENTREE, TEXTES, GARDE_INACTIVITE_MS, GARDE_ESSAIS_MAX,
      suiviActif, prenomAffiche, etatRepere,
      appelSuivi, echangerBillet, lireParcoursDuServeur, paquetParcours,
      envoyerParcours, envoyerMaintenant, envoyerAvantDeFermer,
      sauverParcours, noterSerie, noterEnCours, oublierEnCours,
      demarrer, demarrerSuivi, entrerParBillet, adopterCode, quitterSuivi, brancher,
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
    CLE_MONDES,
    CLE_DERNIER_GESTE,
    PARCOURS_VALIDES,
    CARTE,
    CLES_SERVEUR,
    ETATS,
    TEXTES,
    GARDE_INACTIVITE_MS,
    GARDE_ESSAIS_MAX,
    ENVOI_GROUPE_MS,
    ITERATIONS_EMPREINTE,
    LONGUEUR_EMPREINTE,
    LONGUEUR_CODE,
    DUREE_CONSERVATION_MS,
    motifPhp,
    jourLocal,
    creer,
    normaliser,
    normaliserEtape,
    estVide,
    meilleure,
    fusionnerEtape,
    fusionner,
    enregistrerSerie,
    enregistrerEnCours,
    effacerEnCours,
    etatEtape,
    pourServeur,
    resumeProf,
    JOURNAL,
    resumeSuivi,
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
    mondesDeReglages,
    mondeOuvert,
    chargerMondesOnglet,
    sauverMondesOnglet,
    lireEntree,
    creerClient
  });
});
