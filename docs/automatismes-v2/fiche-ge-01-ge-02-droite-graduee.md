# Fiche pédagogique — Droite graduée

**Statut : proposition à valider avant programmation du contenu.**

## 1. Identité et statut

- module visible : `droite-graduee`, « Droite graduée » ;
- précision affichée : « Lire une abscisse et placer un point » ;
- domaine : `espace-et-geometrie` ;
- micro-notions : `lire-abscisse-droite-graduee` (`GE-01`) et
  `placer-point-droite-graduee` (`GE-02`) ;
- cible commune : `dnb-2026-15`, alias documentaire `DNB26-15` ;
- statut : `a_faire` jusqu'à construction et validation ;
- provenance : `original_mathsgo`, à partir des textes officiels, de l'analyse
  des erreurs d'élèves et des décisions explicites de Gwenaël ;
- l'ancienne banque sert seulement à inventorier les familles de situations.

Les deux micro-notions forment un même module parce qu'elles utilisent le même
objet, le même vocabulaire et le même contrôle du pas. Les séparer ferait
répéter l'enseignement de l'échelle et masquerait leur réciprocité : lire
consiste à aller du point vers le nombre ; placer consiste à aller du nombre
vers le point.

## 2. Savoir-faire visé

À partir d'une droite ou d'une demi-droite graduée régulière, l'élève sait :

1. déterminer la valeur d'un intervalle à partir de deux graduations connues ;
2. lire l'abscisse d'un point, y compris avec des valeurs négatives ;
3. placer un point d'abscisse donnée sur une graduation ;
4. contrôler son résultat par l'ordre des nombres et le nombre d'intervalles.

L'objectif n'est pas de deviner une valeur à l'allure du dessin. La procédure
centrale est : **deux repères → nombre d'intervalles → pas → déplacement**.

## 3. Prérequis, inclusions et limites

### Prérequis

- lire et écrire un entier ou un décimal simple ;
- connaître l'ordre usuel des nombres positifs et négatifs ;
- additionner ou soustraire mentalement un pas simple.

### Inclus dans la première version

- pas `0,1`, `0,25`, `0,5`, `1`, `2`, `5`, `10`, `20`, `25` et `50` ;
- entiers positifs et négatifs ;
- décimaux relatifs simples ;
- demis, quarts, tiers et dixièmes simples dans les séries longues, sans en
  faire la majorité ;
- origine à gauche, centrée, décentrée, non étiquetée ou hors de la fenêtre ;
- fenêtre entièrement positive, traversant zéro ou entièrement négative ;
- zéro et une autre valeur connus, ou deux références connues non nulles ;
- valeurs jusqu'à quelques centaines lorsque le pas vaut `10`, `20`, `25` ou
  `50` ;
- point repéré au-dessus ou au-dessous de la droite.

Les séries courtes privilégient `0,5`, `1`, `2`, `5` et `10`. Les pas `0,1`,
`0,25`, `25` et `50`, les références non nulles et les fractions simples
apparaissent progressivement dans la variété des séries de 10, 15 et 20. Il
n'existe pas de niveau affiché.

### Hors de cette version

- comparer deux nombres sans tâche de lecture ou de placement ;
- valeur absolue et opposé comme objets d'étude autonomes ;
- placement libre entre deux graduations ou précision au pixel ;
- densité de graduations illisible ;
- nombres périodiques, puissances de dix et notation scientifique ;
- repérage dans le plan, traité par `GE-03` et `GE-04`.

## 4. Erreurs d'élèves à travailler

| Code | Mécanisme observé | Trace ou distracteur utile |
|---|---|---|
| E1 | Compter les traits au lieu des intervalles | diviser l'écart par un nombre trop grand d'une unité |
| E2 | Prendre l'écart total pour le pas | proposer directement la différence des deux repères |
| E3 | Supposer que le pas vaut toujours 1 | conserver le rang de la graduation comme valeur |
| E4 | Oublier de multiplier le nombre d'intervalles par le pas | avancer d'une seule unité de pas |
| E5 | Commencer le comptage à 1 sur la graduation de départ | erreur d'un pas |
| E6 | Aller dans le mauvais sens | ajouter à gauche ou soustraire à droite |
| E7 | Ignorer le signe moins | opposé positif de la réponse attendue |
| E8 | Ordonner les négatifs comme leurs valeurs absolues | confondre `−0,5` et `−0,25` |
| E9 | Inventer zéro à la première graduation visible | valeur translatée de toute la fenêtre |
| E10 | Lire la totalité du segment affiché comme une unité | pas obtenu en partageant arbitrairement la fenêtre |
| E11 | Confondre le nom du point et son abscisse | répondre `A` au lieu du nombre, ou inversement |

Un distracteur n'est utilisé que s'il correspond exactement à une erreur
possible dans l'instance. Une fausse réponse saisie reste acceptée comme saisie,
tracée et corrigée ; elle n'est pas bloquée par une borne construite seulement
à partir des bonnes réponses.

## 5. Familles de questions

### F1 — Lire l'abscisse d'un point

- consigne : « Quelle est l'abscisse du point A ? » ;
- réponse : entier signé, décimal signé ou fraction simple équivalente selon
  l'instance ;
- la droite montre le point et assez de références pour déterminer le pas ;
- le zéro n'est pas systématiquement écrit ni visible ;
- aide : choisir deux références, compter les intervalles, calculer le pas,
  puis partir de la référence la plus proche ;
- correction : conserve exactement la droite de la question et écrit le
  calcul de déplacement.

### F2 — Placer un point d'abscisse donnée

- consigne : « Place le point A d'abscisse … » ;
- réponse : choix d'une graduation par toucher, souris ou clavier ;
- le point commence non placé ; un appui choisit la graduation la plus proche ;
- les flèches gauche et droite déplacent le choix d'une graduation ;
- aide : déterminer d'abord le pas, choisir une référence, puis compter les
  déplacements sans afficher la graduation cible ;
- correction : superpose le choix de l'élève et la position attendue avec deux
  marqueurs explicitement légendés.

### F3 — Déterminer le pas

- consigne : « Quelle est la valeur d'un intervalle ? » ;
- réponse : entier ou décimal positif simple ;
- deux graduations connues sont données, par exemple `−20` et `20`, séparées
  par quatre intervalles ;
- aide : entourer les deux références, afficher leur écart et faire compter
  les espaces, sans effectuer la division ;
- correction : `20 − (−20) = 40`, puis `40 ÷ 4 = 10`.

### F4 — Diagnostic rare

- forme : choix unique ou vrai/faux accompagné d'une situation visible ;
- tâche : choisir une lecture, un placement ou un raisonnement correct ;
- chaque proposition représente E1, E3, E6, E7 ou E9 ;
- aucune formulation ne repose sur un piège de vocabulaire ;
- cette famille reste minoritaire : elle diagnostique, elle ne remplace pas la
  production réelle.

### Quotas

| Questions | F1 lire | F2 placer | F3 pas | F4 diagnostic |
|---:|---:|---:|---:|---:|
| 5 | 2 | 2 | 1 | 0 |
| 10 | 4 | 4 | 1 | 1 |
| 15 | 6 | 6 | 2 | 1 |
| 20 | 8 | 8 | 2 | 2 |

Lecture et placement restent donc équilibrés et représentent 80 % d'une série
de 10 ou 20. Les ordres sont seedés en évitant trois tâches identiques
consécutives. Une même configuration numérique n'est pas répétée dans la série.

## 6. Progression pédagogique commune

### Je montre — cours en cinq pages

1. **Lire la droite** : origine, sens, graduation, intervalle, point et
   abscisse. Un contre-exemple distingue traits et intervalles.
2. **Trouver le pas** : deux valeurs connues, écart entre elles, nombre
   d'intervalles, division. L'exemple `−20` à `20` donne un pas de `10`.
3. **Lire une abscisse** : partir de la référence la plus proche et avancer ou
   reculer graduation par graduation.
4. **Placer un point** : refaire le même raisonnement dans l'autre sens et
   contrôler l'ordre du résultat.
5. **Changer d'échelle** : exemples courts avec `0,1`, `0,25`, `0,5`, des
   négatifs et une origine hors champ ; les demis, quarts, tiers et dixièmes
   sont reliés à la même idée de pas.

Chaque page porte une seule idée principale et réemploie l'objet commun validé.

### Nous faisons

Deux exemples guidés se répondent : lire l'abscisse d'un point, puis placer un
point sur la
même échelle. Le lecteur demande d'abord de sélectionner les deux références,
puis de compter les intervalles et enfin de choisir le sens. La conclusion est
montrée dans le cours, pas pendant une question notée.

### Tu fais accompagné

« Me guider » suit au maximum quatre étapes :

1. repérer deux valeurs connues ;
2. compter les intervalles, pas les traits ;
3. déterminer la valeur d'un intervalle ;
4. avancer ou reculer depuis la référence la plus proche.

L'aide ne colore pas la graduation attendue, ne borne pas une commande par la
réponse cachée et ne prononce pas le résultat avant validation.

### Tu fais seul

La même question reste affichée sans panneau d'aide. Les références, le pas et
la difficulté numérique ne changent pas du seul fait que l'aide est fermée.

### Correction et réactivation

La correction reprend la droite de l'instance, les deux références choisies,
le calcul du pas et le déplacement. Elle nomme l'erreur lorsque la réponse
correspond à un mécanisme identifié. La réactivation ultérieure se fait dans
le repérage du plan, les graphiques, les fonctions et les statistiques.

## 7. Manipulation et représentation

Le geste de placement rend perceptible qu'une graduation est une position
discrète liée à une valeur. Le point s'aimante donc aux graduations régulières ;
un déplacement libre au pixel près ajouterait une précision graphique sans
raisonnement mathématique.

Le toucher ou la souris choisit une graduation. Le clavier utilise les flèches
gauche et droite, avec une commande explicite pour commencer. L'interaction
expose un rôle et une valeur accessibles. Aucun glisser-déposer n'est l'unique
moyen d'agir.

## 8. Cohérence cours — aide — correction

Les trois contextes utilisent le même axe, les mêmes graduations, la même
typographie, les mêmes marqueurs et les mots « graduation », « intervalle »,
« pas », « point » et « abscisse ». Le cours révèle la méthode complète,
l'aide ne révèle que l'étape courante et la correction explique l'instance.

## 9. Présentation dans les deux contextes

- **S'entraîner** : saisie ou placement, aide facultative, validation, trace
  et correction ; le signe moins n'apparaît sur le pavé que si la réponse peut
  être négative.
- **Au tableau** : même question et même droite, sans trace élève ; le
  professeur peut révéler l'aide, la réponse et la correction. Les graduations
  et marqueurs restent lisibles à distance.

Les contrôles finaux couvrent `320 × 568`, `390 × 844`, `640 × 360`,
`1 280 × 720`, `1 920 × 1 080` et le reflow à 200 %, au toucher, à la souris
et au clavier.

## 10. Validation attendue

Avant programmation du contenu :

1. valider la planche de l'objet commun : épaisseur de l'axe et des traits,
   typographie, position des nombres, forme et couleur du point, trait de
   rappel et densité ;
2. valider les quatre familles, leurs quotas, les valeurs et les cinq pages du
   cours décrites ici ;
3. seulement ensuite construire les contrats signés, le placement interactif,
   les générateurs seedés, le cours, les aides et les corrections ;
4. fournir un parcours déterministe couvrant toutes les sous-formes et les
   erreurs E1 à E11 avant toute publication.
