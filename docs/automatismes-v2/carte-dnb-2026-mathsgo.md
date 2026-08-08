# Carte des automatismes DNB 2026 - maths&go V2

**Statut : carte de couverture arrêtée le 19 juillet 2026 ; granularité produit clarifiée le 6 août, extension NC-02 consignée le 7 août et notion validée le 8 août 2026.**
**Périmètre : partie Automatismes du DNB, sans code de question.**

## 1. Sources et règles de lecture

Source principale : [liste indicative officielle DNB 2026](https://eduscol.education.gouv.fr/sites/default/files/document/liste-indicative-dautomatismes-pour-le-dnbpdf-116340.pdf), publiée en octobre 2025 pour les séries générale et professionnelle.

Sources secondaires du dépôt :

- `docs/automatismes-v2/pilotage.md` ;
- `docs/automatismes-v2/etat.md` ;
- `docs/automatismes-v2/decisions.md` ;
- `docs/reference-matrice-automatismes/matrice.json` pour les correspondances avec les nouveaux programmes ;
- `packages/objets/src/references-programme.js` pour les objets maths&go candidats.

Le PDF canonique actuellement relié par Éduscol présente **37 cibles
officielles**. Une cible associe deux savoir-faire de domaines différents :
prendre une fraction d'une quantité et calculer un pourcentage repère. Elle est
scindée pour la fabrication. La carte maths&go comporte ainsi **38 cibles
normalisées**.

Les repères `O`, `G`, `D`, `P`, `I`, `DNB26`, `NC`, `AL`, `PG`, `DS`, `GE` et
`PI` sont des repères documentaires. Ils ne préjugent pas des futurs
identifiants de source V2.

## 2. Liste officielle complète

### Nombres et calculs - 14 cibles

| Repère | Cible officielle résumée |
|---|---|
| O-01 | Écritures décimales de fractions simples |
| O-02 | Comparaison et calcul avec les décimaux, y compris négatifs |
| O-03 | Simplification, comparaison et calcul avec les fractions |
| O-04 | Fraction d'une quantité et pourcentages repères |
| O-05 | Écritures multiples d'un même nombre |
| O-06 | Passage de l'écriture décimale à la notation scientifique |
| O-07 | Carrés des entiers de 1 à 12 |
| O-08 | Critères de divisibilité par 2, 3, 5 et 9 |
| O-09 | Double, triple, moitié, prédécesseur, successeur et carré de `n` |
| O-10 | Simplification d'expressions littérales |
| O-11 | Valeur d'une expression algébrique, y compris avec puissances |
| O-12 | Développement et factorisation simples |
| O-13 | Équations `ax = c`, `x + b = c` et `ax + b = c` |
| O-14 | Lecture et placement sur une droite graduée |

### Espace et géométrie - 13 cibles distinctes

| Repère | Cible officielle résumée |
|---|---|
| G-01 | Lecture et placement dans un repère orthogonal |
| G-02 | Identification de figures et médiatrice par codage |
| G-03 | Reconnaissance, dénomination et mesures d'angles usuels |
| G-04 | Somme des angles d'un triangle et troisième angle |
| G-05 | Conversions de longueurs, aires, volumes, masses, capacités et durées |
| G-06 | Reconnaissance de solides usuels |
| G-07 | Périmètre d'un polygone ou d'un disque |
| G-08 | Aires du triangle, du rectangle et du disque |
| G-09 | Volumes du cube, du pavé, du prisme droit et du cylindre |
| G-10 | Situation, égalité et contrôle critique pour Pythagore |
| G-11 | Situation, rapports et contrôle critique pour Thalès |
| G-12 | Situation, rapport et contrôle critique pour le cosinus |
| G-13 | Propriétés des symétries axiale et centrale et de la translation |

### Organisation et gestion de données et probabilités - 5 cibles

| Repère | Cible officielle résumée |
|---|---|
| D-01 | Probabilités simples en situation d'équiprobabilité |
| D-02 | Fréquence simple |
| D-03 | Moyenne |
| D-04 | Médiane d'une petite série |
| D-05 | Lecture de tableaux, diagrammes et graphiques |

### Proportionnalité et fonctions - 4 cibles

| Repère | Cible officielle résumée |
|---|---|
| P-01 | Reconnaissance d'une situation de proportionnalité |
| P-02 | Linéarité multiplicative, linéarité additive ou retour à l'unité |
| P-03 | Hausse ou baisse en pourcentage |
| P-04 | Lecture d'un graphique de dépendance entre deux grandeurs |

### Algorithmique et programmation - 1 cible

| Repère | Cible officielle résumée |
|---|---|
| I-01 | Interprétation d'un programme de calcul, d'un déplacement ou d'une construction |

## 3. Taxonomie maths&go

| Domaine maths&go | Cibles normalisées | Micro-notions prévues |
|---|---:|---:|
| 1. Nombres et calculs | 8 | 17 |
| 2. Calcul littéral et algèbre | 5 | 12 |
| 3. Proportionnalité, fonctions et grandeurs | 9 | 24 |
| 4. Espace et géométrie | 10 | 24 |
| 5. Données, stats et probabilités | 5 | 8 |
| 6. Pensée informatique | 1 | 3 |
| 7. Jeux, recherches et explorations | 0 | 0 |
| **Total** | **38** | **88** |

Le domaine 7 reste disponible comme modalité pédagogique, mais il ne constitue
pas une cible officielle autonome du DNB.

## 4. Matrice de couverture

La colonne « Nouveaux BO » est une correspondance secondaire avec la matrice
des 187 automatismes. Une absence ne retire jamais une cible DNB 2026 : Thalès,
le cosinus, les fonctions et la pensée informatique sont bien dans la liste
DNB, même lorsqu'ils ne figurent pas sous un intertitre « Automatismes » du
nouveau programme.

La carte sépare désormais quatre niveaux : cible officielle, catégorie visible,
micro-notion interne et famille de questions. Les 88 micro-notions sont des
unités de fabrication et de suivi ; elles ne préfigurent pas 88 questionnaires
dans le menu. Une catégorie visible peut regrouper plusieurs micro-notions
proches. `NC-01` et `NC-02` sont validées. Les choix pédagogiques révisés de
`NC-02` ont été approuvés le 7 août, puis sa recette technique et ses finitions
ont été validées le 8 août. Sa cible DNB conserve la borne officielle 1 à 12,
tandis que le produit visible l'étend de 0 à 12 conformément au nouveau
programme du cycle 4. Les autres états de la matrice restent inchangés dans ce
lot, à l'exception de `NC-03` et `NC-04` désormais réunies dans un même module
`construit` et ouvert en pilote public non référencé.

| Repère | Cible normalisée | Domaine | Micro-notions | Nouveaux BO correspondants | V2 |
|---|---|---:|---|---|---|
| DNB26-01 | Fraction simple vers décimal et retour | 1 | NC-03 à NC-04 | 6-02, 6-08, 5-10 | `construit` |
| DNB26-02 | Comparer et calculer avec des décimaux | 1 | NC-07 à NC-11 | 5-04, 5-06, 5-07, 4-01 | `a_faire` |
| DNB26-03 | Simplifier, comparer et calculer des fractions | 1 | NC-12 à NC-16 | 6-09, 5-13, 5-14, 5-16, 4-07, 4-08, 3-01, 3-07, 3-08 | `a_faire` |
| DNB26-04 | Prendre une fraction d'une quantité | 1 | NC-06 | 6-10, 5-17, 4-10 | `a_faire` |
| DNB26-05 | Calculer 100 %, 50 %, 25 %, 10 % ou 1 % | 3 | PG-01 | 5-18, 4-39, 4-40, 3-35 | `a_faire` |
| DNB26-06 | Écrire un nombre sous plusieurs formes | 1 | NC-05 | 5-19 | `a_faire` |
| DNB26-07 | Passer à la notation scientifique | 1 | NC-17 | 3-02 partiel ; pas d'équivalent direct | `a_faire` |
| DNB26-08 | Connaître les carrés de 1 à 12 | 1 | NC-02 | 4-11, 4-15, 3-05 | `valide` |
| DNB26-09 | Appliquer les critères de divisibilité | 1 | NC-01 | 5-01, 3-09 | `valide` |
| DNB26-10 | Exprimer des relations simples avec `n` | 2 | AL-01 à AL-03 | 4-20, 3-15 partiel | `a_faire` |
| DNB26-11 | Simplifier une expression littérale | 2 | AL-04 à AL-05 | 4-18, 4-19, 3-11, 3-16 | `a_faire` |
| DNB26-12 | Calculer la valeur d'une expression | 2 | AL-06, AL-12 | 4-16, 4-21, 3-12 | `a_faire` |
| DNB26-13 | Développer et factoriser | 2 | AL-07 à AL-08 | 3-14 | `a_faire` |
| DNB26-14 | Résoudre trois formes d'équations | 2 | AL-09 à AL-11 | 4-17, 3-10 | `a_faire` |
| DNB26-15 | Lire et placer sur une droite graduée | 4 | GE-01 à GE-02 | 5-12, 5-25, 5-26, 4-23, 4-24, 3-17, 3-18 | `a_faire` |
| DNB26-16 | Lire et placer dans un repère | 4 | GE-03 à GE-04 | 4-25, 4-26, 3-19, 3-20 | `a_faire` |
| DNB26-17 | Identifier des figures par codage | 4 | GE-05 à GE-07 | 6-26, 6-27, 6-29, 5-37, 5-39 à 5-41, 4-33 à 4-35 | `a_faire` |
| DNB26-18 | Reconnaître, nommer et mesurer des angles | 4 | GE-08 à GE-10 | 5-33 à 5-36 | `a_faire` |
| DNB26-19 | Utiliser la somme des angles d'un triangle | 4 | GE-11 | 5-38 | `a_faire` |
| DNB26-20 | Convertir des unités | 3 | PG-10 à PG-16 | 6-11 à 6-13, 6-17, 6-19, 6-20, 6-23, 6-25, 5-20 | `a_faire` |
| DNB26-21 | Reconnaître des solides usuels | 4 | GE-12 | 6-30, 5-27 à 5-30, 4-27, 4-29, 3-21, 3-23, 3-24 | `a_faire` |
| DNB26-22 | Calculer des périmètres | 3 | PG-17 à PG-18 | 6-15 | `a_faire` |
| DNB26-23 | Calculer des aires | 3 | PG-19 à PG-21 | 6-16 à 6-20, 4-30 | `a_faire` |
| DNB26-24 | Calculer des volumes | 3 | PG-22 à PG-24 | 4-28 | `a_faire` |
| DNB26-25 | Mobiliser Pythagore | 4 | GE-16 à GE-18 | 3-26 partiel | `a_faire` |
| DNB26-26 | Mobiliser Thalès | 4 | GE-19 à GE-21 | aucune ligne BO-Auto directe | `a_faire` |
| DNB26-27 | Mobiliser le cosinus | 4 | GE-22 à GE-24 | aucune ligne BO-Auto directe | `a_faire` |
| DNB26-28 | Mobiliser les transformations | 4 | GE-13 à GE-15 | 5-31, 5-32, 4-22, 4-31, 4-32, 3-28 | `a_faire` |
| DNB26-29 | Attribuer une probabilité simple | 5 | DS-08 | 5-42 à 5-44 | `a_faire` |
| DNB26-30 | Exprimer une fréquence | 5 | DS-07 | 4-38 | `a_faire` |
| DNB26-31 | Calculer une moyenne | 5 | DS-05 | 4-36, 3-29 | `a_faire` |
| DNB26-32 | Déterminer une médiane | 5 | DS-06 | 3-30 | `a_faire` |
| DNB26-33 | Lire tableaux, diagrammes et graphiques | 5 | DS-01 à DS-04 | 6-31 | `a_faire` |
| DNB26-34 | Reconnaître la proportionnalité | 3 | PG-02 | 5-45 | `a_faire` |
| DNB26-35 | Choisir une procédure de proportionnalité | 3 | PG-03 à PG-05 | 5-46 | `a_faire` |
| DNB26-36 | Appliquer une évolution en pourcentage | 3 | PG-06 à PG-07 | 3-37 | `a_faire` |
| DNB26-37 | Lire un graphique de dépendance | 3 | PG-08 à PG-09 | aucune ligne BO-Auto directe | `a_faire` |
| DNB26-38 | Interpréter une suite d'instructions | 6 | PI-01 à PI-03 | aucune ligne BO-Auto directe | `a_faire` |

## 5. Ordre de fabrication des 88 micro-notions

L'ordre suit quatre critères : dépendances mathématiques, simplicité d'une
première tranche verticale, réutilisation raisonnée des objets maths&go et
report des contrats visuels ou interactifs les plus risqués. Une seule
micro-notion sera active à la fois.

### Lot 1 - Nombres et calculs (rangs 1 à 17)

1. `NC-01` - critères de divisibilité par 2, 3, 5 et 9, avec 10 comme complément maths&go ;
2. `NC-02` - carrés des entiers de 0 à 12, avec 0 comme complément à la cible DNB ;
3. `NC-03` - fraction simple vers écriture décimale ;
4. `NC-04` - écriture décimale vers fraction simple ;
5. `NC-05` - écritures multiples d'un même nombre ;
6. `NC-06` - fraction simple d'une quantité ;
7. `NC-07` - comparaison de décimaux positifs ;
8. `NC-08` - comparaison de décimaux relatifs ;
9. `NC-09` - addition et soustraction de décimaux relatifs ;
10. `NC-10` - multiplication de décimaux ;
11. `NC-11` - division de décimaux ;
12. `NC-12` - simplification de fractions ;
13. `NC-13` - comparaison de fractions ;
14. `NC-14` - addition et soustraction de fractions ;
15. `NC-15` - multiplication de fractions ;
16. `NC-16` - division de fractions ;
17. `NC-17` - écriture décimale vers notation scientifique.

### Lot 2 - Calcul littéral et algèbre (rangs 18 à 29)

18. `AL-01` - double, triple et moitié de `n` ;
19. `AL-02` - prédécesseur et successeur de `n` ;
20. `AL-03` - carré de `n` ;
21. `AL-04` - réduction de sommes littérales ;
22. `AL-05` - réduction de produits littéraux ;
23. `AL-06` - valeur d'une expression sans puissance ;
24. `AL-07` - développement simple ;
25. `AL-08` - factorisation simple ;
26. `AL-09` - équation `x + b = c` ;
27. `AL-10` - équation `ax = c` ;
28. `AL-11` - équation `ax + b = c` ;
29. `AL-12` - valeur d'une expression avec puissances.

### Lot 3 - Proportionnalité, fonctions et grandeurs (rangs 30 à 53)

30. `PG-01` - pourcentages repères 100 %, 50 %, 25 %, 10 % et 1 % ;
31. `PG-02` - reconnaître une situation de proportionnalité ;
32. `PG-03` - linéarité multiplicative ;
33. `PG-04` - linéarité additive ;
34. `PG-05` - retour à l'unité ;
35. `PG-06` - augmentation en pourcentage ;
36. `PG-07` - diminution en pourcentage ;
37. `PG-08` - lire l'image d'une abscisse sur un graphique ;
38. `PG-09` - retrouver une abscisse depuis une ordonnée ;
39. `PG-10` - conversions de longueurs ;
40. `PG-11` - conversions de masses ;
41. `PG-12` - conversions de capacités ;
42. `PG-13` - conversions de durées ;
43. `PG-14` - conversions d'aires ;
44. `PG-15` - conversions de volumes ;
45. `PG-16` - correspondances entre capacité et volume ;
46. `PG-17` - périmètre d'un polygone ;
47. `PG-18` - périmètre d'un disque ;
48. `PG-19` - aire d'un rectangle ;
49. `PG-20` - aire d'un triangle ;
50. `PG-21` - aire d'un disque ;
51. `PG-22` - volume d'un cube ou d'un pavé ;
52. `PG-23` - volume d'un prisme droit ;
53. `PG-24` - volume d'un cylindre.

### Lot 4 - Données, statistiques et probabilités (rangs 54 à 61)

54. `DS-01` - lire un tableau ;
55. `DS-02` - lire un diagramme en barres ;
56. `DS-03` - lire un diagramme circulaire ;
57. `DS-04` - lire une courbe ou un graphique statistique ;
58. `DS-05` - calculer une moyenne ;
59. `DS-06` - déterminer une médiane ;
60. `DS-07` - exprimer une fréquence ;
61. `DS-08` - attribuer une probabilité en équiprobabilité.

### Lot 5 - Espace et géométrie (rangs 62 à 85)

62. `GE-01` - lire une abscisse ;
63. `GE-02` - placer un point sur une droite graduée ;
64. `GE-03` - lire les coordonnées d'un point ;
65. `GE-04` - placer un point dans un repère ;
66. `GE-05` - identifier un triangle par codage ;
67. `GE-06` - identifier un quadrilatère par codage ;
68. `GE-07` - identifier une médiatrice ;
69. `GE-08` - reconnaître et nommer des angles ;
70. `GE-09` - reconnaître les natures et relations entre angles ;
71. `GE-10` - connaître les mesures de l'angle droit et de l'angle plat ;
72. `GE-11` - utiliser la somme des angles d'un triangle ;
73. `GE-12` - reconnaître les six solides usuels ;
74. `GE-13` - mobiliser la symétrie axiale ;
75. `GE-14` - mobiliser la symétrie centrale ;
76. `GE-15` - mobiliser la translation ;
77. `GE-16` - reconnaître une situation de Pythagore ;
78. `GE-17` - écrire l'égalité de Pythagore ;
79. `GE-18` - contrôler conditions et résultat de Pythagore ;
80. `GE-19` - reconnaître la configuration de Thalès ;
81. `GE-20` - écrire les rapports de Thalès ;
82. `GE-21` - contrôler conditions et résultat de Thalès ;
83. `GE-22` - reconnaître une situation utilisant le cosinus ;
84. `GE-23` - écrire le rapport du cosinus ;
85. `GE-24` - contrôler conditions et résultat du cosinus.

Les micro-notions de placement (`GE-02`, `GE-04`) devront recevoir une décision
explicite sur la forme de réponse avant leur fiche : saisie par l'élève ou
exception interactive dédiée.

### Lot 6 - Pensée informatique (rangs 86 à 88)

86. `PI-01` - interpréter un programme de calcul ;
87. `PI-02` - interpréter un déplacement ;
88. `PI-03` - interpréter une construction géométrique.

## 6. Traitement du chantier Puissances

Les cibles DNB liées aux puissances restent couvertes : `NC-02`, `NC-17`,
`AL-03`, `AL-12` et, en géométrie, `GE-17`.

Le chantier plus large « Puissances » du laboratoire est différé jusqu'au tour
de `NC-17` et `AL-12`. Trois ressources maths&go ont été retrouvées :

- `outils/plateaux_manipulation/feuille_coupee_puissance.html` : doublement,
  écriture `2^n`, narration de recherche et défi de notation scientifique ;
- `outils/labo-des-regularites.html` : suites géométriques, carrés et puissances
  rendus visibles par des régularités ;
- `outils/patterns.html` : banque numérique de carrés et cycles de puissances.

Ces ressources sont dans `outils/`, donc candidates `original_mathsgo` selon la
doctrine du dépôt. Elles devront cependant être auditées pour leur adéquation
exacte à chaque fiche. Elles ne fournissent automatiquement ni énoncés, ni
valeurs, ni générateurs à V2.

## 7. Trois premières étapes achevées ou en pilote

La première micro-notion est `NC-01`, « critères de divisibilité par 2, 3, 5,
9 et 10 ». Le critère par 10 est un complément maths&go assumé, y compris dans
le parcours DNB ; il ne modifie pas la liste officielle.

La fiche pédagogique, le mini-cours et les cinq familles actives ont été
validés puis finalisés avec Gwenaël. `F4` et la sous-forme de partage « groupes
possibles » ont été retirées. Le lecteur commun, les générateurs seedés, les
tests, l'entraînement et le contexte « Au tableau » sont construits.

`NC-02`, les carrés des entiers de 0 à 12 dans le produit visible, est validée
et publiée. Sa cible officielle demeure « de 1 à 12 » et son identifiant
technique `carres-entiers-1-a-12` reste stable. Ses six familles partagent une
seule entrée de menu ; le fait 0 au carré ne produit aucun carré quadrillé
`0 × 0`. `NC-03` et `NC-04` restent distinctes en interne mais forment une
seule catégorie visible « Fractions simples et décimaux ». Le module travaille
les deux sens, conserve les représentations riches validées et est publié sur
la route pilote non référencée pour recueillir les retours de Gwenaël et de
Claire avant validation pédagogique finale.
