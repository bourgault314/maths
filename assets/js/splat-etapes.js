/* Les étapes de l'univers SPLAT!, dans l'ordre de la carte des mondes
   (outils/splat_univers.html) : [parcours, numéro affiché, titre, monde,
   numéro du monde].

   Sert au bouton « Étape suivante ▶ » de l'écran de fin des trois outils du
   parcours élève (splat.html, splat_tache_barre.html, equasplat.html — lot A,
   25/09/2026) : sous « Étape suivante », une petite ligne dit où il mène
   (« Étape 28 · Deux pesées », ou « Nouveau monde : SPLAT! Classique » quand
   on change de monde). Le lien passe toujours par la carte des mondes
   (?apres=<parcours>), qui renvoie aussitôt au jeu de l'étape suivante : ce
   fichier ne donne que le TEXTE du bouton, jamais l'adresse d'un jeu.

   C'EST UNE COPIE DE LA CARTE. tests/splat-etape-suivante.test.mjs recalcule
   cette liste à partir de splat_univers.html et échoue si les deux diffèrent :
   après toute retouche d'un titre, d'un numéro, d'un parcours ou d'un nom de
   monde sur la carte, recopier ici la liste que le test affiche, puis bumper
   le ?v= de ce fichier partout où il est chargé (les trois outils, la carte des
   mondes et la page des livrets).

   Depuis le 26/09/2026, il porte aussi LA liste des mondes « en préparation »
   et la clé de Gwenaël (juste dessous) : la carte des mondes et la page des
   livrets le chargent pour savoir quoi cacher.

   Depuis le 04/10/2026, il porte aussi les fiches des Bonus des mondes 3 et 4 (BONUS,
   plus bas) : leurs parcours (enq11d…) sont, avec ceux des étapes, TOUS les noms
   sous lesquels un outil SPLAT! enregistre une série réussie — la liste fermée du
   serveur de suivi, le jour où SPLAT! s'y branchera, se recopie d'ici.

   Depuis le 08/10/2026 (lot « splat-suivi-5 »), il sait aussi quels mondes le
   professeur a ouverts à la CLASSE de l'élève suivi (mondeFerme, plus bas) : la carte
   les grise, « Continuer » et « Étape suivante » ne les proposent plus. */
(function () {
  "use strict";

  /* ══════ LA LIGNE À CHANGER POUR REMETTRE UN MONDE EN PUBLIC (26/09/2026) ══════
     Les mondes « en préparation », par leur numéro sur la carte des mondes :
     aucun aujourd'hui (4 = SPLAT! Système, public depuis le 05/10/2026 ; 3 = SPLAT! Enquête,
     depuis le 30/09/2026 ; 6 = SPLAT! Relatifs, depuis le 27/09/2026).
     Pour le public, un monde de cette liste s'affiche « 🚧 en préparation » sur la
     carte, sans aucun lien (vue élève et vue prof), ses livrets disparaissent de la
     page des livrets, et le bouton « Étape suivante » des outils le saute.
     Pour rendre un monde au public : retirer son numéro, puis bumper le ?v= de ce
     fichier partout où il est chargé (npm run verifier dit où).
     Les outils eux-mêmes et les QR déjà imprimés continuent de marcher. */
  const MONDES_EN_PREPARATION = [];

  /* La clé de Gwenaël : /outils/splat_univers.html?essai=1 (ou la page des livrets,
     ou n'importe quel outil SPLAT!), ouverte une fois par appareil, est retenue dans
     le navigateur ; avec elle, tout est comme si la liste ci-dessus était vide.
     ?essai=0 l'efface. Si le navigateur refuse de retenir (navigation privée),
     la clé ne vaut que pour la page ouverte avec ?essai=1. */
  const CLE_ESSAI = "mathsgo-splat-essai";
  function lireCle() {
    let demande = null;
    try { demande = new URLSearchParams(window.location.search).get("essai"); } catch (e) { demande = null; }
    try {
      if (demande === "1") window.localStorage.setItem(CLE_ESSAI, "1");
      if (demande === "0") window.localStorage.removeItem(CLE_ESSAI);
    } catch (e) { /* stockage refusé : la clé vaut pour cette page seulement */ }
    if (demande === "1") return true;
    if (demande === "0") return false;
    try { return window.localStorage.getItem(CLE_ESSAI) === "1"; } catch (e) { return false; }
  }
  const CLE = lireCle();

  /* Chaque étape : [parcours, numéro affiché, titre, monde, numéro du monde].
     L'échauffement du monde 6 (lot 3 de l'échauffement, 14/10/2026) : trois étapes avant la 38,
     comptées dans les étoiles du monde, qui portent un CODE (« É1 ») à la place du numéro — la
     38 reste la 38. « Étape suivante » : 37 → É1 → É2 → É3 → 38. */
  const ETAPES = [
    ["m1e1", 1, "Complète le schéma", "Petit SPLAT!", 1],
    ["m1e2", 2, "Dessine les jetons", "Petit SPLAT!", 1],
    ["m1e3", 3, "Mélange !", "Petit SPLAT!", 1],
    ["m1e4", 4, "Deux taches", "Petit SPLAT!", 1],
    ["m1e5", 5, "Plein de taches !", "Petit SPLAT!", 1],
    ["m1e6", 6, "Dessine en expert", "Petit SPLAT!", 1],
    ["m2e1", 7, "Le même jeu, un nouveau plateau", "SPLAT! Classique", 2],
    ["m2e4", 8, "Avec des paquets de jetons", "SPLAT! Classique", 2],
    ["m2e5", 9, "Le défi", "SPLAT! Classique", 2],
    ["enq10", 10, "De plus que", "SPLAT! Enquête", 3],
    ["enq11", 11, "De moins que", "SPLAT! Enquête", 3],
    ["enq12", 12, "Trois taches, une référence", "SPLAT! Enquête", 3],
    ["enq13", 13, "Trois taches en chaîne", "SPLAT! Enquête", 3],
    ["enq14", 14, "Référence ou chaîne ?", "SPLAT! Enquête", 3],
    ["enq15", 15, "Fois plus", "SPLAT! Enquête", 3],
    ["enq16", 16, "Fois moins", "SPLAT! Enquête", 3],
    ["enq17", 17, "Une référence, deux rapports", "SPLAT! Enquête", 3],
    ["enq18", 18, "Chaîne, deux rapports", "SPLAT! Enquête", 3],
    ["enq19", 19, "Une référence, un écart et un rapport", "SPLAT! Enquête", 3],
    ["enq20", 20, "Des taches répétées", "SPLAT! Enquête", 3],
    ["enq21", 21, "Répétées, fois plus ou moins", "SPLAT! Enquête", 3],
    ["enq22", 22, "Sans total", "SPLAT! Enquête", 3],
    ["enq23", 23, "Sans total, à retourner", "SPLAT! Enquête", 3],
    ["enq24", 24, "Le défi qui rebondit", "SPLAT! Enquête", 3],
    ["sys25", 25, "Je retire", "SPLAT! Système", 4],
    ["sys26", 26, "Je remplace", "SPLAT! Système", 4],
    ["sys27", 27, "J'additionne", "SPLAT! Système", 4],
    ["sys28", 28, "À toi de choisir", "SPLAT! Système", 4],
    ["m3e1", 35, "Premières équations", "SPLAT! Équations", 5],
    ["m3e2", 36, "Enlever, puis partager", "SPLAT! Équations", 5],
    ["m3e4", 37, "Des taches sur les deux plateaux", "SPLAT! Équations", 5],
    ["ech1", "É1", "Des jetons verts et rouges", "SPLAT! Relatifs", 6],
    ["ech2", "É2", "Je partage les jetons", "SPLAT! Relatifs", 6],
    ["ech3", "É3", "Un jeton, un nombre", "SPLAT! Relatifs", 6],
    ["m4e1", 38, "Les jetons rouges arrivent", "SPLAT! Relatifs", 6],
    ["m4e2", 39, "Des négatifs partout", "SPLAT! Relatifs", 6],
    ["m4e3", 40, "La tache opposée", "SPLAT! Relatifs", 6],
    ["m4e4", 41, "Des taches sur les deux plateaux", "SPLAT! Relatifs", 6],
    ["m4e5", 42, "Des taches opposées sur un plateau", "SPLAT! Relatifs", 6],
    ["m4e6", 43, "Le grand mélange", "SPLAT! Relatifs", 6]
  ];

  /* Les Bonus (monde 3 : 04/10/2026, choix de Gwenaël sur maquettes ; monde 4 : lot M4-4, refait
     au lot M4-7, le livret cycle 4) : les fiches des livrets du Bonus, dans l'ordre des livrets. Chacune a SON parcours
     (enq11d…, sys25d…), sa tache dorée ✨ et son compteur à part, hors des étoiles du haut de la
     carte : elles ne sont pas des étapes. C'EST UNE COPIE de ENQ_TOUR2 et SYS_TOUR2
     (outils/splat_univers.html) : tests/splat-etape-suivante.test.mjs les compare. Leur écran de
     fin (choix B du 04/10) : « Étape suivante ▶ » ouvre la fiche bonus suivante du même monde
     (« Bonus 12d · … ») ; après la dernière (24d, 28d), retour à la carte, sur ce Bonus. Chaque
     fiche : [parcours, code, titre, monde, numéro du monde]. */
  const BONUS = [
    ["enq11d", "11d", "Je complète", "SPLAT! Enquête", 3],
    ["enq12d", "12d", "Référence, chaîne ou je complète ?", "SPLAT! Enquête", 3],
    ["enq13d", "13d", "Tout dans le désordre", "SPLAT! Enquête", 3],
    ["enq16d", "16d", "Chaîne, un écart et un rapport", "SPLAT! Enquête", 3],
    ["enq17d", "17d", "Je complète, avec un rapport", "SPLAT! Enquête", 3],
    ["enq18d", "18d", "Indices composés", "SPLAT! Enquête", 3],
    ["enq20d", "20d", "Deux taches réunies", "SPLAT! Enquête", 3],
    ["enq22d", "22d", "Les indices en symboles", "SPLAT! Enquête", 3],
    ["enq19d", "19d", "Le grand défi", "SPLAT! Enquête", 3],
    ["enq24d", "24d", "Unité commune : les petites parts", "SPLAT! Enquête", 3],
    ["sys25d", "25d", "Je recopie, puis je retire", "SPLAT! Système", 4],
    ["sys26d", "26d", "Deux fois ou trois fois\u00a0?", "SPLAT! Système", 4],
    ["sys27d", "27d", "Deux gestes à la suite", "SPLAT! Système", 4],
    ["sys28d", "28d", "À toi de choisir", "SPLAT! Système", 4]
  ];
  function estBonus(parcours) {
    return BONUS.some((b) => b[0] === parcours);
  }

  /* « ? Aide » des trois outils (lot 3 « aides et carte », 08/11/2026, choix de Gwenaël) : à côté de
     « ◀ Carte des mondes », le bouton ouvre l'aide de l'étape — son film ou son tutoriel, sinon le
     film de son monde — puis ramène l'élève sur SA carte (« Retour au jeu › » sous le film, ou
     « Je joue ▶ » à la fin). Une étape qui « dessine » ouvre le film « Dessine les jetons » (choix du
     08/11 pour l'étape 6). Les mondes sans film ni tutoriel (Enquête, Système, Relatifs) n'ont pas de
     bouton : il viendra tout seul quand ils auront une aide (choix du 08/11).
     C'EST UNE COPIE des films de la carte (MONDES, champ « films ») : tests/splat-aide-jeux.test.mjs
     la recalcule à partir de splat_univers.html et échoue si les deux diffèrent. Chaque étape :
     parcours → nom du film (?film= du lecteur outils/splat_intro.html). */
  const AIDES = {
    m1e1: "intro", m1e2: "dessine", m1e3: "intro", m1e4: "intro", m1e5: "intro", m1e6: "dessine",
    m2e1: "paquets", m2e4: "paquets", m2e5: "paquets",
    m3e1: "equasplat", m3e2: "equasplat", m3e4: "equasplat"
  };
  const URL_FILMS = "/outils/splat_intro.html";
  /* le retour : l'adresse du jeu lui-même (la même série, donc la même reprise — deux livrets peuvent
     partager un parcours avec des cartes différentes), seulement une page du site ; au-delà de 6 000
     caractères (les séries d'ÉquaSplat font 3,5 ko), la carte qui relance le jeu de l'étape (?jouer=) */
  const RETOUR_MAX = 6000;
  function aide(parcours, retour) {
    if (!Object.prototype.hasOwnProperty.call(AIDES, parcours)) return null;
    const suite = typeof retour === "string" && /^\/[^\/\\]/.test(retour) && retour.length <= RETOUR_MAX
      ? retour
      : "/outils/splat_univers.html?jouer=" + encodeURIComponent(parcours);
    return URL_FILMS + "?film=" + AIDES[parcours] + "&suite=" + encodeURIComponent(suite) + "&depuis=jeu";
  }

  function echapper(texte) {
    return String(texte).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Un monde (numéro de la carte) est-il caché au public ? Jamais avec la clé. */
  function mondeCache(numero, cle = CLE) {
    return !cle && MONDES_EN_PREPARATION.includes(numero);
  }

  /* Les mondes que le professeur a ouverts à la classe de l'élève (lot « splat-suivi-5 »,
     08/10/2026 — demande de Gwenaël : « à certaines classes, je veux ouvrir que les deux
     premiers mondes, et après ouvrir le reste »). Seulement pour l'élève suivi : le
     moteur (assets/js/splat-parcours.js) range la liste dans l'ONGLET, liée à son code,
     chaque fois qu'il relit son identité ; ce fichier la relit là. Sans code, ou sans
     liste : null, tous les mondes sont ouverts. Ça guide la classe, ça ne verrouille
     rien : un outil ouvert directement (QR d'un livret) se joue toujours. */
  const CLE_MONDES = "mathsgo-splat-mondes", CLE_CODE = "mathsgo-suivi-code";
  function mondesOuverts() {
    try {
      const code = window.sessionStorage.getItem(CLE_CODE);
      const lu = JSON.parse(window.sessionStorage.getItem(CLE_MONDES) || "null");
      if (!code || !lu || typeof lu !== "object" || lu.code !== code || !Array.isArray(lu.mondes)) return null;
      const mondes = lu.mondes.filter((n) => Number.isInteger(n));
      return mondes.length ? mondes : null;
    } catch (e) { return null; }
  }

  /* Un monde (numéro de la carte) est-il fermé à la classe ? ouverts = null : aucun. */
  function mondeFerme(numero, ouverts = mondesOuverts()) {
    return Array.isArray(ouverts) && !ouverts.includes(numero);
  }

  /* L'étape qui suit « parcours » : null si le parcours n'est pas sur la carte,
     et pour une fiche bonus, la fiche bonus qui la suit (« bonus: true »),
     { derniere: true } quand il n'y a plus rien après (dernière étape de l'univers).
     Sans la clé, on saute les mondes en préparation : après l'étape 9, c'est
     SPLAT! Équations (étape 35) ; après l'étape 37, la carte des mondes. Un élève
     arrivé dans un monde en préparation par un QR déjà imprimé continue dans CE
     monde, jusqu'à sa dernière étape, puis retourne à la carte.
     Les mondes fermés à la classe (ouverts, lot « splat-suivi-5 ») ne sont jamais
     proposés ; un élève qui joue dans un monde fermé (il l'avait ouvert avant la
     fermeture) retourne à la carte. */
  function suivante(parcours, cle = CLE, ouverts = mondesOuverts()) {
    /* une fiche bonus : la fiche bonus suivante, puis la carte (jamais une étape) */
    const kb = BONUS.findIndex((b) => b[0] === parcours);
    if (kb >= 0) {
      const ici = BONUS[kb];
      if (mondeFerme(ici[4], ouverts)) return { derniere: true };
      if (kb + 1 >= BONUS.length || BONUS[kb + 1][4] !== ici[4]) return { derniere: true };
      const [p, code, titre, monde] = BONUS[kb + 1];
      return { derniere: false, bonus: true, parcours: p, code, titre, monde, nouveauMonde: false };
    }
    const k = ETAPES.findIndex((e) => e[0] === parcours);
    if (k < 0) return null;
    const ici = ETAPES[k];
    if (mondeFerme(ici[4], ouverts)) return { derniere: true };
    const apres = ETAPES.slice(k + 1).filter((e) =>
      (mondeCache(ici[4], cle) ? e[4] === ici[4] : !mondeCache(e[4], cle)) && !mondeFerme(e[4], ouverts));
    if (!apres.length) return { derniere: true };
    const [p, numero, titre, monde] = apres[0];
    return { derniere: false, parcours: p, numero, titre, monde, nouveauMonde: monde !== ici[3] };
  }

  /* La petite ligne sous « Étape suivante ▶ » (texte brut, "" si inconnue). */
  function sousTitre(parcours, cle = CLE, ouverts = mondesOuverts()) {
    const s = suivante(parcours, cle, ouverts);
    if (!s || s.derniere) return "";
    /* espaces insécables : « SPLAT! Classique » ne se coupe pas en deux sur téléphone */
    if (s.bonus) return `Bonus ${s.code} · ${s.titre}`;
    return s.nouveauMonde
      ? `🌍 Nouveau monde : ${s.monde.replace(/ /g, " ")}`
      : `Étape ${s.numero} · ${s.titre}`;
  }

  /* Le gros bouton vert de l'écran de fin : son contenu (HTML) et son lien.
     urlCarte = l'adresse de la carte des mondes de l'outil. Parcours inconnu
     de la carte : « Étape suivante ▶ » seul (la carte fera au mieux). Plus rien
     après : le bouton ramène à la carte. */
  function bouton(parcours, urlCarte, cle = CLE, ouverts = mondesOuverts()) {
    const s = suivante(parcours, cle, ouverts);
    if (s && s.derniere) {
      /* après la dernière fiche d'un Bonus (24d, 28d) : la carte, ouverte sur ce Bonus —
         sauf si son monde est fermé à la classe (lot « splat-suivi-5 ») : la carte seule */
      const b = BONUS.find((x) => x[0] === parcours);
      return { html: "Voir la carte des mondes ▶", href: urlCarte + (b && !mondeFerme(b[4], ouverts) ? (b[4] === 4 ? "#sys-bonus" : "#enq-bonus") : ""), versCarte: true };
    }
    const sous = sousTitre(parcours, cle, ouverts);
    return {
      html: "Étape suivante ▶" + (sous ? `<span class="finSuiteOu">${echapper(sous)}</span>` : ""),
      href: `${urlCarte}?apres=${encodeURIComponent(parcours)}`,
      versCarte: false
    };
  }

  window.MathsGoSplatEtapes = { ETAPES, BONUS, AIDES, aide, MONDES_EN_PREPARATION, CLE_ESSAI, cle: CLE, mondeCache, mondesOuverts, mondeFerme, estBonus, suivante, sousTitre, bouton };
})();
