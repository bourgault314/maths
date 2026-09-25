/* Les étapes de l'univers SPLAT!, dans l'ordre de la carte des mondes
   (outils/splat_univers.html) : [parcours, numéro affiché, titre, monde].

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
   le ?v= de ce fichier dans les trois outils. */
(function () {
  "use strict";
  const ETAPES = [
    ["m1e1", 1, "Complète le schéma", "Petit SPLAT!"],
    ["m1e2", 2, "Dessine les jetons", "Petit SPLAT!"],
    ["m1e3", 3, "Mélange !", "Petit SPLAT!"],
    ["m1e4", 4, "Deux taches", "Petit SPLAT!"],
    ["m1e5", 5, "Plein de taches !", "Petit SPLAT!"],
    ["m1e6", 6, "Dessine en expert", "Petit SPLAT!"],
    ["m2e1", 7, "Le même jeu, un nouveau plateau", "SPLAT! Classique"],
    ["m2e4", 8, "Avec des paquets de jetons", "SPLAT! Classique"],
    ["m2e5", 9, "Le défi", "SPLAT! Classique"],
    ["enq10", 10, "De plus que", "SPLAT! Enquête"],
    ["enq11", 11, "De moins que", "SPLAT! Enquête"],
    ["enq12", 12, "Plus ou moins", "SPLAT! Enquête"],
    ["enq13", 13, "Trois taches en chaîne", "SPLAT! Enquête"],
    ["enq14", 14, "Le défi additif", "SPLAT! Enquête"],
    ["enq15", 15, "Fois plus", "SPLAT! Enquête"],
    ["enq16", 16, "Fois moins", "SPLAT! Enquête"],
    ["enq17", 17, "Les quatre opérations", "SPLAT! Enquête"],
    ["enq18", 18, "Trois taches, 4 opérations", "SPLAT! Enquête"],
    ["enq19", 19, "Le grand défi", "SPLAT! Enquête"],
    ["enq20", 20, "Des taches répétées", "SPLAT! Enquête"],
    ["enq21", 21, "Répétées, fois plus ou moins", "SPLAT! Enquête"],
    ["enq22", 22, "Sans total", "SPLAT! Enquête"],
    ["enq23", 23, "Sans total, à retourner", "SPLAT! Enquête"],
    ["enq24", 24, "Le défi qui rebondit", "SPLAT! Enquête"],
    ["sys25", 25, "Une partie du plateau", "SPLAT! Système"],
    ["sys26", 26, "Avec des jetons visibles", "SPLAT! Système"],
    ["sys27", 27, "Une partie connue", "SPLAT! Système"],
    ["sys28", 28, "Deux pesées", "SPLAT! Système"],
    ["sys29", 29, "Le défi des plateaux", "SPLAT! Système"],
    ["sys30", 30, "Trois paires", "SPLAT! Système"],
    ["sys31", 31, "Doubler, puis comparer", "SPLAT! Système"],
    ["sys32", 32, "En miroir", "SPLAT! Système"],
    ["sys33", 33, "Doubler ou miroir ?", "SPLAT! Système"],
    ["sys34", 34, "Le grand défi du Système", "SPLAT! Système"],
    ["m3e1", 35, "Premières équations", "SPLAT! Équations"],
    ["m3e2", 36, "Des paquets de jetons", "SPLAT! Équations"],
    ["m3e4", 37, "Des taches des deux côtés", "SPLAT! Équations"],
    ["m4e1", 38, "Les billes rouges arrivent", "SPLAT! Relatifs"],
    ["m4e2", 39, "La tache cache un négatif", "SPLAT! Relatifs"],
    ["m4e3", 40, "Négatifs dans l'équation", "SPLAT! Relatifs"],
    ["m4e4", 41, "Des deux côtés, en relatifs", "SPLAT! Relatifs"],
    ["m4e5", 42, "Les jetons numérotés", "SPLAT! Relatifs"],
    ["m4e6", 43, "La tache opposée", "SPLAT! Relatifs"],
    ["m4e7", 44, "Le boss de l'univers", "SPLAT! Relatifs"]
  ];

  function echapper(texte) {
    return String(texte).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* L'étape qui suit « parcours » : null si le parcours n'est pas sur la carte,
     { derniere: true } après la dernière étape de l'univers. */
  function suivante(parcours) {
    const k = ETAPES.findIndex((e) => e[0] === parcours);
    if (k < 0) return null;
    if (k + 1 >= ETAPES.length) return { derniere: true };
    const [p, numero, titre, monde] = ETAPES[k + 1];
    return { derniere: false, parcours: p, numero, titre, monde, nouveauMonde: monde !== ETAPES[k][3] };
  }

  /* La petite ligne sous « Étape suivante ▶ » (texte brut, "" si inconnue). */
  function sousTitre(parcours) {
    const s = suivante(parcours);
    if (!s || s.derniere) return "";
    /* espaces insécables : « SPLAT! Classique » ne se coupe pas en deux sur téléphone */
    return s.nouveauMonde
      ? `🌍 Nouveau monde : ${s.monde.replace(/ /g, " ")}`
      : `Étape ${s.numero} · ${s.titre}`;
  }

  /* Le gros bouton vert de l'écran de fin : son contenu (HTML) et son lien.
     urlCarte = l'adresse de la carte des mondes de l'outil. Parcours inconnu
     de la carte : « Étape suivante ▶ » seul (la carte fera au mieux). Dernière
     étape de l'univers : le bouton ramène à la carte. */
  function bouton(parcours, urlCarte) {
    const s = suivante(parcours);
    if (s && s.derniere) {
      return { html: "Voir la carte des mondes ▶", href: urlCarte, versCarte: true };
    }
    const sous = sousTitre(parcours);
    return {
      html: "Étape suivante ▶" + (sous ? `<span class="finSuiteOu">${echapper(sous)}</span>` : ""),
      href: `${urlCarte}?apres=${encodeURIComponent(parcours)}`,
      versCarte: false
    };
  }

  window.MathsGoSplatEtapes = { ETAPES, suivante, sousTitre, bouton };
})();
