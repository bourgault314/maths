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
   livrets le chargent pour savoir quoi cacher. */
(function () {
  "use strict";

  /* ══════ LA LIGNE À CHANGER POUR REMETTRE UN MONDE EN PUBLIC (26/09/2026) ══════
     Les mondes « en préparation », par leur numéro sur la carte des mondes :
     3 = SPLAT! Enquête, 4 = SPLAT! Système (6 = SPLAT! Relatifs, public depuis le 27/09/2026).
     Pour le public, un monde de cette liste s'affiche « 🚧 en préparation » sur la
     carte, sans aucun lien (vue élève et vue prof), ses livrets disparaissent de la
     page des livrets, et le bouton « Étape suivante » des outils le saute.
     Pour rendre un monde au public : retirer son numéro, puis bumper le ?v= de ce
     fichier partout où il est chargé (npm run verifier dit où).
     Les outils eux-mêmes et les QR déjà imprimés continuent de marcher. */
  const MONDES_EN_PREPARATION = [3, 4];

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

  /* Chaque étape : [parcours, numéro affiché, titre, monde, numéro du monde]. */
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
    ["enq12", 12, "Plus ou moins", "SPLAT! Enquête", 3],
    ["enq13", 13, "Trois taches en chaîne", "SPLAT! Enquête", 3],
    ["enq14", 14, "Le défi additif", "SPLAT! Enquête", 3],
    ["enq15", 15, "Fois plus", "SPLAT! Enquête", 3],
    ["enq16", 16, "Fois moins", "SPLAT! Enquête", 3],
    ["enq17", 17, "Les quatre opérations", "SPLAT! Enquête", 3],
    ["enq18", 18, "Trois taches, 4 opérations", "SPLAT! Enquête", 3],
    ["enq19", 19, "Le grand défi", "SPLAT! Enquête", 3],
    ["enq20", 20, "Des taches répétées", "SPLAT! Enquête", 3],
    ["enq21", 21, "Répétées, fois plus ou moins", "SPLAT! Enquête", 3],
    ["enq22", 22, "Sans total", "SPLAT! Enquête", 3],
    ["enq23", 23, "Sans total, à retourner", "SPLAT! Enquête", 3],
    ["enq24", 24, "Le défi qui rebondit", "SPLAT! Enquête", 3],
    ["sys25", 25, "Une partie du plateau", "SPLAT! Système", 4],
    ["sys26", 26, "Avec des jetons visibles", "SPLAT! Système", 4],
    ["sys27", 27, "Une partie connue", "SPLAT! Système", 4],
    ["sys28", 28, "Deux pesées", "SPLAT! Système", 4],
    ["sys29", 29, "Le défi des plateaux", "SPLAT! Système", 4],
    ["sys30", 30, "Trois paires", "SPLAT! Système", 4],
    ["sys31", 31, "Doubler, puis comparer", "SPLAT! Système", 4],
    ["sys32", 32, "En miroir", "SPLAT! Système", 4],
    ["sys33", 33, "Doubler ou miroir ?", "SPLAT! Système", 4],
    ["sys34", 34, "Le grand défi du Système", "SPLAT! Système", 4],
    ["m3e1", 35, "Premières équations", "SPLAT! Équations", 5],
    ["m3e2", 36, "Des paquets de jetons", "SPLAT! Équations", 5],
    ["m3e4", 37, "Des taches des deux côtés", "SPLAT! Équations", 5],
    ["m4e1", 38, "Les jetons rouges arrivent", "SPLAT! Relatifs", 6],
    ["m4e2", 39, "Des négatifs partout", "SPLAT! Relatifs", 6],
    ["m4e3", 40, "La tache opposée", "SPLAT! Relatifs", 6],
    ["m4e4", 41, "Des taches des deux côtés", "SPLAT! Relatifs", 6],
    ["m4e5", 42, "Une tache opposée d’un côté", "SPLAT! Relatifs", 6],
    ["m4e6", 43, "Le grand mélange", "SPLAT! Relatifs", 6]
  ];

  function echapper(texte) {
    return String(texte).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Un monde (numéro de la carte) est-il caché au public ? Jamais avec la clé. */
  function mondeCache(numero, cle = CLE) {
    return !cle && MONDES_EN_PREPARATION.includes(numero);
  }

  /* L'étape qui suit « parcours » : null si le parcours n'est pas sur la carte,
     { derniere: true } quand il n'y a plus rien après (dernière étape de l'univers).
     Sans la clé, on saute les mondes en préparation : après l'étape 9, c'est
     SPLAT! Équations (étape 35) ; après l'étape 37, la carte des mondes. Un élève
     arrivé dans un monde en préparation par un QR déjà imprimé continue dans CE
     monde, jusqu'à sa dernière étape, puis retourne à la carte. */
  function suivante(parcours, cle = CLE) {
    const k = ETAPES.findIndex((e) => e[0] === parcours);
    if (k < 0) return null;
    const ici = ETAPES[k];
    const apres = ETAPES.slice(k + 1).filter((e) =>
      mondeCache(ici[4], cle) ? e[4] === ici[4] : !mondeCache(e[4], cle));
    if (!apres.length) return { derniere: true };
    const [p, numero, titre, monde] = apres[0];
    return { derniere: false, parcours: p, numero, titre, monde, nouveauMonde: monde !== ici[3] };
  }

  /* La petite ligne sous « Étape suivante ▶ » (texte brut, "" si inconnue). */
  function sousTitre(parcours, cle = CLE) {
    const s = suivante(parcours, cle);
    if (!s || s.derniere) return "";
    /* espaces insécables : « SPLAT! Classique » ne se coupe pas en deux sur téléphone */
    return s.nouveauMonde
      ? `🌍 Nouveau monde : ${s.monde.replace(/ /g, " ")}`
      : `Étape ${s.numero} · ${s.titre}`;
  }

  /* Le gros bouton vert de l'écran de fin : son contenu (HTML) et son lien.
     urlCarte = l'adresse de la carte des mondes de l'outil. Parcours inconnu
     de la carte : « Étape suivante ▶ » seul (la carte fera au mieux). Plus rien
     après : le bouton ramène à la carte. */
  function bouton(parcours, urlCarte, cle = CLE) {
    const s = suivante(parcours, cle);
    if (s && s.derniere) {
      return { html: "Voir la carte des mondes ▶", href: urlCarte, versCarte: true };
    }
    const sous = sousTitre(parcours, cle);
    return {
      html: "Étape suivante ▶" + (sous ? `<span class="finSuiteOu">${echapper(sous)}</span>` : ""),
      href: `${urlCarte}?apres=${encodeURIComponent(parcours)}`,
      versCarte: false
    };
  }

  window.MathsGoSplatEtapes = { ETAPES, MONDES_EN_PREPARATION, CLE_ESSAI, cle: CLE, mondeCache, suivante, sousTitre, bouton };
})();
