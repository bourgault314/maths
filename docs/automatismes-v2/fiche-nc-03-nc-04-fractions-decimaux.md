# Fiche NC-03 / NC-04 — Fractions simples et décimaux

## 1. Identité et statut

- **Module visible canonique** : `fractions-simples-decimaux` — « Fractions
  simples et décimaux ».
- **Micro-notions canoniques** : `fraction-vers-decimal` et
  `decimal-vers-fraction`.
- **Alias humains de pilotage** : `NC-03` et `NC-04` respectivement ; les traces
  version 1 qui les utilisent restent lisibles.
- **Domaine canonique** : `nombres-et-calculs`.
- **Cible** : `DNB26-01`, référence machine `dnb-2026-01`, « Fraction
  simple vers décimal et retour ».
- **Statut** : `construit`, publié sur la route pilote non référencée pour les
  essais de Gwenaël et de Claire. Le passage à `valide` attend leur retour
  pédagogique final.
- **Provenance** : conception pédagogique et bornes validées par Gwenaël le
  7 août 2026 ; code, énoncés, calculs, diagnostics et représentations écrits
  à neuf pour maths&go.

## 2. Savoir-faire visé

Reconnaître qu'une fraction simple ou décimale et une écriture à virgule
peuvent désigner exactement le même nombre, puis passer de l'une à l'autre
mentalement. L'élève travaille dans les deux sens, y compris au-delà de 1,
sans calculatrice et sans obligation de réduire une fraction correcte.

## 3. Prérequis, inclusions et limites

Le module suppose la lecture d'un nombre décimal positif, le rôle du
numérateur et du dénominateur, et la numération de position.

Sont inclus :

- les dénominateurs `1`, `2`, `4`, `10`, `100` et, à très faible dose,
  `1 000` ;
- les demis de `1/2` à `7/2` dans les deux sens ;
- les quarts de `1/4` à `8/4`, y compris `2/4`, `4/4`, `6/4`, `8/4` et les
  résultats entiers ;
- les nombres inférieurs, égaux ou supérieurs à 1 et les zéros intercalés ;
- le point ou la virgule, le zéro initial facultatif et les zéros finaux dans
  une réponse décimale ;
- toute fraction équivalente, réduite ou non, dans la question libre.

Sont exclus de cette tranche : nombres négatifs, tiers, cinquièmes, huitièmes,
fractions non décimales, simplification comme objectif, glisser-déposer,
notation scientifique et calcul avec des fractions. Le cas `/1` emploie les
entiers de 2 à 12 ; `1/1`, trop trivial, n'est pas généré.

## 4. Erreurs d'élèves à travailler

Un diagnostic n'est affiché que si une réponse correspond à un mécanisme
unique. Sinon le retour reste générique.

| Code | Mécanisme témoin |
|---|---|
| E1 | Recopier numérateur et dénominateur autour de la virgule : `3/2 → 3,2`. |
| E2 | Ne compter qu'une part : `3/2 → 0,5`. |
| E3 | Déplacer la virgule d'un rang de trop : `21/10 → 0,21`. |
| E4 | Oublier un zéro de position : `7/100 → 0,7`. |
| E5 | Recopier les chiffres du décimal comme numérateur : `0,75 = □/4`, réponse `75`. |
| E6 | Retourner une fraction libre : `1,5 → 2/3`. |
| E8 | Traiter `/1` comme un chiffre décimal : `7/1 → 7,1`. |

Une écriture équivalente correcte, un point décimal ou des zéros finaux ne
déclenchent jamais un diagnostic. `0,51 = 51/100` n'est notamment pas une
erreur de copie. Une inversion n'est jamais annoncée lorsque seul le
numérateur d'une fraction à dénominateur imprimé est saisi.

## 5. Familles de questions

### NC-03 — fraction vers décimal

- **Consigne** : « Écris cette fraction en écriture décimale. »
- **Réponse** : un nombre décimal positif, comparé comme rationnel exact.
- **Familles** : dénominateur 1, demis, quarts, dixièmes, centièmes,
  millièmes.
- **Énoncé** : fraction empilée seule, sans droite ni tableau.
- **Aide/correction** : droite des demis ou des quarts ; tableau de numération
  pour 10, 100 et 1 000 ; règle directe pour `/1`.

### NC-04 — décimal vers fraction à dénominateur fixé

- **Consigne** : « Complète l'égalité. »
- **Réponse** : numérateur entier ; le dénominateur reste imprimé et
  non modifiable.
- **Familles** : demis, quarts, dixièmes, centièmes, millièmes.
- **Énoncé** : nombre décimal et fraction empilée à une seule case.
- **Aide/correction** : exactement la même représentation que pour NC-03.

### NC-04 — fraction libre

- **Consigne** : « Écris ce nombre sous forme de fraction. Toutes les
  fractions égales sont acceptées. »
- **Réponse** : deux champs entiers comparés par produit en croix ;
  dénominateur nul interdit.
- **Couverture** : exactement une question dans une série de 20.

Pour 20 questions, la série contient exactement 10 NC-03 et 10 NC-04. Pour
une longueur impaire, le bonus est attribué par la graine et l'écart reste
d'une question. Les deux sens sont intercalés sans jamais former trois
questions consécutives dans le même sens. Une série de 20 contient exactement
un millième ; son sens varie avec la graine.

| Longueur | Répartition NC-03 / NC-04 | Couverture du préfixe pédagogique |
|---:|---:|---|
| 5 | `3 / 2` ou `2 / 3`, selon la graine | demis, dixièmes et quarts dans les deux sens réunis |
| 10 | `5 / 5` | demis, quarts, dixièmes et centièmes dans chaque sens |
| 15 | `8 / 7` ou `7 / 8`, selon la graine | couverture précédente, dénominateur 1 côté NC-03 et répétitions variées |
| 20 | `10 / 10` | couverture complète, une fraction libre et un millième |

Chaque longueur est un préfixe cohérent de la recette de sa micro-notion : une
série courte ne prétend donc pas montrer toutes les familles, tandis que les
familles rares n'évincent jamais le rappel demis, quarts, dixièmes et
centièmes.

## 6. Progression pédagogique commune

### Je montre

Le cours suit six cartes : même nombre et même position ; les repères
indispensables ; fraction vers décimal ; décimal vers fraction ; dépasser
l'unité ; choisir la bonne stratégie. Il conserve la double droite, la grille
de 100, le tableau de numération et les groupements en unités complètes.

### Nous faisons

Selon la question, l'élève avance sur une double droite, colore des parts dans
une grille de 100, forme les unités complètes ou choisit le rang du tableau de
numération. Chaque action transforme réellement la représentation et fait
apparaître progressivement l'égalité travaillée.

### Tu fais accompagné

« Me guider » conserve la réponse déjà saisie et montre un seul moteur adapté
à la question. Un choix faux apporte une indication de position, sans compter
les parts à la place de l'élève.

### Tu fais seul

L'énoncé reste nu. L'élève saisit le décimal, le numérateur ou les deux champs
de la fraction sans représentation visible.

### Correction et réactivation

La correction reprend le même moteur et la même égalité que l'aide. Le bilan
local sépare NC-03, NC-04 et l'usage de l'aide. Une nouvelle série seedée
réactive les mêmes savoir-faire avec d'autres valeurs.

## 7. Manipulation et représentation

La double droite rend perceptible que deux écritures occupent le même point.
La grille de 100 relie demis et quarts aux centièmes. Le tableau rend visible
le rang du dernier chiffre et la fonction des zéros intercalés. Au-delà de 1,
les groupements conservent une échelle fixe : chaque unité garde deux cases
pour les demis ou quatre cases pour les quarts, y compris dans le reste. Il
n'existe aucun glisser-déposer ni appui sans effet mathématique.

## 8. Cohérence cours — aide — correction

Les trois contextes utilisent les mêmes briques : fraction empilée, double
droite, grille, groupements et tableau à quatre colonnes. Le cours montre la
méthode complète, l'aide la fait construire et la correction explique
l'instance avec la représentation pertinente.

## 9. Présentation dans les deux contextes

En entraînement, le pavé interne affiche chiffres et virgule pour un décimal,
chiffres seuls pour une fraction. Le clavier physique accepte aussi le point ;
`Tab` change de champ dans la fraction libre. La saisie est figée après
validation.

Au tableau, la question et les données sont identiques, mais aucune saisie ni
trace n'est créée. Les commandes communes révèlent la réponse, la correction
et le cours. Téléphone, ordinateur et TNI conservent l'en-tête, la zone
centrale défilable, les panneaux et le dock communs.

## 10. Validation

Les contrats, normalisations, produits en croix, diagnostics, générateurs,
quotas, déterminisme, menu unique, six pages de cours, deux contextes et
réutilisation des représentations sont couverts par des tests automatisés.

La recette visuelle Chromium post-correctif est archivée à `320 × 568`,
`402 × 874`, sur TNI à `1 920 × 1 080` et en reflow équivalent au zoom 200 %
à `640 × 360`. Les en-têtes ont aussi été vérifiés à 320, 340, 360, 375, 390
et 402 px sans recouvrement. La page 4 du cours ne déborde ni sur mobile ni
sur ordinateur ; l'aide et la correction restent propres. Aucun overflow,
élément hors écran, cible inférieure à 44 px, collision ou erreur JavaScript
n'a été relevé.

Le statut reste `construit` pendant le pilote public non référencé. Gwenaël a
autorisé cette mise à disposition le 8 août 2026 afin que Claire puisse aussi
l'essayer ; leurs retours peuvent encore entraîner des corrections avant le
passage à `valide`.
