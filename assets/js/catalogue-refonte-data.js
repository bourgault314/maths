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
      "hiddenFromBrowse": true
    },
    {
      "id": "splat",
      "title": "Splat",
      "domain": "algebre",
      "notions": ["calcul-litteral", "equations"],
      "hub": "splat/index.html",
      "featured": true
    }
  ],
  "resourceClassifications": {
    "outils/box_barre_final.html": { "primaryNotion": "calcul-litteral", "collections": ["splat"], "tags": ["boite", "splat"] },
    "outils/box_pasbarre_final.html": { "primaryNotion": "calcul-litteral", "collections": [], "tags": ["boite", "archive"] },
    "outils/tuiles_algebriques/tuiles_algebriques.html": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/tuiles_algebriques/tuiles_algebriques_mode_equation.html": { "primaryNotion": "equations", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/detective_des_grandeurs_additive__1.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "enquete"] },
    "outils/detective_des_grandeurs_additive__2.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "enquete"] },
    "outils/detective_des_grandeurs_multiplicative__1.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "enquete"] },
    "outils/equabarre.html": { "primaryNotion": "equations", "collections": ["splat"], "tags": ["schema-barres", "splat"] },
    "outils/equasplat.html": { "primaryNotion": "equations", "collections": ["splat"], "tags": ["schema-barres", "splat"] },
    "outils/gabarits_enquetes_additive.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "gabarit"] },
    "outils/gabarits_enquetes_multiplicative.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "gabarit"] },
    "outils/gabarits_partage_equitable_2_3_4_5.pdf": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "gabarit"] },
    "outils/sheet_generator_schema_partie_tout.html": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["ancien-index", "schema-barres"] },
    "outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf.pdf": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/tuiles_algebriques/livret_litteral_mathigon.pdf": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/fabrication_materiel/maths_barre.html": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "reference-technique"] },
    "outils/patterns.html": { "primaryNotion": "patterns", "collections": [], "tags": ["patterns", "generalisation"] },
    "outils/problemes_barres.html": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes"] },
    "outils/problemes_barres_M974.html": { "primaryNotion": "schemas-barres", "collections": [], "tags": ["schema-barres", "resolution-problemes", "version-travail"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_difference.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_differenceB.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_differenceBClaire.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_differenceC.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/nombres_relatifs/nombres_relatifs_somme_differenceD.html": { "primaryNotion": "relatifs", "collections": [], "tags": ["nombres-relatifs", "plateau-manipulation"] },
    "outils/splat.html": { "primaryNotion": "calcul-litteral", "collections": ["splat"], "tags": ["splat", "inconnue", "relation"] },
    "outils/splat_tache_barre.html": { "primaryNotion": "calcul-litteral", "collections": ["splat"], "tags": ["splat", "inconnue", "relation"] },
    "outils/splat_equations.html": { "primaryNotion": "equations", "collections": ["splat"], "tags": ["schema-barres", "splat"] },
    "outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
    "outils/tuiles_algebriques/generateur_tuiles.html": { "primaryNotion": "calcul-litteral", "collections": ["tuiles-algebriques"], "tags": ["tuiles-algebriques"] },
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
    "outils/plateaux_manipulation/moulin_pythagore.html": {
      "primaryNotion": "pythagore",
      "collections": [],
      "tags": ["puzzle", "aires", "pythagore"],
      "thumbnail": "assets/img/thumbnails/moulin-pythagore-capture.svg?v=6",
      "cardDescription": "Déplacer les pièces de puzzles pour visualiser l’égalité des aires du théorème de Pythagore."
    },
    "outils/pythabarre.html": {
      "primaryNotion": "pythagore",
      "collections": [],
      "tags": ["schema-barres", "moulin", "pythagore"],
      "thumbnail": "assets/img/thumbnails/pythabarre-capture.svg?v=6",
      "cardDescription": "Dérouler le théorème pas à pas avec le calcul, le schéma en barres et le moulin de Pythagore."
    },
    "outils/pythabarre_recto_verso.pdf": { "primaryNotion": "pythagore", "collections": [], "tags": ["schema-barres", "moulin", "pythagore", "imprimable"] },
    "outils/fiche_reciproque_thales.pdf": { "primaryNotion": "thales", "collections": [], "tags": ["thales", "reciproque", "contraposee", "imprimable"] },
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
      "group": "cours",
      "labels": {
        "outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf": "Blanc et gris",
        "outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf.pdf": "Bleu et jaune",
        "outils/tuiles_algebriques/livret_litteral_mathigon.pdf": "Mathigon",
        "outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf": "Vert et rouge"
      },
      "paths": [
        "outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf",
        "outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf.pdf",
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
      "id": "moyennes",
      "title": "Moyennes",
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
      "title": "Aire & Périmètre — Plateau",
      "description": "Une ressource maths&go pour travailler aires et périmètres.",
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
      "title": "AngleBarre — angles d’un triangle",
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
      "title": "Atelier : Unités d'Aire",
      "description": "Une ressource maths&go pour travailler conversions.",
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
      "title": "Atelier Volumes 3D - La Chaîne Complète (Alignement en coin)",
      "description": "Une ressource maths&go pour travailler conversions.",
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
      "title": "Bandes magnétiques — géométrie interactive",
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
      "title": "Calcul Littéral - Développement",
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "title": "Calcul Littéral - Équations (1er Degré)",
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "title": "Club Maths - Le Jeu du Chaos",
      "description": "Une ressource maths&go pour travailler jeux de stratégie.",
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
      "title": "Club Maths - Les Tables Modulaires",
      "description": "Une ressource maths&go pour travailler jeux de stratégie.",
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
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
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
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
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
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
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
      "description": "Une ressource maths&go pour travailler proportionnalité et ratios.",
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
      "description": "Une ressource maths&go pour travailler équations et représentations.",
      "path": "outils/equabarre.html",
      "domains": [
        "algebre"
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
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "title": "Gabarits d’angles — plateau de manipulation",
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
      "title": "Gabarits d’angles à imprimer — générateur",
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
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
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
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
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
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
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
      "description": "Une ressource maths&go pour travailler pourcentages.",
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
      "title": "Générateur d'Exercices — Engrenages",
      "description": "Une ressource maths&go pour travailler proportionnalité et ratios.",
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
      "title": "Générateur de Conversions & Ordres de Grandeur",
      "description": "Une ressource maths&go pour travailler conversions.",
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
      "description": "Une ressource maths&go pour travailler conversions.",
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
      "description": "Une ressource maths&go pour travailler pourcentages.",
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
      "title": "Glisse unité",
      "description": "Une ressource maths&go pour travailler conversions.",
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
      "description": "Une ressource maths&go pour travailler numération.",
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
      "title": "Glisse-nombres",
      "description": "Une ressource maths&go pour travailler numération.",
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
      "title": "Jeu de Nim - Le bâton rouge V9",
      "description": "Une ressource maths&go pour travailler jeux de stratégie.",
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
      "title": "Labo des Proportions - Multi-Ratio",
      "description": "Une ressource maths&go pour travailler proportionnalité et ratios.",
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
      "title": "Le Grand Pari - Ultimate Edition",
      "description": "Une ressource maths&go pour travailler explorations mathématiques.",
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
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "id": "outils-tuiles-algebriques-livret-litteral-bleu-jaune-pdf-pdf",
      "title": "Livret de calcul littéral — bleu et jaune",
      "description": "Une ressource maths&go pour travailler calcul littéral.",
      "path": "outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf.pdf",
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
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "title": "Livret de calcul mental A5",
      "description": "Une ressource maths&go pour travailler calcul mental et automatismes.",
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
      "title": "Maître du temps",
      "description": "Une ressource maths&go pour travailler temps et durées.",
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
      "title": "Maker — numération décimale",
      "description": "Une ressource maths&go pour travailler numération.",
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
      "description": "Une ressource maths&go pour travailler pythagore.",
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
      "title": "Numération décimale — Plateau (PATCH 5)",
      "description": "Une ressource maths&go pour travailler numération.",
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
      "title": "Outil : La Moyenne (Décimaux)",
      "description": "Une ressource maths&go pour travailler moyennes.",
      "path": "outils/plateaux_manipulation/moyennes.html",
      "domains": [
        "donnees"
      ],
      "notions": [
        "moyennes"
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
      "title": "Patterns — vers l’algèbre",
      "description": "Une ressource maths&go pour travailler patterns et généralisation.",
      "path": "outils/patterns.html",
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
      "status": "hidden",
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
      "description": "Une ressource maths&go pour travailler pourcentages.",
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
      "description": "Une ressource maths&go pour travailler schémas en barres et problèmes.",
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
      "description": "Une ressource maths&go pour travailler proportionnalité et ratios.",
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
      "description": "Une ressource maths&go pour travailler pythagore.",
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
      "title": "PythaBarre — fiche recto-verso",
      "description": "Une fiche à imprimer pour structurer la relation de Pythagore avec le moulin, les schémas en barres et une rédaction pas à pas.",
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
        "moulin de Pythagore"
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
      "title": "Recherche sur les pourcentages",
      "description": "Une ressource maths&go pour travailler pourcentages.",
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
      "title": "Recommandation SCÈNE3D",
      "description": "Une ressource maths&go pour travailler espace, patrons et constructions.",
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
      "id": "outils-bouliers-rekenrek-cache-cache-html",
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
      "title": "Splat! — relations et inconnues",
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "title": "Splat! — taches et barres",
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "title": "Splat! Équations",
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "description": "Une ressource maths&go pour travailler statistiques et représentations.",
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
      "title": "Tuiles algébriques",
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "description": "Une ressource maths&go pour travailler calcul littéral.",
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
      "description": "Une fiche recto-verso guidée pour choisir les bons rapports, comparer puis conclure que deux droites sont parallèles ou non.",
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
      "title": "Yavalath — plateau 2 joueurs",
      "description": "Une ressource maths&go pour travailler jeux de stratégie.",
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
    }
  ]
};
