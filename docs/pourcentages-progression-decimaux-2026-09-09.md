# Pourcentages : progression décimale du 9 septembre 2026

## Décision et périmètre

Gwenaël a validé la progression proposée catégorie par catégorie, puis demandé
son application, ses tests, sa publication et une trace permettant de revenir
sur les décisions. Cet exerciceur autonome est distinct d’Automatismes V2.

Objectif : calcul mental. N1 : total initial entier inférieur à 100, valeurs
au dixième maximum. N2 : introduction des centièmes et de décompositions.
N3 : davantage de combinaisons, avec des nombres choisis pour le calcul mental.
La difficulté ne dépend pas seulement de la taille du total : certaines banques
N3 sont volontairement plus petites que celles de N2. La répétition est acceptée.

Les banques, les niveaux et les tirages du mode **Entiers sont conservés**.
Le calcul direct de **10 % en Décimaux est conservé aussi**.
Les textes, les gabarits, le bouton d’aide en bas à droite, les étapes
question → indice → correction et l’impression sont conservés.

La refonte de la fiche papier est un chantier suivant : la piste de deux colonnes
et la politique d’impression des aides n’ont pas été appliquées dans ce lot.

## Version de départ et retour arrière

- Dépôt : `bourgault314/maths`.
- Base avant ce lot : `f1f378b757512700b9963ddc1ba7503348306cbe`.
- Fichier : `outils/pourcentages_exerciceur.html`.
- Blob avant modification : `71eaa15699ca50fbdc732641d2f3323d87e6af96`.
- La version d’affichage précédemment publiée vient de la PR #700,
  commit `88b763bfd589f3d278e1996dcbe58bad72699653`.

[Ouvrir l’exerciceur avant le changement](https://github.com/bourgault314/maths/blob/f1f378b757512700b9963ddc1ba7503348306cbe/outils/pourcentages_exerciceur.html).

Ce lot est publié par une PR dédiée, fusionnée par squash. Son diff permet de
retrouver chaque changement. Pour annuler tout le lot, créer une nouvelle branche
et utiliser `git revert <commit-de-fusion-de-ce-lot>`, puis tester et publier par PR.
Ne pas réinitialiser tout le dépôt : les travaux indépendants doivent rester présents.
Si d’autres changements ont ensuite touché ce fichier, résoudre les éventuels
conflits en conservant ces changements, ou restaurer seulement les règles numériques
souhaitées. Une seule catégorie peut également être ajustée à partir des tables
ci-dessous. Le retour arrière est une nouvelle modification tracée ; il ne supprime
pas l’historique.

## Lecture des règles

Les bornes sont inclusives. Les totaux de départ restent des entiers positifs.
« Décimaux » autorise des valeurs décimales dans le calcul : les résultats des
multiples peuvent rester entiers, le pourcentage recherché reste entier, et le
résultat de « Trouver le tout » est ici le total entier qui a servi à la génération.

Pour 50 %, écarter les pairs ; pour 25 % et 75 %, les multiples de 4 ; pour 20 %,
les multiples de 5 ; pour 10 % et ses multiples, les multiples de 10 ; pour 5 %,
les multiples de 20. Pour 1 %, écarter les multiples de 100. Les tables ci-dessous
intègrent ces exclusions, sauf précision contraire.

## Calculer une part et multiples : 7 cases

| Case | Avant : N1 / N2 / N3 | Après : N1 / N2 / N3 | Exemples après : N1 / N2 / N3 |
|---|---|---|---|
| 50 % | Impairs 1–199 / 201–1 999 / 2 001–9 999 | Impairs 1–99 / 101–399 / 401–1 999 | 50 % de 37 = 18,5 / de 153 = 76,5 / de 753 = 376,5 |
| 25 % | 1–199 / 201–999 / 1 001–3 999, hors multiples de 4 | Pairs 2–98 / 1–199 / 201–999, hors multiples de 4 | 25 % de 26 = 6,5 / de 37 = 9,25 / de 237 = 59,25 |
| 20 % | 11–99 / 101–399 / 401–999 | 1–49 / 51–199 / 201–999 | 20 % de 24 = 4,8 / de 124 = 24,8 / de 324 = 64,8 |
| 10 % | 1–99 / 101–999 / 1 001–9 999 | Inchangé | 10 % de 37 = 3,7 / de 237 = 23,7 / de 2 737 = 273,7 |
| 5 % | N1 : pairs 2–998. N2 : pairs jusqu’à 9 998 ou nombres finissant par 5 jusqu’à 9 995. N3 : ajout des autres impairs jusqu’à 9 999 | N1 : pairs 2–98. N2 : pairs ou nombres finissant par 5, strictement inférieurs à 500. N3 : 1–999 | 5 % de 38 = 1,9 / de 135 = 6,75 / de 137 = 6,85 |
| 75 % | Même banque que 25 % aux trois niveaux | N1 : pairs 2–50. N2 : pairs 52–198, soit effectivement 54–198 après exclusion des multiples de 4. N3 : 1–399 | 75 % de 26 = 19,5 / de 126 = 94,5 / de 137 = 102,75 |
| Multiples de 10 % | N1 : deux chiffres non nuls dans un total jusqu’à 9 999, donc 9 007 possible. N2 : trois chiffres non nuls avec un zéro intérieur. N3 : autres cas, dont 1–9 | N1 : 1–9. N2 : 11–99 hors multiples de 10. N3 : 100a + b avec a et b entre 1 et 9 (101–109, 201–209… 901–909) | 70 % de 8 = 5,6 / 30 % de 24 = 7,2 / 30 % de 204 = 61,2 |

Multiples de 10 % : les taux 20, 30, 40, 60, 70, 80 et 90 % restent proposés aux
trois niveaux. Les banques de 25 % et 75 % sont désormais distinctes.
Pour 5 %, l’ancien N2 tirait ses deux familles à parts égales, et l’ancien N3 ses
trois familles à parts égales. Désormais, chaque total admissible de la banque
choisie a la même chance avant la recherche d’un calcul non répété.

## Boss : 3 cases

| Case | Avant | Après |
|---|---|---|
| 1 % | N1 : 110–990 par dizaines, hors centaines. N2 : 101–999 hors dizaines. N3 : moitié des tirages sur 1–99, moitié sur 1 001–9 999, sans exclusion dans cette seconde famille | N1 : 10, 20… 90. N2 : 1–999 hors centaines. N3 : 1 001–9 999 hors centaines |
| 2 à 49 % | N1 : 2–9 % sur 1–9 ou 10, 20… 90. N2 : 11–49 % sur ces petits totaux, ou 2–9 % sur 11–99 ou leur décuple. N3 : scénarios donnant 2–9 %, 11–15 %, 21 ou 25 %, avec certains totaux jusqu’à 5 005 | N1 : 2–9 % sur 10, 20… 90. N2 : deux familles équiprobables, 11–49 % sur 10, 20 ou 50 ; ou 2–9 % sur 11–99 (dizaines comprises). N3 : 2–9 %, 11–15 %, 21 ou 25 %, sur 30, 70, 150 ou 250 |
| 51 à 99 % | Tous les taux 51–99 % aux trois niveaux. N1 : 110–990, deux chiffres non nuls. N2 : 1 000a + 10b, a et b de 1 à 9, soit 1 010–9 090. N3 : 1 000a + 100b + 10c, a, b et c de 1 à 9, soit 1 110–9 990 | N1 : 90, 95 ou 99 % sur 10, 20… 90. N2 : 60, 70, 80, 90, 95, 98 ou 99 % sur 110, 120… 190. N3 : tous les taux 51–99 % sur 30, 70, 150 ou 250 |

Exemples, dans l’ordre N1 / N2 / N3 :

- 1 % : 70 → 0,7 / 147 → 1,47 / 2 745 → 27,45.
- 2–49 % : 7 % de 30 = 2,1 / 7 % de 24 = 1,68 ou 23 % de 50 = 11,5 / 21 % de 150 = 31,5.
- 51–99 % : 99 % de 70 = 69,3 / 98 % de 130 = 127,4 / 83 % de 150 = 124,5.

Le N3 du Boss 2–49 % conserve l’ensemble des taux de l’ancienne version :
il n’a pas été élargi à tous les taux entre 2 et 49 %. C’est la décision affinée
lors du dernier comparatif, après la première proposition de l’autre fenêtre.
Les taux de ce N3 sont maintenant équiprobables, ainsi que ses quatre totaux.

## Trouver le % et trouver le tout : 8 cases

Avant, chaque famille proposait tous ses taux dès le N1, avec les anciennes
banques de 50 %, 25 %, 20 % ou des multiples de 10 %. Les deux colonnes partagent
maintenant la progression suivante. Le total vient de la nouvelle banque
correspondante ; pour les dixièmes, il vient des multiples de 10 %, et pour 75 %,
de la banque propre aux trois quarts.

| Cases | Avant : taux aux trois niveaux | Après N1 | Après N2 | Après N3 |
|---|---|---|---|---|
| `inv_50`, `tot_50` | 50 % | 50 % | 50 % | 50 % |
| `inv_25`, `tot_25` | 25, 75 % | 25 % | 25, 75 % | 25, 75 % |
| `inv_20`, `tot_20` | 20, 40, 60, 80 % | 20 % | 20, 40 % | 20, 40, 60, 80 % |
| `inv_10`, `tot_10` | 10, 20, 30, 40, 60, 70, 80, 90 % | 10, 20 % | 10, 20, 30, 40 % | 10, 20, 30, 40, 60, 70, 80, 90 % |

Exemples pour les deux sens :

| Famille | N1 : part / total / taux | N2 | N3 |
|---|---|---|---|
| Moitiés | 7,5 / 15 / 50 % | 76,5 / 153 / 50 % | 376,5 / 753 / 50 % |
| Quarts | 6,5 / 26 / 25 % | 94,5 / 126 / 75 % | 102,75 / 137 / 75 % |
| Cinquièmes | 4,8 / 24 / 20 % | 49,6 / 124 / 40 % | 194,4 / 324 / 60 % |
| Dixièmes | 1,6 / 8 / 20 % | 7,2 / 24 / 30 % | 142,8 / 204 / 70 % |

Ainsi, « 6,5 sur 26 représente quel pourcentage ? » donne 25 %, et
« 6,5 représente 25 % de quel total ? » donne 26.

## Augmentations et réductions : 2 cases

| Niveau | Avant | Après |
|---|---|---|
| N1 | Taux 10, 20, 25, 30, 50 %. Totaux des dixièmes pouvant atteindre 909 ; quarts et moitiés jusqu’à 199 | Taux 10, 20, 50 %. Banques directes correspondantes plafonnées à 99 |
| N2 | Taux 10, 20, 25, 30, 40, 50, 60, 70 %. Dixièmes jusqu’à 9 909 ; quarts jusqu’à 999 ; moitiés jusqu’à 1 999 | Taux 10, 20, 25, 30, 40, 50 %. Banques correspondantes plafonnées à 199 ; 30 et 40 % utilisent les multiples de 10 % |
| N3 | Tous les taux 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90 %. Totaux jusqu’à 9 999 selon la famille, avec parfois de très petits cas | Mêmes taux. Totaux inférieurs à 1 000. Pour 10, 30, 40, 60, 70, 80 et 90 %, utiliser 100a + b. Pour 20, 25, 50 et 75 %, banque directe correspondante plafonnée à 999 |

Les plafonds s’appliquent au montant initial, pas au résultat après augmentation.
Exemples N1 / N2 / N3 :

- Augmentations : 24 augmenté de 20 % → 28,8 / 37 augmenté de 25 % → 46,25 / 204 augmenté de 30 % → 265,2.
- Réductions : 24 diminué de 20 % → 19,2 / 37 diminué de 25 % → 27,75 / 204 diminué de 30 % → 142,8.

Les méthodes de correction détaillée (4e) et directe (3e) sont conservées.

## Mélange, répétition, aides et impression

Le choix du niveau et du mode Entiers/Décimaux reste un tirage indépendant pour
chaque question. Les deux modes cochés donnent chacun une chance sur deux,
sans alternance ni quota ; une petite série peut ne contenir qu’un mode.
L’équilibrage existant entre les catégories cochées est conservé.

La recherche de calculs non répétés conserve sa limite de 300 essais. Une petite
banque épuisée peut donc répéter des calculs, par exemple 20 questions de 1 % au
N1 décimal pour seulement 9 totaux disponibles. La génération doit toujours finir.
La même seed et les mêmes réglages reproduisent la même série dans cette version.
Les séries décimales d’une ancienne version nécessitent son ancien code pour être
reproduites exactement ; une seed seule n’archive pas une banque de calculs.

Les aides restent fermées pour toute nouvelle question. L’impression actuelle
ajoute le gabarit de 50 % pour 25 %, ou celui de 10 % pour 20 % et 5 %, uniquement
si cette aide a été ouverte pour la question. Une fiche créée directement depuis
les réglages n’ouvre pas automatiquement ces aides. L’option Gabarits commande les
gabarits élèves ; les corrigés gardent leurs schémas. Cette politique est conservée
jusqu’au chantier papier demandé ensuite par Gwenaël.

## Vérification et maintenance

Tests : `node --test tests/pourcentages-exerciceur.test.mjs`.

- Empreinte des **23 400 calculs et tirages Entiers**, relevée avant modification :
  `466ad21f7de9434573b748496023a616ffafd0f6d3ce30ba61a4db2065022a73`.
- Empreinte des **1 170 calculs et tirages de 10 % direct en Décimaux**, relevée avant modification :
  `385018044c49818fe9fa7d460f21733634c5a71d5c1471cdac3a6cf6dca4436e`.
- L’ancienne empreinte des 46 800 calculs des deux modes est conservée dans le
  commentaire du test et dans l’historique Git. Elle n’est plus attendue puisque
  ce lot change volontairement les décimaux.
- 120 000 questions couvrent les 20 cases × 3 niveaux × 2 modes : résultats,
  contexte, accords, bornes, taux, inversions et dixièmes au N1.
- Contrôle exhaustif des banques : effectifs, bornes, exclusions, absence de
  doublons dans les listes et absence de banque d’évolution vide.
- Déterminisme des 60 combinaisons décimales, épuisement de la petite banque de
  1 %, 1 000 séries mélangées, navigation, aides, géométrie et impression.

Les règles décimales communes sont regroupées dans `decimalTotals`, les taux
et plafonds des évolutions dans `decimalEvolutionPercents` et
`decimalEvolutionTotals`. Les parties Entiers des générateurs restent séparées.
La modification d’une banque partagée doit être vérifiée dans les cases directes,
les inversions et les évolutions qui l’utilisent. Les tests et cette note sont à
mettre à jour ensemble lors d’une décision pédagogique ultérieure.
