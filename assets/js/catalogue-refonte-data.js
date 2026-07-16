window.MATHSGO_CATALOGUE = {
  "schemaVersion": 4,
  "generatedAt": "2026-07-16T00:00:00.000Z",
  "description": "Catalogue des ressources maths&go : domaines, notions, collections et facettes cumulables.",
  "uses": [
    {
      "id": "manipuler",
      "label": "Manipuler"
    },
    {
      "id": "projeter",
      "label": "Projeter"
    },
    {
      "id": "imprimer",
      "label": "Imprimer"
    },
    {
      "id": "entrainer",
      "label": "S’entraîner"
    }
  ],
  "types": [
    {
      "id": "plateau",
      "label": "Plateaux & manipulations"
    },
    {
      "id": "exerciseur",
      "label": "Exercices interactifs"
    },
    {
      "id": "generateur",
      "label": "Générateurs"
    },
    {
      "id": "imprimable",
      "label": "À imprimer"
    }
  ],
  "filters": [
    {
      "id": "materiel-imprimer",
      "label": "Matériel à imprimer"
    },
    {
      "id": "generateur-exercices",
      "label": "Générateurs d’exercices"
    }
  ],
  "facets": [
    {
      "id": "manipuler",
      "label": "Manipuler"
    },
    {
      "id": "generer",
      "label": "Générer / personnaliser"
    },
    {
      "id": "gabarits",
      "label": "Gabarits et matériel"
    },
    {
      "id": "imprimer",
      "label": "Imprimer / fabriquer"
    },
    {
      "id": "activites",
      "label": "Activités et séances"
    },
    {
      "id": "cours",
      "label": "Cours et synthèses"
    },
    {
      "id": "jeux",
      "label": "Jouer / explorer"
    }
  ],
  "collections": [
    {
      "id": "bouliers",
      "title": "Bouliers et abaques",
      "domain": "nombres-calculs",
      "notions": ["numeration"],
      "hub": "bouliers/index.html",
      "collapseInNotion": true
    },
    {
      "id": "rekenrek",
      "title": "Rekenrek",
      "domain": "nombres-calculs",
      "notions": ["numeration", "calcul-mental"],
      "hub": "bouliers/rekenrek/index.html",
      "role": "progression",
      "parent": "bouliers",
      "navigation": "hub"
    },
    {
      "id": "montessori",
      "title": "Boulier Montessori",
      "domain": "nombres-calculs",
      "notions": ["numeration"],
      "hub": "bouliers/boulier_montessori/index.html",
      "parent": "bouliers",
      "navigation": "hub"
    },
    {
      "id": "soroban",
      "title": "Soroban",
      "domain": "nombres-calculs",
      "notions": ["numeration", "calcul-mental"],
      "hub": "bouliers/soroban/index.html",
      "parent": "bouliers",
      "navigation": "hub"
    },
    {
      "id": "gerbert",
      "title": "Abaque de Gerbert",
      "domain": "nombres-calculs",
      "notions": ["numeration"],
      "hub": "bouliers/abaque_de_gerbert/index.html",
      "role": "progression-courte",
      "parent": "bouliers",
      "navigation": "hub"
    },
    {
      "id": "tuiles-algebriques",
      "title": "Tuiles algébriques",
      "domain": "algebre",
      "notions": ["calcul-litteral", "equations"],
      "hub": "tuiles_algebriques/index.html",
      "hiddenFromBrowse": false,
      "collapseInNotion": true
    },
    {
      "id": "splat",
      "title": "Splat",
      "domain": "algebre",
      "notions": ["calcul-litteral", "equations"],
      "hub": "splat/index.html",
      "featured": true,
      "hiddenFromBrowse": false,
      "collapseInNotion": true
    }
  ],
  "resourceClassifications": {
    "cps/bilan-s1.html": {
      "primaryNotion": "bilans-cps",
      "primaryGroup": "imprimer",
      "collections": [],
      "tags": ["cps", "bilan", "connaissance-de-soi", "engagement"],
      "thumbnail": "cps/assets/bilan-s1/page-1.png",
      "cardDescription": "Un bilan guidé en quatre pages pour relire son semestre, comprendre son fonctionnement et choisir un petit pas concret."
    },
    "outils/box_barre_final.html": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["boite", "schema-barres"] },
    "outils/box_pasbarre_final.html": { "primaryNotion": "calcul-litteral", "collections": [], "tags": ["boite", "archive"] },
    "outils/tuiles_algebriques/tuiles_algebriques.html": {
      "primaryNotion": "calcul-litteral",
      "primaryGroup": "manipuler",
      "collections": ["tuiles-algebriques"],
      "tags": ["tuiles-algebriques", "expression", "developpement", "reduction", "manipulation"],
      "thumbnail": "assets/img/thumbnails/tuiles-algebriques/plateau-expressions.png?v=2",
      "cardDescription": "Composer, ordonner et simplifier des expressions avec les tuiles x², x et 1."
    },
    "outils/tuiles_algebriques/tuiles_algebriques_mode_equation.html": {
      "primaryNotion": "equations",
      "primaryGroup": "manipuler",
      "collections": ["tuiles-algebriques"],
      "tags": ["tuiles-algebriques", "equation", "premier-degre", "balance", "manipulation"],
      "thumbnail": "assets/img/thumbnails/tuiles-algebriques/plateau-equations.png?v=2",
      "cardDescription": "Poser puis résoudre une équation du premier degré en manipulant les deux membres."
    },
    "outils/detective_des_grandeurs_additive__1.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "enquete"] },
    "outils/detective_des_grandeurs_additive__2.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "enquete"] },
    "outils/detective_des_grandeurs_multiplicative__1.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "enquete"] },
    "outils/equabarre.html": {
      "primaryNotion": "schemas-barres",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["schema-barres", "equation", "inconnue"],
      "thumbnail": "assets/img/thumbnails/splat/equabarre.png?v=2",
      "cardDescription": "Représenter une équation par deux schémas en barres et transformer les deux membres pas à pas."
    },
    "outils/equasplat.html": {
      "primaryNotion": "equations",
      "primaryGroup": "manipuler",
      "collections": ["splat"],
      "tags": ["equation", "inconnue", "jetons", "splat"],
      "thumbnail": "assets/img/thumbnails/splat/equasplat.png?v=2",
      "cardDescription": "Construire une équation avec des taches et des jetons puis agir de la même façon sur les deux membres."
    },
    "outils/gabarits_enquetes_additive.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "gabarit"] },
    "outils/gabarits_enquetes_multiplicative.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "gabarit"] },
    "outils/gabarits_partage_equitable_2_3_4_5.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "gabarit"] },
    "outils/sheet_generator_schema_partie_tout.html": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["ancien-index", "schema-barres"] },
    "outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/tuiles_algebriques/livret_litteral_mathigon.pdf": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/fabrication_materiel/maths_barre.html": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "reference-technique"] },
    "outils/patterns.html": { "primaryNotion": "patterns", "collections": [], "tags": ["patterns", "generalisation"] },
    "outils/club_maths/jeu_de_nim.html": {
      "primaryNotion": "strategie",
      "primaryGroup": "jeux",
      "collections": [],
      "tags": ["jeu", "strategie", "anticipation", "invariant"],
      "thumbnail": "assets/img/thumbnails/jeux/jeu-nim.svg?v=1",
      "cardDescription": "Chercher une stratégie gagnante en retirant 1, 2 ou 3 bâtons sans prendre le bâton rouge."
    },
    "outils/club_maths/yavalath.html": {
      "primaryNotion": "strategie",
      "primaryGroup": "jeux",
      "collections": [],
      "tags": ["jeu", "strategie", "alignement", "hexagones"],
      "thumbnail": "assets/img/thumbnails/jeux/yavalath.svg?v=1",
      "cardDescription": "Aligner quatre pions sur le plateau hexagonal sans perdre en formant d’abord une ligne de trois."
    },
    "outils/club_maths/tables_modulaires.html": {
      "primaryNotion": "explorations",
      "primaryGroup": "jeux",
      "collections": [],
      "tags": ["exploration", "tables", "modulo", "courbes", "cercle"],
      "thumbnail": "assets/img/thumbnails/jeux/tables-modulaires.svg?v=1",
      "cardDescription": "Relier les multiples sur un cercle et observer les courbes produites par les tables modulaires."
    },
    "outils/club_maths/jeu_du_chaos.html": {
      "primaryNotion": "explorations",
      "primaryGroup": "jeux",
      "collections": [],
      "tags": ["exploration", "fractale", "hasard", "sierpinski", "scratch"],
      "thumbnail": "assets/img/thumbnails/jeux/jeu-chaos.svg?v=1",
      "cardDescription": "Faire émerger le triangle de Sierpiński par une expérience aléatoire, puis prolonger avec Scratch."
    },
    "outils/plateaux_manipulation/le_grand_pari.html": {
      "primaryNotion": "probabilites",
      "primaryGroup": "jeux",
      "collections": [],
      "tags": ["probabilites", "frequences", "des", "sommes", "simulation"],
      "thumbnail": "assets/img/thumbnails/jeux/grand-pari.svg?v=1",
      "cardDescription": "Parier sur la somme de deux ou trois dés puis comparer les fréquences observées."
    },
    "outils/plateaux_manipulation/aire_perimetre_plateau.html": {
      "primaryNotion": "aires-perimetres",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["aire", "perimetre", "quadrillage", "figures"],
      "thumbnail": "assets/img/thumbnails/notions/aire-perimetre.svg?v=1",
      "cardDescription": "Construire des figures sur quadrillage et comparer simultanément leur aire et leur périmètre."
    },
    "outils/plateaux_manipulation/maitre_du_temps.html": {
      "primaryNotion": "temps-durees",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["temps", "durees", "heures", "minutes", "secondes", "conversion"],
      "thumbnail": "assets/img/thumbnails/notions/disques-temps.svg?v=1",
      "cardDescription": "Manipuler des disques recto verso pour relier heures, minutes et secondes."
    },
    "outils/plateaux_manipulation/cubes_construction.html": {
      "primaryNotion": "espace-constructions",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["espace", "cubes", "volume", "scene3d", "construction"],
      "thumbnail": "assets/img/thumbnails/notions/scene3d.svg?v=1",
      "cardDescription": "Accéder à SCÈNE3D pour construire, faire tourner et dénombrer des assemblages de cubes."
    },
    "outils/plateaux_manipulation/stats_city.html": {
      "primaryNotion": "statistiques",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["statistiques", "mediane", "moyenne", "etendue", "donnees"],
      "thumbnail": "assets/img/thumbnails/notions/stats-city.png?v=3",
      "cardDescription": "Ranger et construire une ville de données pour travailler médiane, moyenne et étendue."
    },
    "outils/plateaux_manipulation/moyennes.html": {
      "primaryNotion": "statistiques",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["moyenne", "repartition", "equilibrage", "decimaux", "blocs"],
      "thumbnail": "assets/img/thumbnails/notions/moyenne.svg?v=2",
      "cardDescription": "Déplacer ou couper des blocs pour égaliser les piles et donner du sens à la moyenne."
    },
    "outils/plateaux_manipulation/glisse_entiers_flex.html": {
      "primaryNotion": "numeration",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["numeration", "entiers", "valeur-position", "multiplier", "diviser"],
      "thumbnail": "assets/img/thumbnails/numeration/glisse-entiers.png?v=2",
      "cardDescription": "Faire glisser les chiffres dans le tableau de numération et visualiser les changements de valeur."
    },
    "outils/plateaux_manipulation/glisse_nombres_decimaux.html": {
      "primaryNotion": "numeration",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["numeration", "decimaux", "valeur-position", "dixiemes", "centiemes"],
      "thumbnail": "assets/img/thumbnails/numeration/glisse-decimaux.png?v=2",
      "cardDescription": "Déplacer les chiffres de part et d’autre de la virgule dans un tableau de numération décimale."
    },
    "outils/plateaux_manipulation/numeration_decimale.html": {
      "primaryNotion": "numeration",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["numeration", "decimaux", "unites", "dixiemes", "centiemes", "fractions"],
      "thumbnail": "assets/img/thumbnails/numeration/plateau-decimal.png?v=2",
      "cardDescription": "Couper et fusionner unités, dixièmes et centièmes pour construire les écritures décimales et fractionnaires."
    },
    "outils/fabrication_materiel/numeration_decimale_maker.html": {
      "primaryNotion": "numeration",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["numeration", "decimaux", "materiel", "imprimer", "gabarit"],
      "thumbnail": "assets/img/thumbnails/numeration/maker-decimal.png?v=2",
      "cardDescription": "Préparer des planches d’unités, dixièmes et centièmes personnalisées pour l’impression."
    },
    "auto/index.html": {
      "primaryNotion": "calcul-mental",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["automatismes", "cycle-4", "dnb", "entrainement", "diaporama", "interactif"],
      "thumbnail": "assets/img/thumbnails/automatismes/entrainement-cycle4.svg?v=1",
      "cardDescription": "Choisir le niveau, les domaines et le mode pour lancer une séance interactive ou un diaporama."
    },
    "outils/automatismes/CM_Livret_A5.html": {
      "primaryNotion": "calcul-mental",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["automatismes", "livret", "a5", "imprimer", "tous-domaines"],
      "thumbnail": "assets/img/thumbnails/automatismes/livret-a5.svg?v=1",
      "cardDescription": "Composer puis imprimer un livret A5 de six blocs pouvant mobiliser tous les domaines."
    },
    "outils/problemes_barres_M974.html": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "version-travail"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_difference.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_differenceB.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_differenceBClaire.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_differenceC.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_differenceD.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/splat.html": {
      "primaryNotion": "calcul-litteral",
      "primaryGroup": "generer",
      "collections": ["splat"],
      "tags": ["splat", "inconnue", "relation", "jetons", "cartes"],
      "thumbnail": "assets/img/thumbnails/splat/splat.png?v=2",
      "cardDescription": "Générer des cartes où une tache cache une quantité de jetons et faire raisonner sur l’inconnue."
    },
    "outils/splat_tache_barre.html": {
      "primaryNotion": "calcul-litteral",
      "primaryGroup": "generer",
      "collections": ["splat"],
      "tags": ["splat", "inconnue", "schema-barres", "fiche", "imprimer"],
      "thumbnail": "assets/img/thumbnails/splat/petit-splat.png?v=2",
      "cardDescription": "Composer une fiche de Petits Splats avec jetons cachés et schémas en barres à compléter."
    },
    "outils/splat_equations.html": {
      "primaryNotion": "equations",
      "primaryGroup": "generer",
      "collections": ["splat"],
      "tags": ["schema-barres", "equation", "inconnue", "splat", "cartes"],
      "thumbnail": "assets/img/thumbnails/splat/splat-equations.png?v=2",
      "cardDescription": "Générer des cartes d’équations où les deux côtés contiennent des jetons et des quantités cachées."
    },
    "outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html": {
      "primaryNotion": "calcul-litteral",
      "primaryGroup": "generer",
      "collections": ["tuiles-algebriques"],
      "tags": ["tuiles-algebriques", "exerciseur", "fiche", "developper", "reduire"],
      "thumbnail": "assets/img/thumbnails/tuiles-algebriques/generateur-exercices.png?v=1",
      "cardDescription": "Créer une fiche d’exercices illustrés pour développer, réduire ou compléter des expressions."
    },
    "outils/tuiles_algebriques/generateur_tuiles.html": {
      "primaryNotion": "calcul-litteral",
      "primaryGroup": "generer",
      "collections": ["tuiles-algebriques"],
      "tags": ["tuiles-algebriques", "materiel", "imprimer", "decouper", "generateur"],
      "thumbnail": "assets/img/thumbnails/tuiles-algebriques/tuiles-decouper.png?v=1",
      "cardDescription": "Personnaliser une planche de tuiles algébriques à imprimer et à découper."
    },
    "outils/fractions_multiples_problemes.pdf": {
      "primaryNotion": "fractions",
      "primaryGroup": "activites",
      "collections": [],
      "tags": ["fractions", "multiples", "divisibilite", "problemes"],
      "thumbnail": "assets/img/thumbnails/fractions/fractions-multiples-problemes.png?v=1",
      "cardDescription": "Résoudre et inventer des problèmes de fractions d’une quantité à partir de schémas en barres."
    },
    "outils/fractions_multiples_exerciseur.html": {
      "primaryNotion": "fractions",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["fractions", "multiples", "divisibilite", "exerciseur"],
      "thumbnail": "assets/img/thumbnails/fractions/generateur-fractions-multiples.png?v=1",
      "cardDescription": "Composer un diaporama ou une fiche sur les parts, les multiples et les fractions d’une quantité."
    },
    "outils/multiples_et_fractions_d_une_quantite.pdf": {
      "primaryNotion": "fractions",
      "primaryGroup": "imprimer",
      "collections": [],
      "tags": ["fractions", "multiples", "divisibilite", "quantite"],
      "thumbnail": "assets/img/thumbnails/fractions/fractions-quantite.png?v=1",
      "cardDescription": "Modéliser une fraction d’une quantité avec des schémas en barres à observer et à compléter."
    },
    "outils/fractions/fractions_produit_manipulation.html": {
      "primaryNotion": "fractions",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["fractions", "produit", "aire", "manipulation"],
      "thumbnail": "assets/img/thumbnails/fractions/produit-fractions.png?v=1",
      "cardDescription": "Visualiser le produit de deux fractions en superposant des partages horizontaux et verticaux."
    },
    "outils/fractions/gabarits_fractions.pdf": {
      "primaryNotion": "fractions",
      "primaryGroup": "imprimer",
      "collections": [],
      "tags": ["fractions", "gabarits", "bandes", "imprimer"],
      "thumbnail": "assets/img/thumbnails/fractions/gabarits-fractions.png?v=1",
      "cardDescription": "Imprimer des bandes de fractions colorées et une version à compléter."
    },
    "outils/fractions/disque_maker.html": {
      "primaryNotion": "fractions",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["fractions", "disques", "generateur", "imprimer"],
      "thumbnail": "assets/img/thumbnails/fractions/generateur-disques.png?v=1",
      "cardDescription": "Créer des disques fractionnaires personnalisés prêts à imprimer et à découper."
    },
    "outils/fractions/bandes_maker_v2.html": {
      "primaryNotion": "fractions",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["fractions", "bandes", "generateur", "imprimer"],
      "thumbnail": "assets/img/thumbnails/fractions/generateur-bandes.png?v=1",
      "cardDescription": "Créer des bandes fractionnaires recto verso avec les dénominateurs et couleurs choisis."
    },
    "outils/fractions/mur_fractions.html": {
      "primaryNotion": "fractions",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["fractions", "mur", "equivalences", "comparaison"],
      "thumbnail": "assets/img/thumbnails/fractions/mur-fractions.png?v=1",
      "cardDescription": "Construire un mur de fractions pour comparer les parts et repérer des équivalences."
    },
    "outils/fractions/bandes_fractions.html": {
      "primaryNotion": "fractions",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["fractions", "bandes", "manipulation"],
      "thumbnail": "assets/img/thumbnails/fractions/bandes-fractions.png?v=1",
      "cardDescription": "Manipuler des bandes fractionnaires et composer des égalités de longueurs."
    },
    "outils/fractions/disques_fractions.html": {
      "primaryNotion": "fractions",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["fractions", "disques", "manipulation"],
      "thumbnail": "assets/img/thumbnails/fractions/disques-fractions.png?v=1",
      "cardDescription": "Assembler et comparer des secteurs de disques pour représenter des fractions."
    },
    "outils/fabrication_materiel/cartes_premiers_1_100.html": {
      "primaryNotion": "divisibilite",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["divisibilite", "nombres-premiers", "decomposition", "diviseurs", "cartes"],
      "thumbnail": "assets/img/thumbnails/divisibilite/cartes-nombres.png?v=1",
      "cardDescription": "Créer des cartes recto verso avec décomposition, critères et listes de diviseurs."
    },
    "outils/fabrication_materiel/grille_de_nombres.html": {
      "primaryNotion": "divisibilite",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["divisibilite", "grille", "crible", "nombres-entiers"],
      "thumbnail": "assets/img/thumbnails/divisibilite/grille-numerique.png?v=1",
      "cardDescription": "Composer une grille numérique personnalisée, de 1 à 100 ou sur une plage choisie."
    },
    "outils/plateaux_manipulation/mur_diviseurs.html": {
      "primaryNotion": "divisibilite",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["divisibilite", "diviseurs", "multiplication", "mur"],
      "thumbnail": "assets/img/thumbnails/divisibilite/mur-diviseurs.png?v=1",
      "cardDescription": "Visualiser tous les diviseurs d’un nombre sous forme de lignes de parts égales."
    },
    "outils/plateaux_manipulation/mur_diviseurs_pgcd.html": {
      "primaryNotion": "divisibilite",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["divisibilite", "diviseurs-communs", "pgcd", "mur"],
      "thumbnail": "assets/img/thumbnails/divisibilite/mur-diviseurs-pgcd.png?v=1",
      "cardDescription": "Comparer deux murs de diviseurs pour repérer les diviseurs communs et le PGCD."
    },
    "outils/plateaux_manipulation/pgcd_sachets.html": {
      "primaryNotion": "divisibilite",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["divisibilite", "partage", "paquets", "diviseurs-communs", "pgcd"],
      "thumbnail": "assets/img/thumbnails/divisibilite/partages-pgcd.png?v=1",
      "cardDescription": "Chercher le plus grand nombre de paquets identiques en manipulant deux quantités."
    },
    "outils/plateaux_manipulation/feuille_coupee_puissance.html": {
      "primaryNotion": "puissances",
      "primaryGroup": "activites",
      "collections": [],
      "tags": ["puissances", "exposants", "doublement", "narration-recherche"],
      "thumbnail": "assets/img/thumbnails/puissances/decoupage-puissances.png?v=1",
      "cardDescription": "Découper une feuille virtuellement pour observer le doublement du nombre de morceaux et de l’épaisseur."
    },
    "outils/engrenages/engrenages_plateau.html": {
      "primaryNotion": "proportionnalite",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["proportionnalite", "engrenages", "ratio", "sens-rotation", "vitesse"],
      "thumbnail": "assets/img/thumbnails/proportionnalite/engrenages.png?v=1",
      "cardDescription": "Manipuler des roues dentées pour relier nombres de dents, sens de rotation et rapports de vitesses."
    },
    "outils/engrenages/engrenages_exerciseur.html": {
      "primaryNotion": "proportionnalite",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["proportionnalite", "engrenages", "exerciseur", "ratio", "sens-rotation"],
      "thumbnail": "assets/img/thumbnails/proportionnalite/exercices-engrenages.png?v=1",
      "cardDescription": "Générer des questions illustrées sur les engrenages, avec réponse et correction détaillée."
    },
    "outils/plateaux_manipulation/ratio.html": {
      "primaryNotion": "proportionnalite",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["proportionnalite", "ratio", "fractions", "pourcentages", "schema-barres"],
      "thumbnail": "assets/img/thumbnails/proportionnalite/labo-ratios.png?v=1",
      "cardDescription": "Composer un mélange et observer simultanément son ratio, ses fractions et ses pourcentages."
    },
    "outils/plateaux_manipulation/puzzle_brousseau.html": {
      "primaryNotion": "proportionnalite",
      "primaryGroup": "activites",
      "collections": [],
      "tags": ["proportionnalite", "agrandissement", "reduction", "puzzle", "brousseau"],
      "thumbnail": "assets/img/thumbnails/proportionnalite/puzzle-brousseau.png?v=1",
      "cardDescription": "Étudier agrandissement et réduction à partir des six pièces du puzzle de Brousseau."
    },
    "outils/gabarits_pourcentages.pdf": {
      "primaryNotion": "pourcentages",
      "primaryGroup": "gabarits",
      "collections": [],
      "tags": ["pourcentages", "gabarits", "schema-barres", "imprimer"],
      "thumbnail": "assets/img/thumbnails/pourcentages/gabarits-pourcentages.png?v=1",
      "cardDescription": "Imprimer des schémas en barres partagés en demis, quarts, cinquièmes, dixièmes et centièmes."
    },
    "outils/pourcentages_exerciceur.html": {
      "primaryNotion": "pourcentages",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["pourcentages", "exerciseur", "diaporama", "fiche", "evolutions"],
      "thumbnail": "assets/img/thumbnails/pourcentages/generateur-pourcentages.png?v=1",
      "cardDescription": "Composer un diaporama ou une fiche sur les parts, les taux, le tout et les évolutions."
    },
    "outils/gabarit_pourcentages_double_ligne_graduee.pdf": {
      "primaryNotion": "pourcentages",
      "primaryGroup": "gabarits",
      "collections": [],
      "tags": ["pourcentages", "double-ligne-graduee", "grandeur", "gabarit", "imprimer"],
      "thumbnail": "assets/img/thumbnails/pourcentages/double-ligne-graduee.png?v=1",
      "cardDescription": "Mettre en correspondance un pourcentage et une grandeur sur des doubles lignes graduées."
    },
    "outils/pourcentages_recherche.pdf": {
      "primaryNotion": "pourcentages",
      "primaryGroup": "activites",
      "collections": [],
      "tags": ["pourcentages", "enquetes", "problemes", "recherche", "schema-barres"],
      "thumbnail": "assets/img/thumbnails/pourcentages/recherche-pourcentages.png?v=1",
      "cardDescription": "Mener des missions et enquêtes progressives à partir de schémas en barres et de situations concrètes."
    },
    "outils/conversions/conversions_exerciseur.html": {
      "primaryNotion": "conversions",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["conversions", "unites", "ordres-de-grandeur", "exerciseur", "diaporama"],
      "thumbnail": "assets/img/thumbnails/conversions/generateur-conversions.png?v=1",
      "cardDescription": "Générer des questions de conversion et d’ordre de grandeur avec aides visuelles et correction."
    },
    "outils/conversions/conversions_materiel.html": {
      "primaryNotion": "conversions",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["conversions", "glisse-unite", "materiel", "imprimer", "generateur"],
      "thumbnail": "assets/img/thumbnails/conversions/glisse-unite-imprimer.png?v=1",
      "cardDescription": "Créer un glisse-unité personnalisé à imprimer et à assembler pour la classe."
    },
    "outils/conversions/conversions_materiel_virtuel.html": {
      "primaryNotion": "conversions",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["conversions", "glisse-unite", "decimaux", "manipulation", "tableau"],
      "thumbnail": "assets/img/thumbnails/conversions/glisse-unite.png?v=1",
      "cardDescription": "Déplacer l’unité de mesure et les chiffres dans un glisse-unité virtuel."
    },
    "outils/conversions/conversions_unites_aires.html": {
      "primaryNotion": "conversions",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["conversions", "aires", "unites-carrees", "manipulation", "visualisation"],
      "thumbnail": "assets/img/thumbnails/conversions/unites-aires.png?v=1",
      "cardDescription": "Visualiser la relation entre unités d’aire en décomposant un carré unité."
    },
    "outils/conversions/conversions_unites_volumes.html": {
      "primaryNotion": "conversions",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["conversions", "volumes", "unites-cubes", "3d", "visualisation"],
      "thumbnail": "assets/img/thumbnails/conversions/unites-volumes.png?v=1",
      "cardDescription": "Explorer en 3D la relation entre millimètre cube, centimètre cube et unités supérieures."
    },
    "outils/angles/anglebarre.html": {
      "primaryNotion": "angles",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["angles", "triangle", "somme-des-angles", "raisonnement"],
      "thumbnail": "assets/img/thumbnails/angles/anglebarre.png?v=1",
      "cardDescription": "Résoudre pas à pas des problèmes sur la somme des angles d’un triangle à l’aide d’un schéma en barres."
    },
    "outils/angles/bandes_magnetiques.html": {
      "primaryNotion": "angles",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["angles", "bandes-magnetiques", "construction", "rapporteur", "manipulation"],
      "thumbnail": "assets/img/thumbnails/angles/bandes-magnetiques.png?v=1",
      "cardDescription": "Construire librement des angles et des figures avec des bandes magnétiques, un rapporteur et une équerre."
    },
    "outils/angles/gabarits_angles.html": {
      "primaryNotion": "angles",
      "primaryGroup": "manipuler",
      "collections": [],
      "tags": ["angles", "gabarits", "comparaison", "rapporteur", "manipulation"],
      "thumbnail": "assets/img/thumbnails/angles/gabarits-angles.png?v=1",
      "cardDescription": "Superposer, comparer et mesurer des gabarits d’angles directement sur un plateau interactif."
    },
    "outils/angles/gabarits_angles_generateur.html": {
      "primaryNotion": "angles",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["angles", "gabarits", "generateur", "imprimer", "materiel"],
      "thumbnail": "assets/img/thumbnails/angles/generateur-gabarits.png?v=1",
      "cardDescription": "Composer une planche de gabarits d’angles aux mesures, couleurs et formats choisis."
    },
    "outils/angles/generateur-rapporteurs-calque.html": {
      "primaryNotion": "angles",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["angles", "rapporteur", "generateur", "calque", "imprimer"],
      "thumbnail": "assets/img/thumbnails/angles/rapporteurs-calque.png?v=1",
      "cardDescription": "Créer une feuille A4 de rapporteurs personnalisés à imprimer sur papier calque."
    },
    "outils/problemes_barres.html": {
      "primaryNotion": "schemas-barres",
      "primaryGroup": "generer",
      "collections": [],
      "tags": ["schema-barres", "resolution-problemes", "generateur", "partie-tout", "equation"],
      "thumbnail": "assets/img/thumbnails/schemas-barres/generateur-problemes.png?v=1",
      "cardDescription": "Générer et résoudre pas à pas des problèmes avec schéma en barres, équation et fiche imprimable."
    },
    "outils/plateaux_manipulation/moulin_pythagore.html": {
      "primaryNotion": "pythagore",
      "collections": [],
      "tags": ["puzzle", "aires", "pythagore"],
      "thumbnail": "assets/img/thumbnails/moulin-pythagore-capture.svg?v=7",
      "cardDescription": "Déplacer les pièces de puzzles pour visualiser l’égalité des aires du théorème de Pythagore."
    },
    "outils/pythabarre.html": {
      "primaryNotion": "pythagore",
      "collections": [],
      "tags": ["schema-barres", "moulin", "pythagore"],
      "thumbnail": "assets/img/thumbnails/pythabarre-capture.svg?v=6",
      "cardDescription": "Dérouler le théorème pas à pas avec le calcul, le schéma en barres et le moulin de Pythagore."
    },
    "outils/pythabarre_recto_verso.pdf": {
      "primaryNotion": "pythagore",
      "collections": [],
      "tags": ["schema-barres", "moulin", "pythagore", "gabarit", "imprimable"],
      "thumbnail": "assets/img/thumbnails/pythagore/gabarit-pythagore.png?v=1",
      "cardDescription": "Guider pas à pas le calcul d’une longueur avec les carrés colorés, le schéma en barres et une rédaction structurée."
    },
    "outils/gabarit_reciproque_pythagore.pdf": {
      "primaryNotion": "pythagore",
      "collections": [],
      "tags": ["pythagore", "reciproque", "contraposee", "gabarit", "imprimable"],
      "thumbnail": "assets/img/thumbnails/pythagore/gabarit-reciproque-pythagore.png?v=1",
      "cardDescription": "Comparer séparément le carré du plus grand côté et la somme des deux autres carrés, puis rédiger la conclusion adaptée."
    },
    "outils/fiche_reciproque_thales.pdf": {
      "primaryNotion": "thales",
      "collections": [],
      "tags": ["thales", "reciproque", "contraposee", "imprimable"],
      "thumbnail": "assets/img/thumbnails/thales/reciproque-contraposee.png?v=1",
      "cardDescription": "Méthode guidée, fiche adaptable et deux exemples rédigés pour démontrer que des droites sont parallèles ou non."
    },
    "outils/fiche_thales_criteres_a_verifier.pdf": {
      "primaryNotion": "thales",
      "collections": [],
      "tags": ["thales", "reciproque", "contraposee", "criteres", "imprimable", "a-verifier"],
      "thumbnail": "assets/img/thumbnails/thales/tester-parallelisme-a-verifier.png?v=1",
      "cardDescription": "Proposition à vérifier : comprendre puis appliquer un critère de parallélisme ou de non-parallélisme."
    },
    "outils/fiche_thales_direct_a_verifier.pdf": {
      "primaryNotion": "thales",
      "collections": [],
      "tags": ["thales", "theoreme-direct", "longueur", "proportionnalite", "imprimable", "a-verifier"],
      "thumbnail": "assets/img/thumbnails/thales/thales-direct-a-verifier.png?v=1",
      "cardDescription": "Proposition à vérifier : tableau de proportionnalité, choix des colonnes et rédaction pour calculer une longueur."
    },
    "outils/gabarits_proportionnalite_tableaux.pdf": { "primaryNotion": "proportionnalite", "collections": [], "tags": ["proportionnalite", "tableau", "gabarit", "imprimable"] },
    "outils/gabarit_proportionnalite_double_ligne_graduee.pdf": { "primaryNotion": "proportionnalite", "collections": [], "tags": ["proportionnalite", "double-ligne-graduee", "gabarit", "imprimable"] },
    "outils/gabarit_proportionnalite_tableau_sans_coefficient.pdf": { "primaryNotion": "proportionnalite", "collections": [], "tags": ["proportionnalite", "tableau", "sans-coefficient", "gabarit", "imprimable"] },
    "outils/angles/fiche_angles_triangles.pdf": { "primaryNotion": "angles", "collections": [], "tags": ["angles", "triangles", "imprimable"] }
  },
  "resourceFamilies": [
    {
      "id": "cours-tuiles-algebriques",
      "title": "Cours avec les tuiles algébriques",
      "description": "Choisir la version couleur du livret.",
      "cardDescription": "Le même livret d’activités proposé dans quatre styles de tuiles.",
      "thumbnail": "assets/img/thumbnails/tuiles-algebriques/livrets.png?v=1",
      "group": "cours",
      "labels": {
        "outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf": "Blanc et gris",
        "outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf": "Bleu et jaune",
        "outils/tuiles_algebriques/livret_litteral_mathigon.pdf": "Mathigon",
        "outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf": "Vert et rouge"
      },
      "paths": [
        "outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf",
        "outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf",
        "outils/tuiles_algebriques/livret_litteral_mathigon.pdf",
        "outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf"
      ]
    },
    {
      "id": "plateaux-nombres-relatifs",
      "title": "Plateaux de manipulation",
      "description": "Choisir le plateau de nombres relatifs.",
      "cardDescription": "Manipuler les jetons, former des paires zéro, additionner et soustraire.",
      "thumbnail": "assets/img/thumbnails/relatifs/plateaux-relatifs.png?v=1",
      "group": "manipuler",
      "labels": {
        "outils/nombres_relatifs/nombres_relatifs_somme_difference.html": "Version A — addition et soustraction",
        "outils/nombres_relatifs/nombres_relatifs_somme_differenceB.html": "Version B — soustraction",
        "outils/nombres_relatifs/nombres_relatifs_somme_differenceBClaire.html": "Version B claire",
        "outils/nombres_relatifs/nombres_relatifs_somme_differenceC.html": "Version C — expert",
        "outils/nombres_relatifs/nombres_relatifs_somme_differenceD.html": "Version D — expert avec annulation"
      },
      "paths": [
        "outils/nombres_relatifs/nombres_relatifs_somme_difference.html",
        "outils/nombres_relatifs/nombres_relatifs_somme_differenceB.html",
        "outils/nombres_relatifs/nombres_relatifs_somme_differenceBClaire.html",
        "outils/nombres_relatifs/nombres_relatifs_somme_differenceC.html",
        "outils/nombres_relatifs/nombres_relatifs_somme_differenceD.html"
      ]
    },
    {
      "id": "cours-nombres-relatifs",
      "title": "Cours imprimables — nombres relatifs",
      "description": "Choisir la version graphique du cours.",
      "cardDescription": "Le même recueil avec plusieurs styles de jetons.",
      "thumbnail": "assets/img/thumbnails/relatifs/cours-relatifs.png?v=1",
      "group": "cours",
      "labels": {
        "outils/nombres_relatifs/nombres_relatifs_couleur_mathsgo.pdf": "Couleurs maths&go",
        "outils/nombres_relatifs/nombres_relatifs_vert_rouge_ecriture_blanche.pdf": "Rouge et vert",
        "outils/nombres_relatifs/nombres_relatifs_gris_blanc.pdf": "Gris et blanc",
        "outils/nombres_relatifs/nombres_relatifs_vert_rouge_contour_noir.pdf": "Contour noir"
      },
      "paths": [
        "outils/nombres_relatifs/nombres_relatifs_couleur_mathsgo.pdf",
        "outils/nombres_relatifs/nombres_relatifs_vert_rouge_ecriture_blanche.pdf",
        "outils/nombres_relatifs/nombres_relatifs_gris_blanc.pdf",
        "outils/nombres_relatifs/nombres_relatifs_vert_rouge_contour_noir.pdf"
      ]
    },
    {
      "id": "detective-des-grandeurs",
      "title": "Détective des grandeurs",
      "description": "Choisir une série de problèmes additifs ou multiplicatifs.",
      "cardDescription": "Des enquêtes progressives pour identifier les grandeurs et modéliser les relations.",
      "thumbnail": "assets/img/thumbnails/schemas-barres/detective-grandeurs.png?v=1",
      "group": "activites",
      "labels": {
        "outils/detective_des_grandeurs_additive__1.pdf": "Situations additives — série 1",
        "outils/detective_des_grandeurs_additive__2.pdf": "Situations additives — série 2",
        "outils/detective_des_grandeurs_multiplicative__1.pdf": "Situations multiplicatives"
      },
      "paths": [
        "outils/detective_des_grandeurs_additive__1.pdf",
        "outils/detective_des_grandeurs_additive__2.pdf",
        "outils/detective_des_grandeurs_multiplicative__1.pdf"
      ]
    },
    {
      "id": "gabarits-schemas-barres",
      "title": "Gabarits de schémas en barres",
      "description": "Choisir le gabarit à imprimer selon la structure du problème.",
      "cardDescription": "Des supports guidés pour les enquêtes additives, multiplicatives et les partages équitables.",
      "thumbnail": "assets/img/thumbnails/schemas-barres/gabarits-enquetes.png?v=1",
      "group": "gabarits",
      "labels": {
        "outils/gabarits_enquetes_additive.pdf": "Enquêtes additives",
        "outils/gabarits_enquetes_multiplicative.pdf": "Enquêtes multiplicatives",
        "outils/gabarits_partage_equitable_2_3_4_5.pdf": "Partages équitables en 2, 3, 4 ou 5"
      },
      "paths": [
        "outils/gabarits_enquetes_additive.pdf",
        "outils/gabarits_enquetes_multiplicative.pdf",
        "outils/gabarits_partage_equitable_2_3_4_5.pdf"
      ]
    }
  ],
  "domains": [
    {
      "id": "nombres-calculs",
      "title": "Nombres et calculs",
      "short": "Comprendre les nombres, calculer et raisonner.",
      "color": "#0b67b2",
      "soft": "#eaf5ff"
    },
    {
      "id": "proportionnalite-mesures",
      "title": "Proportionnalité, fonctions et grandeurs",
      "short": "Comparer, mesurer, représenter des dépendances et modéliser.",
      "color": "#d86b16",
      "soft": "#fff2e7"
    },
    {
      "id": "algebre",
      "title": "Calcul littéral et algèbre",
      "short": "Représenter l’inconnu, généraliser et résoudre.",
      "color": "#7b42b4",
      "soft": "#f5edff"
    },
    {
      "id": "geometrie",
      "title": "Espace et géométrie",
      "short": "Construire, manipuler et démontrer.",
      "color": "#087f78",
      "soft": "#e8f8f5"
    },
    {
      "id": "donnees",
      "title": "Données, statistiques et probabilités",
      "short": "Organiser, représenter et interpréter des données.",
      "color": "#be3e68",
      "soft": "#fff0f5"
    },
    {
      "id": "informatique",
      "title": "Pensée informatique",
      "short": "Décomposer, programmer et raisonner avec des algorithmes.",
      "color": "#4f5fb3",
      "soft": "#eef0ff"
    },
    {
      "id": "jeux-recherches",
      "title": "Jeux, recherches et explorations",
      "short": "Chercher, conjecturer et élaborer une stratégie.",
      "color": "#2f6d3f",
      "soft": "#edf8ef"
    },
    {
      "id": "cps",
      "title": "Compétences psychosociales",
      "short": "Se connaître, coopérer et avancer avec confiance.",
      "color": "#b84f7b",
      "soft": "#fff0f6"
    }
  ],
  "notions": [
    {
      "id": "numeration",
      "title": "Numération",
      "domain": "nombres-calculs"
    },
    {
      "id": "divisibilite",
      "title": "Nombres entiers et divisibilité",
      "domain": "nombres-calculs"
    },
    {
      "id": "relatifs",
      "title": "Nombres relatifs",
      "domain": "nombres-calculs"
    },
    {
      "id": "fractions",
      "title": "Fractions et nombres rationnels",
      "domain": "nombres-calculs"
    },
    {
      "id": "puissances",
      "title": "Puissances",
      "domain": "nombres-calculs"
    },
    {
      "id": "racines-carrees",
      "title": "Racines carrées",
      "domain": "nombres-calculs"
    },
    {
      "id": "calcul-mental",
      "title": "Calcul mental et automatismes",
      "domain": "nombres-calculs"
    },
    {
      "id": "proportionnalite",
      "title": "Proportionnalité et ratios",
      "domain": "proportionnalite-mesures"
    },
    {
      "id": "pourcentages",
      "title": "Pourcentages",
      "domain": "proportionnalite-mesures"
    },
    {
      "id": "fonctions",
      "title": "Fonctions",
      "domain": "proportionnalite-mesures"
    },
    {
      "id": "conversions",
      "title": "Conversions",
      "domain": "proportionnalite-mesures"
    },
    {
      "id": "aires-perimetres",
      "title": "Aires et périmètres",
      "domain": "proportionnalite-mesures"
    },
    {
      "id": "temps-durees",
      "title": "Temps et durées",
      "domain": "proportionnalite-mesures"
    },
    {
      "id": "calcul-litteral",
      "title": "Expressions littérales et tuiles",
      "domain": "algebre"
    },
    {
      "id": "equations",
      "title": "Équations et représentations",
      "domain": "algebre"
    },
    {
      "id": "schemas-barres",
      "title": "Schémas en barres",
      "domain": "nombres-calculs"
    },
    {
      "id": "patterns",
      "title": "Patterns et généralisation",
      "domain": "algebre"
    },
    {
      "id": "reperage",
      "title": "Repérage",
      "domain": "geometrie"
    },
    {
      "id": "transformations",
      "title": "Transformations",
      "domain": "geometrie"
    },
    {
      "id": "angles",
      "title": "Angles",
      "domain": "geometrie"
    },
    {
      "id": "triangles",
      "title": "Triangles",
      "domain": "geometrie"
    },
    {
      "id": "parallelogrammes",
      "title": "Parallélogrammes",
      "domain": "geometrie"
    },
    {
      "id": "pythagore",
      "title": "Pythagore",
      "domain": "geometrie"
    },
    {
      "id": "thales",
      "title": "Thalès",
      "domain": "geometrie"
    },
    {
      "id": "espace-constructions",
      "title": "Espace, solides et patrons",
      "domain": "geometrie"
    },
    {
      "id": "statistiques",
      "title": "Statistiques",
      "domain": "donnees"
    },
    {
      "id": "probabilites",
      "title": "Probabilités",
      "domain": "donnees"
    },
    {
      "id": "pensee-informatique",
      "title": "Pensée informatique",
      "domain": "informatique"
    },
    {
      "id": "strategie",
      "title": "Jeux de stratégie",
      "domain": "jeux-recherches"
    },
    {
      "id": "explorations",
      "title": "Explorations mathématiques",
      "domain": "jeux-recherches"
    },
    {
      "id": "bilans-cps",
      "title": "Bilans et connaissance de soi",
      "domain": "cps"
    }
  ],
  "resources": [
    {
      "id": "outils-bouliers-abaque-de-gerbert-abaque-gerbert-addition-html",
      "title": "Abaque de Gerbert – Additions",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/abaque_de_gerbert/abaque_gerbert_addition.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-abaque-de-gerbert-abaque-gerbert-multiplication-v1-html",
      "title": "Abaque de Gerbert – Multiplications",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/abaque_de_gerbert/abaque_gerbert_multiplication_V1.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "hidden",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-abaque-de-gerbert-abaque-gerbert-multiplication-v2-html",
      "title": "Abaque de Gerbert – Multiplications",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/abaque_de_gerbert/abaque_gerbert_multiplication_V2.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "hidden",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-abaque-de-gerbert-abaque-gerbert-multiplication-v3-html",
      "title": "Abaque de Gerbert – Multiplications",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/abaque_de_gerbert/abaque_gerbert_multiplication_V3.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "hidden",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-abaque-de-gerbert-abaque-gerbert-soustraction-html",
      "title": "Abaque de Gerbert – Soustractions",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/abaque_de_gerbert/abaque_gerbert_soustraction.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-abaque-de-gerbert-abaque-gerbert-html",
      "title": "Abaque de Gerbert avec zéro",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/abaque_de_gerbert/abaque_gerbert.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-aire-perimetre-plateau-html",
      "title": "Aire et périmètre",
      "description": "Un plateau quadrillé pour construire des figures et comparer leur aire et leur périmètre.",
      "path": "outils/plateaux_manipulation/aire_perimetre_plateau.html",
      "domains": [
        "proportionnalite-mesures",
        "geometrie"
      ],
      "notions": [
        "aires-perimetres"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-ajouter9-ajouter8-html",
      "title": "Ajouter 9, ajouter 10",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/ajouter9_ajouter8.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-angles-anglebarre-html",
      "title": "AngleBarre",
      "description": "Résolvez pas à pas des problèmes sur la somme des angles d’un triangle quelconque, rectangle, isocèle ou équilatéral.",
      "path": "outils/angles/anglebarre.html",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "angles"
      ],
      "uses": [
        "projeter",
        "manipuler"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-conversions-conversions-unites-aires-html",
      "title": "Unités d’aire",
      "description": "Visualisez la relation entre les unités d’aire en décomposant un carré unité.",
      "path": "outils/conversions/conversions_unites_aires.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "conversions"
      ],
      "uses": [
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-conversions-conversions-unites-volumes-html",
      "title": "Unités de volume en 3D",
      "description": "Explorez en 3D les relations entre millimètre cube, centimètre cube et unités supérieures.",
      "path": "outils/conversions/conversions_unites_volumes.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "conversions"
      ],
      "uses": [
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-automatismes-automatismes-mathsgo-html",
      "title": "Automatismes",
      "description": "Générez des diaporamas d’automatismes mathématiques variés, avec aides visuelles et corrections, pour le collège et la préparation au DNB.",
      "path": "auto/",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "calcul-mental"
      ],
      "uses": [
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "dnb",
        "cycle 4",
        "diaporama"
      ],
      "kind": "tool",
      "status": "hidden",
      "featured": false,
      "recent": false
    },
    {
      "id": "auto-index-html",
      "title": "Automatismes Cycle 4 – DNB",
      "description": "Outil d’automatismes de mathématiques pour le cycle 4 et le DNB : entraînez vos élèves en vidéoprojection ou sur téléphone, avec aides et corrections.",
      "path": "auto/index.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "calcul-mental"
      ],
      "uses": [
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "dnb",
        "cycle 4",
        "diaporama"
      ],
      "kind": "tool",
      "status": "published",
      "featured": true,
      "recent": false
    },
    {
      "id": "outils-angles-bandes-magnetiques-html",
      "title": "Bandes magnétiques",
      "description": "Construisez et manipulez des angles avec des bandes magnétiques virtuelles, un rapporteur, une équerre et des outils de dessin.",
      "path": "outils/angles/bandes_magnetiques.html",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "angles"
      ],
      "uses": [
        "projeter",
        "manipuler"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-boite-bonbons-html",
      "title": "Boîte à bonbons — 3D / Cavalière / Patron",
      "description": "Une ressource maths&go pour travailler divisibilité, multiples et pgcd.",
      "path": "outils/plateaux_manipulation/boite_bonbons.html",
      "domains": [
        "nombres-calculs",
        "proportionnalite-mesures"
      ],
      "notions": [
        "divisibilite",
        "proportionnalite"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "review",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-boite-bonbons-3d-toutes-boites-html",
      "title": "Boîte à bonbons — 3D / Cavalière / Patron",
      "description": "Une ressource maths&go pour travailler divisibilité, multiples et pgcd.",
      "path": "outils/plateaux_manipulation/boite_bonbons_3d_toutes_boites.html",
      "domains": [
        "nombres-calculs",
        "proportionnalite-mesures"
      ],
      "notions": [
        "divisibilite",
        "proportionnalite"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "review",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-rekenrek-fd-html",
      "title": "Boulier Canari - Version Centièmes",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/rekenrek_FD.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-boulier-montessori-boulier-cycle3-petit-additions-soustractions-html",
      "title": "Boulier Montessori – Opérations (Layout)",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/boulier_montessori/boulier-cycle3-petit-additions-soustractions.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-boulier-montessori-boulier-cycle3-petit-placer-nombres-html",
      "title": "Boulier Montessori – Placer le nombre",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/boulier_montessori/boulier-cycle3-petit-placer-nombres.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-boulier-montessori-boulier-cycle3-petit-html",
      "title": "Boulier Montessori (Final)",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/boulier_montessori/boulier-cycle3-petit.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-boulier-montessori-transition-rekenrek-montessori-html",
      "title": "Boulier Rekenrek",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/boulier_montessori/transition_rekenrek-montessori.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-rekenrek-html",
      "title": "Boulier Rekenrek Pro - Version Équilibre",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/rekenrek.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-box-barre-final-html",
      "title": "BOX LOGIC — L'INTÉGRALE",
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
      "path": "outils/box_barre_final.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "projeter"
      ],
      "types": [],
      "filters": [],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "tool",
      "status": "hidden",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-box-pasbarre-final-html",
      "title": "BOX LOGIC — L'INTÉGRALE",
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
      "path": "outils/box_pasbarre_final.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "projeter"
      ],
      "types": [],
      "filters": [],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "tool",
      "status": "hidden",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-tuiles-algebriques-tuiles-algebriques-html",
      "title": "Tuiles algébriques — expressions",
      "description": "Composez, ordonnez et simplifiez des expressions avec les tuiles x², x et 1.",
      "path": "outils/tuiles_algebriques/tuiles_algebriques.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "tuiles algébriques"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-tuiles-algebriques-tuiles-algebriques-mode-equation-html",
      "title": "Tuiles algébriques — équations",
      "description": "Posez puis résolvez une équation du premier degré en manipulant les deux membres.",
      "path": "outils/tuiles_algebriques/tuiles_algebriques_mode_equation.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral",
        "equations"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "tuiles algébriques"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-club-maths-jeu-du-chaos-html",
      "title": "Jeu du chaos",
      "description": "Une exploration aléatoire qui fait apparaître le triangle de Sierpiński et propose un prolongement avec Scratch.",
      "path": "outils/club_maths/jeu_du_chaos.html",
      "domains": [
        "jeux-recherches"
      ],
      "notions": [
        "strategie",
        "explorations"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-club-maths-tables-modulaires-html",
      "title": "Tables modulaires",
      "description": "Une exploration visuelle des courbes créées par les tables de multiplication sur un cercle.",
      "path": "outils/club_maths/tables_modulaires.html",
      "domains": [
        "jeux-recherches"
      ],
      "notions": [
        "strategie",
        "explorations"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-detective-des-grandeurs-additive-1-pdf",
      "title": "Détective des grandeurs — situations additives 1",
      "description": "Une première série d’enquêtes additives pour identifier les grandeurs et leurs relations.",
      "path": "outils/detective_des_grandeurs_additive__1.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-detective-des-grandeurs-additive-2-pdf",
      "title": "Détective des grandeurs — situations additives 2",
      "description": "Neuf pages d’enquêtes additives progressives, de la combinaison à la comparaison.",
      "path": "outils/detective_des_grandeurs_additive__2.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-detective-des-grandeurs-multiplicative-1-pdf",
      "title": "Détective des grandeurs — situations multiplicatives",
      "description": "Trois pages d’enquêtes multiplicatives sur les groupes égaux, les comparaisons et les partages.",
      "path": "outils/detective_des_grandeurs_multiplicative__1.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-engrenages-engrenages-plateau-html",
      "title": "Engrenages",
      "description": "Manipulez des roues dentées pour étudier les rapports de vitesses, les sens de rotation et les positions relatives.",
      "path": "outils/engrenages/engrenages_plateau.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "proportionnalite"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "engrenages"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-engrenages-plateau-html",
      "title": "Engrenages",
      "description": "Une ressource maths&go pour travailler proportionnalité et ratios.",
      "path": "outils/plateaux_manipulation/engrenages_plateau.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "proportionnalite"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "engrenages"
      ],
      "kind": "tool",
      "status": "review",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-enlever9-enlever8-html",
      "title": "Enlever 9, enlever10",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/enlever9_enlever8.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-equabarre-html",
      "title": "ÉquaBarre",
      "description": "Représentez une équation par deux schémas en barres et transformez les deux membres pas à pas.",
      "path": "outils/equabarre.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "equations",
        "schemas-barres"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-equasplat-html",
      "title": "ÉquaSplat",
      "description": "Construisez une équation avec des taches et des jetons puis agissez de la même façon sur les deux membres.",
      "path": "outils/equasplat.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral",
        "equations",
        "schemas-barres"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "splat",
        "inconnue",
        "relation",
        "calcul littéral"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-feuille-coupee-puissance-html",
      "title": "Puissances par découpage",
      "description": "Découper une feuille virtuellement pour observer le doublement du nombre de morceaux et de l’épaisseur.",
      "path": "outils/plateaux_manipulation/feuille_coupee_puissance.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "puissances"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-force-5-html",
      "title": "Force 5 - Version Pro",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/force_5.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-force-5-soustraction-html",
      "title": "Force 5 - Version Pro",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/force_5_soustraction.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fractions-fractions-produit-manipulation-html",
      "title": "Produit de fractions",
      "description": "Visualiser le produit de deux fractions en superposant des partages horizontaux et verticaux.",
      "path": "outils/fractions/fractions_produit_manipulation.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fractions-multiples-problemes-pdf",
      "title": "Fractions et multiples — problèmes",
      "description": "Résoudre et inventer des problèmes de fractions d’une quantité à partir de schémas en barres.",
      "path": "outils/fractions_multiples_problemes.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions",
        "divisibilite"
      ],
      "uses": [
        "imprimer",
        "entrainer",
        "manipuler",
        "projeter"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-angles-gabarits-angles-html",
      "title": "Gabarits d’angles",
      "description": "Manipulez, superposez et comparez des gabarits d’angles avec un rapporteur, une équerre, une règle et des outils de dessin.",
      "path": "outils/angles/gabarits_angles.html",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "angles"
      ],
      "uses": [
        "projeter",
        "imprimer"
      ],
      "types": [
        "plateau",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-angles-fiche-angles-triangles-pdf",
      "title": "Fiche — angles dans les triangles",
      "description": "Une fiche progressive à imprimer pour calculer, vérifier et raisonner avec la somme des angles d’un triangle.",
      "path": "outils/angles/fiche_angles_triangles.pdf",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "angles",
        "triangles"
      ],
      "uses": [
        "imprimer",
        "entrainer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "somme des angles",
        "triangle rectangle",
        "triangle isocèle"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-angles-gabarits-angles-generateur-html",
      "title": "Générateur de gabarits d’angles",
      "description": "Créez gratuitement des gabarits d’angles personnalisés à imprimer : mesures, arcs, couleurs et plusieurs formats par page.",
      "path": "outils/angles/gabarits_angles_generateur.html",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "angles"
      ],
      "uses": [
        "projeter",
        "imprimer"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-gabarits-enquetes-additive-pdf",
      "title": "Gabarits d’enquêtes additives",
      "description": "Deux pages de gabarits guidés pour représenter et résoudre les enquêtes additives.",
      "path": "outils/gabarits_enquetes_additive.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-gabarits-enquetes-multiplicative-pdf",
      "title": "Gabarits d’enquêtes multiplicatives",
      "description": "Sept pages de gabarits pour représenter les structures multiplicatives et vérifier les calculs.",
      "path": "outils/gabarits_enquetes_multiplicative.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fractions-gabarits-fractions-pdf",
      "title": "Gabarits de fractions",
      "description": "Imprimer des bandes de fractions colorées et une version à compléter.",
      "path": "outils/fractions/gabarits_fractions.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions"
      ],
      "uses": [
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-gabarits-partage-equitable-2-3-4-5-pdf",
      "title": "Gabarits de partage équitable",
      "description": "Des gabarits à imprimer pour partager équitablement une quantité en deux, trois, quatre ou cinq parts.",
      "path": "outils/gabarits_partage_equitable_2_3_4_5.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-gabarits-pourcentages-pdf",
      "title": "Gabarits de pourcentages",
      "description": "Des schémas en barres à compléter ou déjà partagés en demis, quarts, cinquièmes, dixièmes et centièmes.",
      "path": "outils/gabarits_pourcentages.pdf",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "pourcentages"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-engrenages-engrenages-exerciseur-html",
      "title": "Générateur d’exercices — engrenages",
      "description": "Générez des questions illustrées sur les engrenages, avec réponse et correction détaillée.",
      "path": "outils/engrenages/engrenages_exerciseur.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "proportionnalite"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [
        "engrenages"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fabrication-materiel-cartes-premiers-1-100-html",
      "title": "Cartes de nombres",
      "description": "Créer des cartes recto verso avec décomposition, critères et listes de diviseurs.",
      "path": "outils/fabrication_materiel/cartes_premiers_1_100.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "divisibilite",
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "diviseurs",
        "décomposition",
        "nombres premiers",
        "cartes"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-generateur-rekenrek-cartes-html",
      "title": "Générateur de cartes Rekenrek",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/generateur_rekenrek_cartes.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur",
        "imprimable"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-conversions-conversions-exerciseur-html",
      "title": "Générateur de conversions",
      "description": "Générez des questions de conversion et d’ordre de grandeur avec aides visuelles et correction.",
      "path": "outils/conversions/conversions_exerciseur.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "conversions"
      ],
      "uses": [
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fractions-multiples-exerciseur-html",
      "title": "Générateur de fractions et multiples",
      "description": "Composer un diaporama ou une fiche sur les parts, les multiples et les fractions d’une quantité.",
      "path": "outils/fractions_multiples_exerciseur.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions",
        "divisibilite"
      ],
      "uses": [
        "manipuler",
        "entrainer",
        "projeter"
      ],
      "types": [
        "exerciseur",
        "generateur"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-conversions-conversions-materiel-html",
      "title": "Générateur de glisse-unité à imprimer",
      "description": "Créez un glisse-unité personnalisé à imprimer et à assembler pour la classe.",
      "path": "outils/conversions/conversions_materiel.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "conversions"
      ],
      "uses": [
        "projeter",
        "imprimer"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-pourcentages-exerciceur-html",
      "title": "Générateur de pourcentages",
      "description": "Générez un diaporama ou une fiche sur les parts, les pourcentages, le tout et les évolutions.",
      "path": "outils/pourcentages_exerciceur.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "pourcentages"
      ],
      "uses": [
        "entrainer",
        "projeter"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-sheet-generator-schema-partie-tout-html",
      "title": "Ancien menu des schémas en barres",
      "description": "Ancien index conservé pour assurer la continuité des liens.",
      "path": "outils/sheet_generator_schema_partie_tout.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "imprimer"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "tool",
      "status": "hidden",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fractions-disque-maker-html",
      "title": "Générateur de disques de fractions",
      "description": "Créer des disques fractionnaires personnalisés prêts à imprimer et à découper.",
      "path": "outils/fractions/disque_maker.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fractions-bandes-maker-v2-html",
      "title": "Générateur de bandes de fractions",
      "description": "Créer des bandes fractionnaires recto verso avec les dénominateurs et couleurs choisis.",
      "path": "outils/fractions/bandes_maker_v2.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-lecture-0-100-generateur2-html",
      "title": "Générateur Rekenrek — dizaines et unités",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/lecture_0_100_generateur2.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur",
        "imprimable"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-lecture-0-100-generateur-html",
      "title": "Générateur Rekenrek — lecture de 0 à 100",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/lecture_0_100_generateur.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur",
        "imprimable"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-voisins-generateur-compact-html",
      "title": "Générateur Rekenrek — nombres voisins",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/voisins_generateur_compact.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur",
        "imprimable"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-conversions-conversions-materiel-virtuel-html",
      "title": "Glisse-unité virtuel",
      "description": "Déplacez l’unité de mesure et les chiffres dans un tableau de conversion interactif.",
      "path": "outils/conversions/conversions_materiel_virtuel.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "conversions"
      ],
      "uses": [
        "projeter",
        "manipuler"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-glisse-entiers-flex-html",
      "title": "Glisse-entiers",
      "description": "Un tableau de numération pour faire glisser les chiffres et comprendre la valeur de position dans les entiers.",
      "path": "outils/plateaux_manipulation/glisse_entiers_flex.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "nombres entiers"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-glisse-nombres-decimaux-html",
      "title": "Glisse-nombres décimaux",
      "description": "Un tableau interactif pour déplacer les chiffres entre unités, dixièmes et centièmes.",
      "path": "outils/plateaux_manipulation/glisse_nombres_decimaux.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "nombres entiers"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fabrication-materiel-grille-de-nombres-html",
      "title": "Grille de nombres à imprimer",
      "description": "Composer une grille numérique personnalisée, de 1 à 100 ou sur une plage choisie.",
      "path": "outils/fabrication_materiel/grille_de_nombres.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "divisibilite",
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "grille numérique",
        "crible",
        "nombres entiers"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-nombres-relatifs-nombres-relatifs-couleur-mathsgo-pdf",
      "title": "Jetons de nombres relatifs — couleurs maths&go",
      "description": "Une ressource maths&go pour travailler nombres relatifs.",
      "path": "outils/nombres_relatifs/nombres_relatifs_couleur_mathsgo.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "relatifs"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-nombres-relatifs-nombres-relatifs-vert-rouge-ecriture-blanche-pdf",
      "title": "Jetons de nombres relatifs — écriture blanche",
      "description": "Une ressource maths&go pour travailler nombres relatifs.",
      "path": "outils/nombres_relatifs/nombres_relatifs_vert_rouge_ecriture_blanche.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "relatifs"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-nombres-relatifs-nombres-relatifs-gris-blanc-pdf",
      "title": "Jetons de nombres relatifs — gris et blanc",
      "description": "Une ressource maths&go pour travailler nombres relatifs.",
      "path": "outils/nombres_relatifs/nombres_relatifs_gris_blanc.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "relatifs"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-nombres-relatifs-nombres-relatifs-vert-rouge-contour-noir-pdf",
      "title": "Jetons de nombres relatifs — vert et rouge",
      "description": "Une ressource maths&go pour travailler nombres relatifs.",
      "path": "outils/nombres_relatifs/nombres_relatifs_vert_rouge_contour_noir.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "relatifs"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-club-maths-jeu-de-nim-html",
      "title": "Jeu de Nim — le bâton rouge",
      "description": "Un jeu de retrait pour chercher, formuler et tester une stratégie gagnante.",
      "path": "outils/club_maths/jeu_de_nim.html",
      "domains": [
        "jeux-recherches"
      ],
      "notions": [
        "strategie"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-ratio-html",
      "title": "Labo des proportions",
      "description": "Composez des mélanges à deux, trois ou quatre couleurs et comparez ratios, fractions et pourcentages.",
      "path": "outils/plateaux_manipulation/ratio.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "proportionnalite"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-boss-final-html",
      "title": "Le Challenge Calcul - Boss Final V21",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/boss_final.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "hidden",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-le-grand-pari-html",
      "title": "Le Grand Pari — sommes de dés",
      "description": "Un jeu de probabilités pour parier sur une somme et observer sa fréquence avec deux ou trois dés.",
      "path": "outils/plateaux_manipulation/le_grand_pari.html",
      "domains": [
        "jeux-recherches"
      ],
      "notions": [
        "explorations"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-grignoteur-html",
      "title": "Le Grignoteur",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/grignoteur.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-pont-dizaine-html",
      "title": "Le Pont de la Dizaine",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/pont_dizaine.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-tuiles-algebriques-livret-litteral-blanc-gris-pdf",
      "title": "Livret de calcul littéral — blanc et gris",
      "description": "Un livret d’activités de calcul littéral avec des tuiles en blanc et gris.",
      "path": "outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "tuiles algébriques"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-tuiles-algebriques-livret-litteral-bleu-jaune-pdf",
      "title": "Livret de calcul littéral — bleu et jaune",
      "description": "Un livret d’activités de calcul littéral avec des tuiles bleues et jaunes.",
      "path": "outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "tuiles algébriques"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-tuiles-algebriques-livret-litteral-mathigon-pdf",
      "title": "Livret de calcul littéral — Mathigon",
      "description": "Un livret d’activités de calcul littéral avec les couleurs de tuiles Mathigon.",
      "path": "outils/tuiles_algebriques/livret_litteral_mathigon.pdf",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "tuiles algébriques"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-tuiles-algebriques-livret-litteral-vert-rouge-pdf",
      "title": "Livret de calcul littéral — vert et rouge",
      "description": "Un livret d’activités de calcul littéral avec des tuiles vertes et rouges.",
      "path": "outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "tuiles algébriques"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-automatismes-cm-livret-a5-html",
      "title": "Livret d’automatismes A5",
      "description": "Un générateur de livret A5 en six blocs, personnalisable avec des automatismes issus de tous les domaines.",
      "path": "outils/automatismes/CM_Livret_A5.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "calcul-mental"
      ],
      "uses": [
        "projeter",
        "entrainer",
        "imprimer"
      ],
      "types": [
        "exerciseur",
        "generateur",
        "imprimable"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [
        "dnb",
        "cycle 4",
        "diaporama"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-maitre-du-temps-html",
      "title": "Disques de temps",
      "description": "Des disques recto verso pour manipuler les équivalences entre heures, minutes et secondes.",
      "path": "outils/plateaux_manipulation/maitre_du_temps.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "temps-durees"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fabrication-materiel-numeration-decimale-maker-html",
      "title": "Matériel de numération décimale",
      "description": "Un générateur de planches personnalisables d’unités, dixièmes et centièmes à imprimer.",
      "path": "outils/fabrication_materiel/numeration_decimale_maker.html",
      "domains": [
        "nombres-calculs",
        "proportionnalite-mesures"
      ],
      "notions": [
        "numeration",
        "proportionnalite"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "nombres décimaux"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fabrication-materiel-maths-barre-html",
      "title": "MathsBars — générateur de schémas en barres",
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
      "path": "outils/fabrication_materiel/maths_barre.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "projeter"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "tool",
      "status": "hidden",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-moulin-pythagore-html",
      "title": "Moulin de Pythagore",
      "description": "Déplacez les pièces de puzzles pour visualiser l’égalité des aires du théorème de Pythagore.",
      "path": "outils/plateaux_manipulation/moulin_pythagore.html",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "pythagore"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-multiples-et-fractions-d-une-quantite-pdf",
      "title": "Multiples et fractions d’une quantité",
      "description": "Modéliser une fraction d’une quantité avec des schémas en barres à observer et à compléter.",
      "path": "outils/multiples_et_fractions_d_une_quantite.pdf",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions",
        "divisibilite"
      ],
      "uses": [
        "imprimer",
        "manipuler",
        "projeter"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fractions-mur-fractions-html",
      "title": "Mur de fractions",
      "description": "Construire un mur de fractions pour comparer les parts et repérer des équivalences.",
      "path": "outils/fractions/mur_fractions.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-mur-diviseurs-html",
      "title": "Mur des diviseurs",
      "description": "Visualiser tous les diviseurs d’un nombre sous forme de lignes de parts égales.",
      "path": "outils/plateaux_manipulation/mur_diviseurs.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "divisibilite"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "diviseurs",
        "multiplication",
        "mur"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-mur-diviseurs-pgcd-html",
      "title": "Mur des diviseurs et PGCD",
      "description": "Comparer deux murs de diviseurs pour repérer les diviseurs communs et le PGCD.",
      "path": "outils/plateaux_manipulation/mur_diviseurs_pgcd.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "divisibilite"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "diviseurs communs",
        "pgcd",
        "mur"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-numeration-decimale-html",
      "title": "Plateau de numération décimale",
      "description": "Un plateau pour couper, fusionner et relier unités, dixièmes, centièmes, fractions et écritures décimales.",
      "path": "outils/plateaux_manipulation/numeration_decimale.html",
      "domains": [
        "nombres-calculs",
        "proportionnalite-mesures"
      ],
      "notions": [
        "numeration",
        "proportionnalite"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "nombres décimaux"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-nombres-relatifs-nombres-relatifs-somme-difference-html",
      "title": "Opérations Nombres Relatifs - Fusion Finale",
      "description": "Une ressource maths&go pour travailler nombres relatifs.",
      "path": "outils/nombres_relatifs/nombres_relatifs_somme_difference.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "relatifs"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-nombres-relatifs-nombres-relatifs-somme-differenced-html",
      "title": "Opérations Relatifs - Expert & Undo",
      "description": "Une ressource maths&go pour travailler nombres relatifs.",
      "path": "outils/nombres_relatifs/nombres_relatifs_somme_differenceD.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "relatifs"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-nombres-relatifs-nombres-relatifs-somme-differenceb-html",
      "title": "Opérations Relatifs - La Soustraction",
      "description": "Une ressource maths&go pour travailler nombres relatifs.",
      "path": "outils/nombres_relatifs/nombres_relatifs_somme_differenceB.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "relatifs"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-nombres-relatifs-nombres-relatifs-somme-differencebclaire-html",
      "title": "Opérations Relatifs - La Soustraction",
      "description": "Une ressource maths&go pour travailler nombres relatifs.",
      "path": "outils/nombres_relatifs/nombres_relatifs_somme_differenceBClaire.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "relatifs"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-nombres-relatifs-nombres-relatifs-somme-differencec-html",
      "title": "Opérations Relatifs - La Soustraction (Expert)",
      "description": "Une ressource maths&go pour travailler nombres relatifs.",
      "path": "outils/nombres_relatifs/nombres_relatifs_somme_differenceC.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "relatifs"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-moyennes-html",
      "title": "Moyenne — égaliser les piles",
      "description": "Une manipulation de blocs entiers ou décimaux pour construire la moyenne par répartition.",
      "path": "outils/plateaux_manipulation/moyennes.html",
      "domains": [
        "donnees"
      ],
      "notions": [
        "statistiques"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-pgcd-sachets-html",
      "title": "Partages en sachets et PGCD",
      "description": "Chercher le plus grand nombre de paquets identiques en manipulant deux quantités.",
      "path": "outils/plateaux_manipulation/pgcd_sachets.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "divisibilite"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "partage",
        "paquets",
        "diviseurs communs",
        "pgcd"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-patterns-html",
      "title": "Labo des régularités — Patterns",
      "description": "Observer, prolonger, expliquer et généraliser des motifs au collège.",
      "path": "outils/labo-des-regularites.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "patterns"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-fractions-bandes-fractions-html",
      "title": "Bandes de fractions",
      "description": "Manipuler des bandes fractionnaires et composer des égalités de longueurs.",
      "path": "outils/fractions/bandes_fractions.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "plateau",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fractions-disques-fractions-html",
      "title": "Disques de fractions",
      "description": "Assembler et comparer des secteurs de disques pour représenter des fractions.",
      "path": "outils/fractions/disques_fractions.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "fractions"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "plateau",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "fraction",
        "partage"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-gabarit-pourcentages-double-ligne-graduee-pdf",
      "title": "Pourcentages — double ligne graduée",
      "description": "Des doubles lignes graduées à imprimer pour relier pourcentages, grandeurs et unités.",
      "path": "outils/gabarit_pourcentages_double_ligne_graduee.pdf",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "pourcentages"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-prisme345-h6-patron-1-html",
      "title": "Prisme droit 3-4-5 (h=6) — Patron qui s’ouvre",
      "description": "Une ressource maths&go pour travailler espace, patrons et constructions.",
      "path": "outils/plateaux_manipulation/prisme345_h6_patron (1).html",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "espace-constructions"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "review",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-problemes-barres-html",
      "title": "Problèmes en barres",
      "description": "Générez et résolvez pas à pas des problèmes avec schéma en barres, équation et fiche imprimable.",
      "path": "outils/problemes_barres.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "projeter"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-problemes-barres-m974-html",
      "title": "Problèmes en barres — M974",
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
      "path": "outils/problemes_barres_M974.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "schemas-barres"
      ],
      "uses": [
        "projeter"
      ],
      "types": [
        "generateur"
      ],
      "filters": [],
      "keywords": [
        "problèmes",
        "modélisation"
      ],
      "kind": "tool",
      "status": "review",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-puzzle-brousseau-html",
      "title": "Puzzle de Brousseau",
      "description": "Agrandissez ou réduisez les six pièces du puzzle de Brousseau pour étudier la proportionnalité et la conservation des angles.",
      "path": "outils/plateaux_manipulation/puzzle_brousseau.html",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "proportionnalite"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-pythabarre-html",
      "title": "PythaBarre",
      "description": "Déroulez le théorème pas à pas avec le calcul, le schéma en barres et le moulin de Pythagore.",
      "path": "outils/pythabarre.html",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "pythagore",
        "schemas-barres"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-pythabarre-recto-verso-pdf",
      "title": "Gabarit Pythagore",
      "description": "Un gabarit à imprimer pour calculer une longueur avec les carrés colorés, le schéma en barres et une rédaction pas à pas.",
      "path": "outils/pythabarre_recto_verso.pdf",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "pythagore",
        "schemas-barres"
      ],
      "uses": [
        "imprimer",
        "entrainer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "triangle rectangle",
        "hypoténuse",
        "moulin de Pythagore",
        "gabarit Pythagore"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-gabarit-reciproque-pythagore-pdf",
      "title": "Gabarit réciproque et contraposé de Pythagore",
      "description": "Un gabarit à imprimer pour identifier le plus grand côté, effectuer les deux calculs séparément, les comparer et conclure correctement.",
      "path": "outils/gabarit_reciproque_pythagore.pdf",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "pythagore"
      ],
      "uses": [
        "imprimer",
        "entrainer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "triangle rectangle",
        "plus grand côté",
        "réciproque de Pythagore",
        "contraposée de Pythagore",
        "gabarit"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-angles-generateur-rapporteurs-calque-html",
      "title": "Rapporteurs à imprimer sur calque",
      "description": "Créez gratuitement une feuille A4 de rapporteurs sans nombres, gradués ou numérotés, à imprimer sur papier calque. Plusieurs formats par page.",
      "path": "outils/angles/generateur-rapporteurs-calque.html",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "angles"
      ],
      "uses": [
        "projeter",
        "imprimer"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-pourcentages-recherche-pdf",
      "title": "Pourcentages — missions et enquêtes",
      "description": "Six pages de missions et d’enquêtes progressives sur les pourcentages, avec schémas en barres et situations concrètes.",
      "path": "outils/pourcentages_recherche.pdf",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "pourcentages"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [],
      "keywords": [],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-cubes-construction-html",
      "title": "SCÈNE3D — assemblages de cubes",
      "description": "Un accès à SCÈNE3D, outil de Mathix et de l’IREM Paris-Nord pour manipuler des assemblages de cubes.",
      "path": "outils/plateaux_manipulation/cubes_construction.html",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "espace-constructions"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-jeu-des-doubles-html",
      "title": "Rekenrek - Le Jeu des Doubles Pro",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/jeu_des_doubles.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-suivant-precedent-html",
      "title": "Rekenrek - Le Voisin (Suivant/Précédent)",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/suivant_precedent.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-presque-doubles-html",
      "title": "Rekenrek - Les Presque-Doubles (Final)",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/presque_doubles.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-double-niv1-html",
      "title": "REKENREK — DOUBLES NIVEAU 1",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/double_niv1.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-double-niv2-html",
      "title": "REKENREK — DOUBLES NIVEAU 2",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/double_niv2.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-rekenrek-sheet-generator-2-difference-html",
      "title": "REKENREK — Générateur de fiches",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/rekenrek_sheet_generator_2_difference.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur",
        "imprimable"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "review",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-rekenrek-sheet-generator-somme-html",
      "title": "REKENREK — Générateur de fiches",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/rekenrek_sheet_generator_somme.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur",
        "imprimable"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "review",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-jeu-rideau-html",
      "title": "Rekenrek — jeu du rideau",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/cache cache.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-presque-double-html",
      "title": "REKENREK — PRESQUE DOUBLES",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/presque double.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-cache-cache-barre-html",
      "title": "Rekenrek — schémas et compléments",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/cache cache barre.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-tables-generateur-html",
      "title": "REKENREK — TABLES DE MULTIPLICATION",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/tables_generateur.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur",
        "imprimable"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-cache-cache-rideau-millimetre-html",
      "title": "Rekenrek Cache-Cache - Rideau Millimétré",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/cache-cache.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-comparateur-html",
      "title": "Rekenrek Comparateur - Final V27",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/comparateur.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-pousser-des-nombres-html",
      "title": "Rekenrek Constructeur - Version Pro",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/pousser_des_nombres.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-lecture-de-nombres-html",
      "title": "Rekenrek Flash - Version XL Stable",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/lecture_de_nombres.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-soroban-soroban-placement-nombres-html",
      "title": "Soroban interactif — Entraînement (vérification auto)",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/soroban/soroban-placement-nombres.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-soroban-soroban-html",
      "title": "Soroban interactif — zoom étendu + barre haute 0.30",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/soroban/soroban.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-splat-html",
      "title": "Splat — relations et inconnues",
      "description": "Générez des cartes où une tache cache une quantité de jetons et faites raisonner sur l’inconnue.",
      "path": "outils/splat.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral",
        "equations",
        "schemas-barres"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "splat",
        "inconnue",
        "relation",
        "calcul littéral"
      ],
      "kind": "tool",
      "status": "published",
      "featured": true,
      "recent": false
    },
    {
      "id": "outils-splat-tache-barre-html",
      "title": "Petit Splat — fiches et schémas en barres",
      "description": "Composez une fiche de Petits Splats avec jetons cachés et schémas en barres à compléter.",
      "path": "outils/splat_tache_barre.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral",
        "equations",
        "schemas-barres"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "splat",
        "inconnue",
        "relation",
        "calcul littéral",
        "problèmes",
        "modélisation"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-splat-equations-html",
      "title": "Splat — équations",
      "description": "Générez des cartes d’équations où les deux côtés contiennent des jetons et des quantités cachées.",
      "path": "outils/splat_equations.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral",
        "equations",
        "schemas-barres"
      ],
      "uses": [
        "manipuler",
        "projeter"
      ],
      "types": [
        "plateau"
      ],
      "filters": [],
      "keywords": [
        "splat",
        "inconnue",
        "relation",
        "calcul littéral"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-plateaux-manipulation-stats-city-html",
      "title": "Stats City",
      "description": "Une ville de données pour manipuler la médiane, la moyenne et l’étendue.",
      "path": "outils/plateaux_manipulation/stats_city.html",
      "domains": [
        "donnees"
      ],
      "notions": [
        "statistiques"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "plateau",
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-bouliers-rekenrek-tables-html",
      "title": "Tables de multiplication",
      "description": "Une ressource maths&go pour travailler numération.",
      "path": "outils/bouliers/rekenrek/tables.html",
      "domains": [
        "nombres-calculs"
      ],
      "notions": [
        "numeration",
        "calcul-mental"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [
        "boulier",
        "rekenrek",
        "soroban",
        "abaque",
        "numération",
        "calcul mental"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-tuiles-algebriques-generateur-exercices-calcul-litteral-html",
      "title": "Générateur d’exercices avec les tuiles",
      "description": "Créez une fiche d’exercices illustrés pour développer, réduire ou compléter des expressions.",
      "path": "outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer",
        "entrainer"
      ],
      "types": [
        "exerciseur",
        "generateur",
        "imprimable"
      ],
      "filters": [
        "generateur-exercices"
      ],
      "keywords": [
        "tuiles algébriques"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-tuiles-algebriques-generateur-tuiles-html",
      "title": "Tuiles algébriques à découper",
      "description": "Personnalisez une planche de tuiles algébriques à imprimer et à découper.",
      "path": "outils/tuiles_algebriques/generateur_tuiles.html",
      "domains": [
        "algebre"
      ],
      "notions": [
        "calcul-litteral"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "imprimer"
      ],
      "types": [
        "generateur",
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "tuiles algébriques"
      ],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "outils-fiche-reciproque-thales-pdf",
      "title": "Thalès — réciproque et contraposée",
      "description": "Une méthode guidée, un gabarit adaptable et deux exemples rédigés pour démontrer que deux droites sont parallèles ou non.",
      "path": "outils/fiche_reciproque_thales.pdf",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "thales"
      ],
      "uses": [
        "imprimer",
        "entrainer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "réciproque",
        "contraposée",
        "droites parallèles",
        "rapports"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-fiche-thales-criteres-a-verifier-pdf",
      "title": "Thalès — tester un parallélisme (à vérifier)",
      "description": "Une proposition alternative pour comprendre le même coefficient puis appliquer un critère de parallélisme ou de non-parallélisme.",
      "path": "outils/fiche_thales_criteres_a_verifier.pdf",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "thales"
      ],
      "uses": [
        "imprimer",
        "entrainer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "réciproque",
        "contraposée",
        "critère de parallélisme",
        "à vérifier"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-fiche-thales-direct-a-verifier-pdf",
      "title": "Thalès direct — calculer une longueur (à vérifier)",
      "description": "Une proposition pour comprendre le tableau de proportionnalité, choisir deux colonnes utiles et rédiger le calcul d’une longueur.",
      "path": "outils/fiche_thales_direct_a_verifier.pdf",
      "domains": [
        "geometrie"
      ],
      "notions": [
        "thales"
      ],
      "uses": [
        "imprimer",
        "entrainer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "théorème de Thalès",
        "longueur",
        "tableau de proportionnalité",
        "à vérifier"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-gabarits-proportionnalite-tableaux-pdf",
      "title": "Proportionnalité — tableaux",
      "description": "Trois gabarits de tableaux de proportionnalité : coloré, vierge et à colonnes larges.",
      "path": "outils/gabarits_proportionnalite_tableaux.pdf",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "proportionnalite"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "tableau de proportionnalité",
        "coefficient"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-gabarit-proportionnalite-double-ligne-graduee-pdf",
      "title": "Proportionnalité — double ligne graduée",
      "description": "Deux modèles de double ligne graduée pour relier visuellement deux grandeurs proportionnelles.",
      "path": "outils/gabarit_proportionnalite_double_ligne_graduee.pdf",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "proportionnalite"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "double ligne graduée",
        "grandeurs"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-gabarit-proportionnalite-tableau-sans-coefficient-pdf",
      "title": "Proportionnalité — tableau sans coefficient",
      "description": "Trois tableaux à compléter sans faire apparaître le coefficient de proportionnalité.",
      "path": "outils/gabarit_proportionnalite_tableau_sans_coefficient.pdf",
      "domains": [
        "proportionnalite-mesures"
      ],
      "notions": [
        "proportionnalite"
      ],
      "uses": [
        "imprimer",
        "projeter"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [
        "materiel-imprimer"
      ],
      "keywords": [
        "tableau de proportionnalité",
        "sans coefficient"
      ],
      "kind": "document",
      "status": "published",
      "featured": false,
      "recent": true
    },
    {
      "id": "outils-club-maths-yavalath-html",
      "title": "Yavalath",
      "description": "Un jeu d’alignement sur plateau hexagonal où une ligne de quatre gagne mais une ligne de trois fait perdre.",
      "path": "outils/club_maths/yavalath.html",
      "domains": [
        "jeux-recherches"
      ],
      "notions": [
        "strategie"
      ],
      "uses": [
        "manipuler",
        "projeter",
        "entrainer"
      ],
      "types": [
        "exerciseur"
      ],
      "filters": [],
      "keywords": [],
      "kind": "tool",
      "status": "published",
      "featured": false,
      "recent": false
    },
    {
      "id": "cps-bilan-s1-html",
      "title": "Bilan guidé de fin du premier semestre",
      "description": "Un document unique de quatre pages A3 pour faire le point sur son semestre, ses ressources et son prochain objectif.",
      "path": "cps/bilan-s1.html",
      "domains": [
        "cps"
      ],
      "notions": [
        "bilans-cps"
      ],
      "uses": [
        "projeter",
        "imprimer"
      ],
      "types": [
        "imprimable"
      ],
      "filters": [],
      "keywords": [
        "compétences psychosociales",
        "bilan élève",
        "connaissance de soi",
        "engagement"
      ],
      "kind": "document",
      "status": "published",
      "featured": true,
      "recent": true
    }
  ]
};
