# Correspondance modules Automatismes ↔ matrice du BO

**Statut : archive V1 de Claude (18 juillet 2026), non validée. Cette
correspondance avec les 43 modules et les identifiants `dnb_*` n'est pas une
source de nomenclature, de couverture ou de migration pour Automatismes V2.**

Pour chacun des 43 modules de l'appli Automatismes (titres relevés dans
`docs/reference-automatismes-beta/inventaire-automatismes-beta.md`), les
lignes de la matrice (`matrice-automatismes-nouveaux-programmes.md`) que le
module entraîne. L'usage envisagé pour la V1 était de distinguer, dans un futur
filtre, ce qui relevait du label officiel « Automatismes » du BO d'un
entraînement pédagogique plus large (principe du §10 de la matrice).

La correspondance est faite au niveau du module, pas question par question.
L'hypothèse d'une migration de chaque module, envisagée lors de cette première
passe, a été abandonnée par D-011 puis explicitement écartée de la nomenclature
V2 par D-043. Le tableau reste utile uniquement pour comprendre l'ancienne
banque et retrouver les apports de Gwenaël au moment où une notion précise est
auditée.

## Modules adossés à des automatismes officiels

| Module | Notion (titre de l'appli) | Lignes de la matrice |
|---|---|---|
| `dnb_01` | Écriture décimale des fractions simples | 6-08 ; 5-10 |
| `dnb_02` | Comparer et calculer avec des nombres décimaux | 5-06, 5-07 (la comparaison est un objectif, pas un automatisme) |
| `dnb_02b` | Multiplier et diviser par 10, 100 et 1 000 | 6-04, 6-05 ; 5-05 ; 4-04, 4-12 |
| `dnb_03` | Fractions : simplifier, comparer, additionner | 6-09 ; 5-13 à 5-16 ; 4-07, 4-08 ; 3-01, 3-07, 3-08 |
| `dnb_03b` | Fractions : multiplier et diviser | 3-01 |
| `dnb_04` | Fractions d'une quantité et pourcentages repères | 6-10 ; 5-17, 5-18 ; 4-10, 4-39 |
| `dnb_05` | Un même nombre sous plusieurs formes | 6-03 ; 5-19 |
| `dnb_07` | Carrés des entiers de 1 à 12 | 4-11, 4-15 ; 3-05 |
| `dnb_08` | Critères de divisibilité | 5-01 ; 3-09 |
| `dnb_09` | Double, triple, moitié, voisins et carré | 4-20 |
| `dnb_10` | Simplifier des expressions littérales | 4-18, 4-19 ; 3-11, 3-16 |
| `dnb_11` | Valeur d'une expression algébrique | 4-16 ; 3-12 |
| `dnb_12` | Développer et factoriser | 3-14 |
| `dnb_13` | Résoudre des équations | 4-17 ; 3-10 |
| `dnb_14` | Lire une abscisse | 5-12, 5-25, 5-26 ; 4-23, 4-24 ; 3-17, 3-18 |
| `dnb_15` | Lire des coordonnées | 4-25, 4-26 ; 3-19, 3-20 |
| `dnb_16` | Codage de figures | 6-26, 6-29 ; 5-37, 5-41 |
| `dnb_17` | Angles : reconnaître, nommer et mesurer | 5-33 à 5-36 (la mesure au rapporteur est un objectif de 6e) |
| `dnb_18` | Somme des angles d'un triangle | 5-38 |
| `dnb_19` | Conversions d'unités | 6-11, 6-12, 6-13, 6-19, 6-20 ; 5-20 |
| `dnb_20` | Reconnaître des solides | 6-30 ; 5-29 ; 4-27 ; 3-21 |
| `dnb_21` | Périmètres | 6-15 (les formules complètes sont des objectifs) |
| `dnb_22` | Aires | 6-16 à 6-18 ; 4-30 |
| `dnb_23` | Volumes | 4-28 ; 3-22 |
| `dnb_24` | Pythagore | 3-26 (l'égalité seule ; le théorème complet est un objectif de 4e) |
| `dnb_24b` | Pythagore tactile | 3-26 |
| `dnb_27` | Symétries et translation | 5-31, 5-32 ; 4-22, 4-31, 4-32 ; 3-28 |
| `dnb_28` | Probabilités | 5-42, 5-43, 5-44 |
| `dnb_29` | Fréquences | 4-37, 4-38 |
| `dnb_30` | Moyennes | 4-36 ; 3-29 |
| `dnb_31` | Médiane et étendue | 3-30, 3-31 |
| `dnb_32` | Tableaux, diagrammes et graphiques | 6-31 |
| `dnb_33` | Reconnaître une proportionnalité | 6-32, 6-33 ; 5-45 |
| `dnb_34` | Problèmes de proportionnalité | 5-46 ; 3-32 à 3-36 |
| `dnb_35` | Évolutions en pourcentage | 4-40 ; 3-37 |
| `dnb_38` | Addition de relatifs entiers | 4-01, 4-02 |
| `dnb_39` | Décimaux relatifs | 4-01 (support décimal de 5-07) |

## Modules sans automatisme étiqueté par le BO

Ces modules entraînent des notions que les nouveaux programmes classent en
objectifs d'apprentissage, jamais sous un intertitre « Automatismes ».
Ils gardent toute leur valeur d'entraînement ; la question est seulement
de savoir comment les présenter dans le futur filtre (décision Gwenaël) :

| Module | Notion | Situation dans les nouveaux programmes |
|---|---|---|
| `dnb_06` | Notation scientifique | Objectif de 3e (les automatismes de puissances s'arrêtent aux exposants positifs). |
| `dnb_25` | Thalès | Absence explicite : jamais dans une rubrique « Automatismes » du cycle 4. |
| `dnb_26` | Trigonométrie sans calculatrice | Absence explicite, comme Thalès. |
| `dnb_26b` | Trigonométrie avec calculatrice | Absence explicite, comme Thalès. |
| `dnb_36` | Lire un graphique de dépendance | Les fonctions n'ont aucune rubrique « Automatismes ». |
| `dnb_37` | Interpréter une suite d'instructions | La pensée informatique n'a aucune rubrique « Automatismes ». |

## Automatismes du BO sans module dédié aujourd'hui

Liste historique des manques repérés dans la V1 — simple index d'audit, jamais
ordre de fabrication ni liste de candidats automatiques pour V2 :

- calcul mental de 5e : produits liés aux tables (5-04), additions à trou
  (5-08), abscisses en tiers et quarts (5-12 est partiellement couvert par
  `dnb_14`) ;
- motifs évolutifs de 5e (5-21 à 5-23) — rien dans l'appli aujourd'hui ;
- multiplication à trou et lien avec la division (4-05), addition itérée
  (4-06) ;
- décomposition en facteurs premiers (3-06) ;
- expression générique d'un nombre pair ou impair (3-15), opposé d'une
  expression (3-16 partiellement dans `dnb_10`) ;
- vues et empilements de cubes (5-27, 5-28) ;
- patrons (5-30 ; 3-24) et faces d'une pyramide (3-23) ;
- partages selon un ratio (3-32 à 3-34 — `dnb_34` les effleure) ;
- caractérisation du triangle rectangle par son cercle circonscrit (3-25),
  droite des milieux (3-27) ;
- horaires et durées de 6e (6-21 à 6-25) si l'appli doit un jour couvrir la 6e.
