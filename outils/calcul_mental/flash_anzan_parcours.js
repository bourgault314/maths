(function initMathsGoFlashAnzanParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MathsGoFlashAnzanParcours = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // Le moteur du parcours élève d'Anzan (lot « Qui voit quoi », lot 4a,
  // 23/10/2026), sur le modèle de celui de Coffres magiques
  // (assets/js/coffres-parcours.js) : chargé par l'appli
  // (outils/calcul_mental/flash_anzan.html) et copié octet pour octet dans
  // _serveur/public/prof/ pour l'espace élève (la tuile) et « Ma classe ». Il
  // porte trois choses, et rien d'autre :
  //
  //  1. LE FORMAT du parcours (ce que le serveur enregistre, une ligne par
  //     élève) — rien que des nombres, des dates et des mots d'une liste
  //     fermée :
  //       { version, epoque,
  //         reglages: { mode, flash: {operations, chiffresMin, chiffresMax,
  //                     nombres, temps, calculs, son}, colonne: {operations,
  //                     chiffresMin, chiffresMax, nombres, limite, calculs} }
  //                     — les derniers réglages de l'élève, par mode, et le
  //                     mode choisi : ils le suivent d'un appareil à l'autre
  //                     (sans code, ils restent dans le localStorage de la
  //                     page, comme au lot 1) ;
  //         seances:  { "1": [jour, mode, operations, chiffresMin, chiffresMax,
  //                     nombres, temps, calculs, faits, score, id, ordre], "2": … }
  //                     — une SÉANCE = une liste de douze scalaires dans un
  //                     ordre fixe (SEANCE_CHAMPS) : le jour (« AAAA-MM-JJ »),
  //                     le mode, les réglages joués (« temps » est le temps par
  //                     nombre en dixièmes de seconde en Flash, la limite en
  //                     secondes en Colonne), le nombre de calculs PRÉVUS, le
  //                     nombre de calculs FAITS, le score (réponses justes) et
  //                     un IDENTIFIANT (un entier tiré au hasard par la page
  //                     quand la séance commence) : c'est lui qui dit « c'est
  //                     la même séance » — pas les réglages, puisqu'une élève
  //                     fait souvent plusieurs séances de suite aux mêmes
  //                     réglages (relecture de Code, 23/10/2026) — et son
  //                     ORDRE : le plus grand ordre que le parcours connaît,
  //                     plus un, donné quand la séance y entre et qui ne change
  //                     plus (ni son jour : celui où elle a commencé). C'est lui
  //                     qui range les séances, sur tous les appareils de la même
  //                     façon (relectures Codex du 24/10/2026) — sans heure et
  //                     sans l'horloge : une tablette à la mauvaise date ou une
  //                     séance qui passe minuit ne dérangent rien.
  //                     Une séance arrêtée en route (la flèche, l'onglet fermé)
  //                     a moins de calculs faits que prévus : c'est ce que
  //                     l'historique écrit « 6/7 · arrêtée » — pas de booléen
  //                     à part (choix du 23/10 : on compte des CALCULS, pas des
  //                     séances, puisqu'une séance fait 5, 10 ou 20 calculs).
  //                     Pourquoi une liste et pas un objet : le serveur compte
  //                     les CLÉS (2 000 au plus par progression) ; un objet par
  //                     séance en coûterait dix, une liste une seule. Rien
  //                     d'autre n'est envoyé : ni heure, ni calculs posés, ni
  //                     réponses, ni temps de réponse. }
  //     Les SEANCES_MAX dernières séances sont gardées (≈ deux années de
  //     classe à une séance par jour) ; au-delà, la plus ancienne part.
  //     UN SEUL ORDRE pour tout (historique, borne, numéros, fusion) :
  //     l'ordre, puis l'identifiant — jamais le jour. Les numéros ne sont que des
  //     places, toujours 1, 2, 3… dans cet ordre : deux appareils qui ont les
  //     mêmes séances ont exactement le même parcours, octet pour octet.
  //     Fusion entre deux appareils (et avec le serveur) : à époque différente
  //     la plus haute gagne en bloc (restauration par le professeur, lib/
  //     progression.php) ; sinon union des séances par IDENTIFIANT — la même
  //     séance vue deux fois garde le plus de calculs faits — et réglages =
  //     ceux du rang le plus haut (voir fusionner).
  //
  //  2. LE RANGEMENT LOCAL PAR CODE, repris de Coffres, SPLAT! et Défi tables :
  //     la clé sans code « mathsgo-anzan-parcours » est celle de l'appareil ;
  //     sous un code, une case par empreinte du code (sel de l'appareil +
  //     SHA-256, jamais le code en clair dans une clé) et un état d'envoi à
  //     côté (mathsgo-anzan-sync). L'identité (code, prénom, classe) vit dans
  //     l'ONGLET, sous les MÊMES clés que Défi tables, SPLAT! et Coffres : un
  //     élève identifié l'est pour toutes les applis.
  //
  //  3. LE CLIENT DU SUIVI (creerClient), celui de Coffres avec appli:
  //     "flash-anzan" : échange de billet, lecture du parcours du serveur,
  //     envoi groupé 700 ms, sendBeacon à la fermeture (« dirty » gardé pendant
  //     un envoi en vol), 200/409/404/429/400/413/5xx, relances 2 s / 10 s /
  //     60 s, « Se déconnecter » → ?oublier=1, garde d'inactivité 10 min. Une
  //     promesse `pret` dit quand le serveur a été lu : l'appli attend de
  //     connaître les réglages du compte avant de les dessiner.
  //
  // Anzan n'a pas de réglage de classe (ni mondes, ni niveaux) : rien de la
  // partie « réglages de la classe » de Coffres n'est repris.
  //
  // Logique pure : ni DOM ni réseau en dehors de creerClient, qui reçoit tout
  // (window, document, navigator, fetch, stockages, horloge) en paramètre —
  // c'est ainsi que les tests l'exécutent dans node avec un faux monde.

  const VERSION = 1;
  const APPLI = "flash-anzan";
  const SUIVI_URL = "https://suivi.mathsgo.re";

  const CLE_STOCKAGE = "mathsgo-anzan-parcours";
  const CLE_SYNC = "mathsgo-anzan-sync";
  const CLE_SEL = "mathsgo-anzan-sel";
  // Les clés d'onglet de Défi tables, de SPLAT! et de Coffres, volontairement les mêmes.
  const CLE_CODE = "mathsgo-suivi-code";
  const CLE_IDENTITE = "mathsgo-suivi-identite";
  const CLE_DERNIER_GESTE = "mathsgo-suivi-dernier-geste";

  // Les bornes des réglages : celles de flash_anzan_core.js, recopiées (la
  // page prof charge ce moteur seul) ; tests/flash-anzan-parcours.test.mjs
  // vérifie qu'elles sont les mêmes.
  const MODES = Object.freeze(["flash", "colonne"]);
  const OPERATIONS = Object.freeze(["plus", "plusmoins"]);
  const SONS = Object.freeze(["aucun", "bip"]);
  const CALCULS = Object.freeze([5, 10, 20]);
  const CHIFFRES = Object.freeze({min: 1, max: 5});
  const NOMBRES = Object.freeze({min: 2, max: 30});
  const TEMPS = Object.freeze([...Array.from({length: 20}, (_, i) => i + 1), 25, 30, 35, 40, 45, 50]);
  const LIMITES = Object.freeze([0, 10, 15, 20, 30, 45, 60]);
  const DEFAUTS = Object.freeze({
    flash: Object.freeze({operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 10, temps: 8, calculs: 10, son: "bip"}),
    colonne: Object.freeze({operations: "plusmoins", chiffresMin: 3, chiffresMax: 3, nombres: 8, limite: 0, calculs: 10})
  });

  // Une séance : les douze champs, dans cet ordre, et rien d'autre.
  const SEANCE_CHAMPS = Object.freeze(["jour", "mode", "operations", "chiffresMin", "chiffresMax", "nombres", "temps", "calculs", "faits", "score", "id", "ordre"]);
  // L'identifiant d'une séance : un entier de 1 à ID_MAX (sous la borne des
  // entiers du serveur), tiré par la page au début de la séance.
  const ID_MAX = 999999;
  // L'ordre d'une séance : un entier de 1 à ORDRE_MAX (la borne des entiers du
  // serveur, lib/progression.php) — un million de séances, jamais atteint.
  const ORDRE_MAX = 1000000;
  // D8 (conception du 22/10/2026) : 500 séances ≈ 30 ko, sous la borne du serveur.
  const SEANCES_MAX = 500;
  const NUMERO_MAX = 9999;

  // Ce que lib/applis.php doit déclarer pour « flash-anzan » : les clés (à
  // toute profondeur), les mots et le motif des numéros de séance. Un test
  // compare le texte du catalogue à ces trois listes.
  const CLES_SERVEUR = Object.freeze(["version", "epoque", "reglages", "rang", "mode", "flash", "colonne",
    "operations", "chiffresMin", "chiffresMax", "nombres", "temps", "limite", "calculs", "son", "seances"]);
  const MOTS_SERVEUR = Object.freeze(["flash", "colonne", "plus", "plusmoins", "aucun", "bip"]);
  const MOTIF_SEANCES_PHP = "/^[1-9]\\d{0,3}$/";
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
    // L'année 0000 n'existe pas pour le serveur (checkdate) : il retirerait la
    // date, et la séance disparaîtrait au retour (3e relecture Codex, 24/10/2026).
    if (annee < 1 || mois < 1 || mois > 12 || jour < 1) return null;
    const dernier = new Date(Date.UTC(annee, mois, 0)).getUTCDate();
    return jour <= dernier ? valeur : null;
  }

  // Le jour LOCAL de l'appareil (à la Réunion, le jour UTC bascule à 4 h du
  // matin) — la même règle que Défi tables, SPLAT! et Coffres.
  function jourLocal(instant) {
    const d = instant instanceof Date ? instant : new Date(typeof instant === "number" ? instant : Date.now());
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function dans(liste, valeur, defaut) {
    return liste.indexOf(valeur) >= 0 ? valeur : defaut;
  }

  // ------------------------------------------------------------- le format

  function creer() {
    return {version: VERSION, epoque: 0, reglages: {}, seances: {}};
  }

  // Les réglages d'un mode, propres : la même règle que flash_anzan_core.js
  // (normaliser) — rien d'inconnu ne passe, les bornes tiennent, « de » reste
  // sous « à ».
  function normaliserReglagesMode(mode, brut) {
    const m = dans(MODES, mode, "flash");
    const d = DEFAUTS[m];
    const b = brut && typeof brut === "object" && !Array.isArray(brut) ? brut : {};
    const chiffresMin = entier(b.chiffresMin, CHIFFRES.min, CHIFFRES.max, d.chiffresMin);
    let chiffresMax = entier(b.chiffresMax, CHIFFRES.min, CHIFFRES.max, d.chiffresMax);
    if (chiffresMin > chiffresMax) chiffresMax = chiffresMin;
    const r = {
      operations: dans(OPERATIONS, b.operations, d.operations),
      chiffresMin,
      chiffresMax,
      nombres: entier(b.nombres, NOMBRES.min, NOMBRES.max, d.nombres),
      calculs: dans(CALCULS, b.calculs, d.calculs)
    };
    if (m === "flash") {
      r.temps = dans(TEMPS, b.temps, d.temps);
      r.son = dans(SONS, b.son, d.son);
    } else {
      r.limite = dans(LIMITES, b.limite, d.limite);
    }
    return r;
  }

  // Les réglages du parcours : {} tant que l'élève n'en a pas choisi (la page
  // prend alors ses valeurs de départ) ; sinon le mode et les deux modes, et
  // leur RANG : +1 à chaque changement (sauverReglages). En fusion, le rang le
  // plus haut gagne — sans lui, un appareil resté sur d'anciens réglages les
  // réécrivait sur le compte à sa réouverture (relecture Codex, 23/10/2026).
  function normaliserReglages(brut) {
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return {};
    const r = {};
    if (MODES.indexOf(brut.mode) >= 0) r.mode = brut.mode;
    MODES.forEach(mode => {
      if (brut[mode] && typeof brut[mode] === "object") r[mode] = normaliserReglagesMode(mode, brut[mode]);
    });
    if (!Object.keys(r).length) return {};
    const rang = entier(brut.rang, 0, COMPTE_MAX, 0);
    if (rang) r.rang = rang;
    return r;
  }

  function rangDesReglages(reglages) {
    return reglages && Number.isInteger(reglages.rang) ? reglages.rang : 0;
  }

  function numeroValide(valeur) {
    return Number.isInteger(valeur) && valeur >= 1 && valeur <= NUMERO_MAX;
  }

  // Une séance lisible, dans l'objet {jour, mode, operations, …} ; null sinon.
  // Une séance sans calcul fait n'en est pas une.
  function normaliserSeance(brut) {
    const liste = Array.isArray(brut) ? brut : (brut && typeof brut === "object" ? SEANCE_CHAMPS.map(champ => brut[champ]) : null);
    if (!liste || liste.length < SEANCE_CHAMPS.length) return null;
    const s = {};
    SEANCE_CHAMPS.forEach((champ, i) => { s[champ] = liste[i]; });
    s.jour = dateOuNull(s.jour);
    if (!s.jour || MODES.indexOf(s.mode) < 0 || OPERATIONS.indexOf(s.operations) < 0) return null;
    s.chiffresMin = entier(s.chiffresMin, 0, CHIFFRES.max + 1, 0);
    s.chiffresMax = entier(s.chiffresMax, 0, CHIFFRES.max + 1, 0);
    if (s.chiffresMin < CHIFFRES.min || s.chiffresMax > CHIFFRES.max || s.chiffresMin > s.chiffresMax) return null;
    s.nombres = entier(s.nombres, 0, NOMBRES.max + 1, 0);
    if (s.nombres < NOMBRES.min || s.nombres > NOMBRES.max) return null;
    s.temps = entier(s.temps, -1, COMPTE_MAX, -1);
    if ((s.mode === "flash" ? TEMPS : LIMITES).indexOf(s.temps) < 0) return null;
    if (CALCULS.indexOf(s.calculs) < 0) return null;
    s.faits = entier(s.faits, 0, s.calculs, 0);
    if (!s.faits) return null;
    s.score = entier(s.score, 0, s.faits, 0);
    if (!Number.isInteger(s.id) || s.id < 1 || s.id > ID_MAX) return null;
    if (!Number.isInteger(s.ordre) || s.ordre < 1 || s.ordre > ORDRE_MAX) return null;
    return s;
  }

  // La séance telle qu'elle part au serveur : la liste.
  function seanceEnListe(s) {
    return SEANCE_CHAMPS.map(champ => s[champ]);
  }

  // Les réglages d'une séance, au format de la page (temps ou limite).
  function reglagesDeSeance(s) {
    const r = {operations: s.operations, chiffresMin: s.chiffresMin, chiffresMax: s.chiffresMax, nombres: s.nombres, calculs: s.calculs};
    if (s.mode === "flash") r.temps = s.temps; else r.limite = s.temps;
    return r;
  }

  const I_JOUR = SEANCE_CHAMPS.indexOf("jour");
  const I_FAITS = SEANCE_CHAMPS.indexOf("faits");
  const I_SCORE = SEANCE_CHAMPS.indexOf("score");
  const I_ID = SEANCE_CHAMPS.indexOf("id");
  const I_ORDRE = SEANCE_CHAMPS.indexOf("ordre");

  // Les numéros d'un parcours, en ordre croissant.
  function numeros(p) {
    return Object.keys(p.seances).map(Number).filter(numeroValide).sort((a, b) => a - b);
  }

  // L'ORDRE DU TEMPS, le seul du moteur : l'ordre de la séance, puis son
  // identifiant (deux appareils hors ligne qui ont pris le même ordre). Le
  // JOUR n'y entre pas : il vient de l'horloge de l'appareil, et une tablette
  // à la mauvaise date faisait sortir une séance neuve des 500 dès son entrée
  // (4e relecture Codex, 24/10/2026). Le numéro non plus : une place, qui ne
  // se compare pas d'un appareil à l'autre (3e relecture). L'ordre, lui,
  // voyage avec la séance et ne change jamais.
  function avant(x, y) {
    if (x[I_ORDRE] !== y[I_ORDRE]) return x[I_ORDRE] - y[I_ORDRE];
    return x[I_ID] - y[I_ID];
  }

  // La plus avancée de deux vues d'une même séance : le plus de calculs
  // faits, puis le meilleur score ; à égalité, le plus PETIT ordre (une copie
  // dont les ordres ont été resserrés, voir ordreSuivant, l'emporte sur une
  // copie ancienne), puis un choix FIXE sur le texte — le même dans les deux
  // sens de la fusion.
  function plusAvancee(a, b) {
    if (a[I_FAITS] !== b[I_FAITS]) return b[I_FAITS] > a[I_FAITS] ? b : a;
    if (a[I_SCORE] !== b[I_SCORE]) return b[I_SCORE] > a[I_SCORE] ? b : a;
    if (a[I_ORDRE] !== b[I_ORDRE]) return b[I_ORDRE] < a[I_ORDRE] ? b : a;
    return JSON.stringify(b) > JSON.stringify(a) ? b : a;
  }

  // Range des séances (des listes propres) dans p : une seule par
  // identifiant (la plus avancée), dans l'ordre du temps, les SEANCES_MAX
  // plus récentes, aux places 1, 2, 3… Les numéros ne sont que des places :
  // les mêmes séances donnent toujours le même parcours, sur tous les
  // appareils — rien à renvoyer au serveur quand rien n'a changé (3e
  // relecture Codex, 24/10/2026). Modifie p, le rend.
  function ranger(p, listes) {
    const parId = new Map();
    listes.forEach(s => {
      const deja = parId.get(s[I_ID]);
      parId.set(s[I_ID], deja ? plusAvancee(deja, s) : s);
    });
    const triees = [...parId.values()].sort(avant);
    p.seances = {};
    triees.slice(Math.max(0, triees.length - SEANCES_MAX)).forEach((s, i) => { p.seances[String(i + 1)] = s.slice(); });
    return p;
  }

  function listes(p) {
    return numeros(p).map(n => p.seances[String(n)]);
  }

  function normaliser(brut) {
    const p = creer();
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return p;
    p.epoque = entier(brut.epoque, 0, COMPTE_MAX, 0);
    p.reglages = normaliserReglages(brut.reglages);
    const seances = brut.seances && typeof brut.seances === "object" && !Array.isArray(brut.seances) ? brut.seances : {};
    const propres = [];
    Object.keys(seances).forEach(cle => {
      if (!/^[1-9]\d{0,3}$/.test(cle)) return;
      const s = normaliserSeance(seances[cle]);
      if (s) propres.push(seanceEnListe(s));
    });
    return ranger(p, propres);
  }

  // Vide : aucune séance et aucun réglage choisi.
  function estVide(parcours) {
    const p = normaliser(parcours);
    return !Object.keys(p.seances).length && !Object.keys(p.reglages).length;
  }

  // Le numéro de la séance qui porte cet identifiant, ou null.
  function numeroDeId(p, id) {
    const trouve = numeros(p).find(n => p.seances[String(n)][I_ID] === id);
    return trouve === undefined ? null : trouve;
  }

  // Un identifiant libre dans ce parcours : le tirage, ou le suivant s'il est
  // déjà pris (deux tirages égaux, ou une page de test au hasard figé).
  function idLibre(parcours, tirage) {
    const p = normaliser(parcours);
    const pris = {};
    numeros(p).forEach(n => { pris[p.seances[String(n)][I_ID]] = true; });
    let id = Number.isInteger(tirage) && tirage >= 1 && tirage <= ID_MAX ? tirage : 1 + Math.floor(Math.random() * ID_MAX);
    while (pris[id]) id = id >= ID_MAX ? 1 : id + 1;
    return id;
  }

  // L'ordre d'une séance qui entre dans ce parcours : le plus grand qu'il
  // connaît, plus un. Après une fusion, le parcours connaît les séances des
  // deux appareils : la suivante passe après toutes. Si la borne ORDRE_MAX est
  // atteinte (une seule séance trafiquée à 1 000 000 suffisait : toutes les
  // suivantes prenaient le même ordre et la borne les jetait à l'entrée — 4e
  // relecture Codex), les ordres sont d'abord RESSERRÉS 1, 2, 3… dans le même
  // ordre : la suivante a de nouveau sa place, après toutes. Modifie p.
  function ordreSuivant(p) {
    let plusGrand = 0;
    listes(p).forEach(s => { if (s[I_ORDRE] > plusGrand) plusGrand = s[I_ORDRE]; });
    if (plusGrand < ORDRE_MAX) return plusGrand + 1;
    const rangees = listes(p).slice().sort(avant);
    rangees.forEach((s, i) => { s[I_ORDRE] = i + 1; });
    ranger(p, rangees);
    return rangees.length + 1;
  }

  // L'ordre de la séance qui porte cet identifiant, ou null (la page le garde
  // pour le redonner à la note suivante, voir noterSeance).
  function ordreDeId(parcours, id) {
    const p = normaliser(parcours);
    const n = numeroDeId(p, id);
    return n === null ? null : p.seances[String(n)][I_ORDRE];
  }

  // La séance la plus récente d'un parcours (la dernière place), ou null.
  function derniereSeance(p) {
    const liste = listes(p);
    return liste.length ? liste[liste.length - 1] : null;
  }

  // Deux parcours du même élève (deux appareils, ou le serveur et la case).
  function fusionner(premier, second) {
    const a = normaliser(premier);
    const b = normaliser(second);
    if (a.epoque !== b.epoque) return a.epoque > b.epoque ? a : b;
    const fusion = creer();
    fusion.epoque = a.epoque;
    // L'union par identifiant, rangée dans l'ordre du temps : aucune séance
    // ne dépend de la place qu'elle avait dans l'une ou l'autre copie.
    ranger(fusion, listes(a).concat(listes(b)));
    // Les réglages : ceux du rang le plus haut (le dernier changement) ; à
    // rang égal, ceux du parcours dont la séance est la plus récente ; à
    // égalité encore, un ordre FIXE sur le texte des réglages — le même
    // résultat dans les deux sens, pour que deux appareils qui ont chacun
    // changé une fois depuis le même rang tombent d'accord au lieu de se
    // réécrire l'un l'autre à chaque ouverture (2e relecture Codex, 24/10/2026).
    const ra = rangDesReglages(a.reglages);
    const rb = rangDesReglages(b.reglages);
    const da = derniereSeance(a);
    const db = derniereSeance(b);
    const ta = JSON.stringify(a.reglages);
    const tb = JSON.stringify(b.reglages);
    let bGagne;
    if (rb !== ra) bGagne = rb > ra;
    else if (da && db && avant(da, db) !== 0) bGagne = avant(db, da) > 0;
    else if (!da !== !db) bGagne = Boolean(db);
    else bGagne = tb > ta;
    const prioritaire = bGagne ? b : a;
    const autre = bGagne ? a : b;
    fusion.reglages = Object.keys(prioritaire.reglages).length ? cloner(prioritaire.reglages) : cloner(autre.reglages);
    return normaliser(fusion);
  }

  // --------------------------------------------------- les gestes de l'appli
  //
  // Chacun rend un parcours NEUF (le reçu n'est pas modifié).

  // Le numéro que prendrait une séance nouvelle du jour le plus récent : la
  // place après la dernière (la dernière, quand la borne est atteinte).
  function numeroSuivant(parcours) {
    return Math.min(SEANCES_MAX, Object.keys(normaliser(parcours).seances).length + 1);
  }

  // La séance en cours (ou finie) est notée : `seance` = {id, mode, reglages,
  // faits, score}, `jour` le jour local de la page (les tests le donnent).
  // `id` : l'identifiant tiré par la page au début de la séance (idLibre) ;
  // si une séance du parcours le porte déjà — à n'importe quel numéro, une
  // fusion a pu la déplacer —, elle est mise à jour et garde son ORDRE et son
  // JOUR (celui où elle a commencé : une séance qui passe minuit ne change pas
  // de jour). Sinon, `seance.ordre` et `seance.jour` — l'ordre et le jour que
  // la page a gardés depuis la première note — s'il y en a : une séance sortie du parcours (une fusion
  // a apporté 500 séances pendant qu'elle se jouait) revient avec SON ordre,
  // quel que soit le chemin (4e relecture Codex) ; sinon l'ordre suivant
  // (ordreSuivant), après toutes les séances que le parcours connaît. Rend
  // {parcours, numero} — numero null si la séance n'y est pas (rien noté, ou
  // plus ancienne que les 500 gardées). Une séance sans calcul fait, ou sans
  // identifiant, n'est pas notée.
  function noterSeance(parcours, seance, jour) {
    const p = normaliser(parcours);
    const s = seance && typeof seance === "object" ? seance : {};
    const r = s.reglages && typeof s.reglages === "object" ? s.reglages : {};
    const mode = dans(MODES, s.mode, "flash");
    const propre = normaliserSeance({
      jour: dateOuNull(jour) || jourLocal(),
      mode,
      operations: r.operations,
      chiffresMin: r.chiffresMin,
      chiffresMax: r.chiffresMax,
      nombres: r.nombres,
      temps: mode === "flash" ? r.temps : r.limite,
      calculs: r.calculs,
      faits: s.faits,
      score: s.score,
      id: s.id,
      ordre: 1
    });
    if (!propre) return {parcours: p, numero: null};
    const deja = numeroDeId(p, propre.id);
    if (deja !== null) {
      propre.ordre = p.seances[String(deja)][I_ORDRE];
      propre.jour = p.seances[String(deja)][I_JOUR];
    } else if (Number.isInteger(s.ordre) && s.ordre >= 1 && s.ordre <= ORDRE_MAX) {
      propre.ordre = s.ordre;
      if (dateOuNull(s.jour)) propre.jour = s.jour;
    } else {
      propre.ordre = ordreSuivant(p);
    }
    const autres = listes(p).filter(l => l[I_ID] !== propre.id);
    ranger(p, autres.concat([seanceEnListe(propre)]));
    return {parcours: p, numero: numeroDeId(p, propre.id)};
  }

  // Les réglages de l'élève changent (un mode, un pas, un choix) : le parcours
  // garde les derniers, par mode, et le mode choisi — au rang suivant, pour
  // que la fusion sache lesquels sont les plus récents.
  function sauverReglages(parcours, reglages) {
    const p = normaliser(parcours);
    const r = normaliserReglages(reglages);
    if (Object.keys(r).length) r.rang = Math.min(COMPTE_MAX, rangDesReglages(p.reglages) + 1);
    p.reglages = r;
    return p;
  }

  // Ce qui part au serveur : exactement le format, rien de plus.
  function pourServeur(parcours) {
    return normaliser(parcours);
  }

  // ------------------------------------------------------- ce qu'on en lit
  //
  // Tout ce que la page, la tuile de Mon espace et « Ma classe » affichent
  // d'un parcours, lu ici et nulle part ailleurs.

  // Les séances, de la plus récente à la plus ancienne (l'ordre du temps :
  // l'ordre, puis l'identifiant), chacune dans l'objet de la page :
  // {numero, jour, mode, reglages,
  // calculs (prévus), faits, score, arretee}.
  function historique(parcours) {
    const p = normaliser(parcours);
    return numeros(p)
      .sort((x, y) => avant(p.seances[String(y)], p.seances[String(x)]))
      .map(n => {
        const s = normaliserSeance(p.seances[String(n)]);
        return {numero: n, id: s.id, jour: s.jour, mode: s.mode, reglages: reglagesDeSeance(s),
          calculs: s.calculs, faits: s.faits, score: s.score, arretee: s.faits < s.calculs};
      });
  }

  // Le compte : les calculs faits, les jours d'entraînement (des jours
  // distincts), les séances, le premier et le dernier jour.
  function resume(parcours) {
    const liste = historique(parcours);
    const jours = {};
    let calculs = 0;
    let justes = 0;
    liste.forEach(s => { jours[s.jour] = true; calculs += s.faits; justes += s.score; });
    return {
      calculs,
      justes,
      jours: Object.keys(jours).length,
      seances: liste.length,
      premier: liste.length ? liste[liste.length - 1].jour : null,
      dernier: liste.length ? liste[0].jour : null
    };
  }

  // Les mots du compte, partout les mêmes (tuile, « Mon historique », Ma
  // classe) : « 230 calculs · 5 jours d'entraînement » ; rien sans calcul.
  function texteResume(resumeOuParcours) {
    const r = resumeOuParcours && typeof resumeOuParcours.calculs === "number" && typeof resumeOuParcours.jours === "number"
      ? resumeOuParcours : resume(resumeOuParcours);
    if (!r.calculs) return "";
    return `${r.calculs} calcul${r.calculs > 1 ? "s" : ""} · ${r.jours} jour${r.jours > 1 ? "s" : ""} d’entraînement`;
  }

  // Ce que « Ma classe » montre d'un élève : le compte, le dernier jour et les
  // dix dernières séances.
  function resumeProf(parcours) {
    const r = resume(parcours);
    return Object.assign(r, {texte: texteResume(r), dernieres: historique(parcours).slice(0, 10), commence: r.calculs > 0});
  }

  // La tuile de l'espace élève : une ligne, « 230 calculs · 5 jours
  // d'entraînement » ; rien tant qu'aucun calcul n'est fait.
  function resumeTuile(parcours) {
    const texte = texteResume(parcours);
    return {texte, vide: !texte};
  }

  // ------------------------------------------------------------- empreintes
  //
  // Le même rangement que Défi tables (lot 8) et Coffres : la clé d'une case à code porte
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
    // « Prêt » : le serveur a été lu (ou n'a pas pu l'être, ou personne n'est
    // suivi) — l'appli attend ce moment pour connaître les réglages du compte
    // et l'historique. Résolu une seule fois, avec {actif, lu}.
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
        try { console.warn("Anzan : envoi refusé par le serveur (" + reponse.statut + ")", donnees); } catch (_) {}
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
    // noterUneSeance rend le NUMÉRO de la séance ; c'est son identifiant
    // (seance.id, tiré par la page au départ) qui la retrouve d'un calcul au
    // suivant (voir noterSeance).
    function noterUneSeance(seance) {
      const avantNote = JSON.stringify(parcours);
      const resultat = noterSeance(parcours, seance, jourLocal(maintenant()));
      parcours = resultat.parcours;
      // Rien de nouveau (la séance finie sans autre calcul) : rien à envoyer
      // (4e relecture Codex : le même parcours partait deux fois).
      if (JSON.stringify(parcours) !== avantNote) noterChangement();
      return resultat.numero;
    }
    function sauverLesReglages(reglages) {
      parcours = sauverReglages(parcours, reglages);
      noterChangement();
      return parcours;
    }

    // Le code a été refusé pour de bon : plus d'envoi, l'élève reste dans SA
    // case, son travail continue de s'y ranger.
    function detacher() {
      sync.detache = true;
      ecrireSync();
      suiviIdentite = null;
      suiviHorsLigne = false;
      if (relance !== null) { annuler(relance); relance = null; }
      rendre.repere();
    }

    function reprendreLesEnvois() {
      if (envoiPossible() && sync.dirty) envoyerMaintenant();
    }

    async function chargerIdentite(code) {
      const reponse = await lireIdentiteDuServeur(code);
      if (code !== codeSuivi) return;
      if (reponse.statut === 200 && reponse.donnees && reponse.donnees.ok) {
        suiviIdentite = {prenom: reponse.donnees.prenom || "", classe: reponse.donnees.classe || ""};
        sauverIdentiteOnglet(stockageSession(), code, suiviIdentite);
      } else if (reponse.statut === 404) {
        suiviIdentite = null;
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

    // Au démarrage sous un code : le serveur fait foi, fusion avec la case du
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

    // Les réglages du compte tels qu'on les connaît ({} tant que l'élève n'en
    // a pas choisi), pour que l'appli les dessine.
    function reglagesDuCompte() { return parcours && parcours.reglages ? cloner(parcours.reglages) : {}; }

    return {
      get codeSuivi() { return codeSuivi; },
      get parcours() { return parcours; },
      get sync() { return sync; },
      get suiviHorsLigne() { return suiviHorsLigne; },
      get suiviIdentite() { return suiviIdentite; },
      get erreurDefinitive() { return erreurDefinitive; },
      get entreeRefusee() { return entreeRefusee; },
      get billetEnCours() { return billetEnCours; },
      pret: () => pret,
      get gardeVisible() { return gardeVisible; },
      get gardeErreur() { return gardeErreur; },
      ENTREE, TEXTES, GARDE_INACTIVITE_MS, GARDE_ESSAIS_MAX,
      suiviActif, prenomAffiche, etatRepere,
      appelSuivi, echangerBillet, lireParcoursDuServeur, paquetParcours,
      envoyerParcours, envoyerMaintenant, envoyerAvantDeFermer,
      sauverParcours, noterUneSeance, sauverLesReglages,
      demarrer, demarrerSuivi, entrerParBillet, adopterCode, quitterSuivi, brancher, reglagesDuCompte,
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
    CLE_DERNIER_GESTE,
    MODES,
    OPERATIONS,
    SONS,
    CALCULS,
    CHIFFRES,
    NOMBRES,
    TEMPS,
    LIMITES,
    DEFAUTS,
    SEANCE_CHAMPS,
    SEANCES_MAX,
    NUMERO_MAX,
    ID_MAX,
    ORDRE_MAX,
    CLES_SERVEUR,
    MOTS_SERVEUR,
    MOTIF_SEANCES_PHP,
    TEXTES,
    GARDE_INACTIVITE_MS,
    GARDE_ESSAIS_MAX,
    ENVOI_GROUPE_MS,
    ITERATIONS_EMPREINTE,
    LONGUEUR_EMPREINTE,
    LONGUEUR_CODE,
    DUREE_CONSERVATION_MS,
    jourLocal,
    creer,
    normaliser,
    normaliserReglages,
    normaliserReglagesMode,
    normaliserSeance,
    estVide,
    fusionner,
    numeroSuivant,
    idLibre,
    ordreDeId,
    noterSeance,
    sauverReglages,
    pourServeur,
    historique,
    resume,
    texteResume,
    resumeProf,
    resumeTuile,
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
