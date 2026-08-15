# Audit d'organisation de Solèy — ce que chaque niveau enseigne, exige et coûte

Relevé du 16/08/2026 sur `origin/main`. **Aucun chiffre de ce document n'est estimé :
tout est mesuré, et les commandes sont données pour qu'on puisse le refaire.**

Ce document ne décide rien. Il pose les faits, montre les trous, et se termine par
cinq questions dont les réponses appartiennent à Gwenael.

---

## 1. Comment c'est mesuré

**R** = nombre d'essais avant de tomber sur une configuration gagnante, en ordre
d'essai aléatoire, dans l'« espace éclairé » (les poses où chaque pièce reçoit
vraiment un rayon). C'est une mesure de **résistance au tâtonnement**, pas de
difficulté de compréhension : un niveau peut être bas en R et rester obscur.
**Rtout** = le même, pour une victoire qui ramasse TOUS les fruits — la couche ☀☀.

```bash
node tests/soley/solveur-etalon.mjs --monde <id> --sans-libre --budget 1600000 --json
node tests/soley/notion-forcee.mjs <monde> <type>      # type : m s2 s3 x2 x3 b
```

Le second retire de la boîte toutes les pièces d'un type et redemande s'il existe
encore une victoire. **Un niveau qui enseigne doit être ingagnable sans la pièce de
sa notion** (SOLEY.md §5, point 16).

**Trois niveaux restent sans victoire trouvée** même à 3 millions de configurations
et même sans le filtre du coup mort : forêt « Cinq sixièmes » et « Les douzièmes »,
Mafate « Le sommet ». Leur solution de référence est pourtant valide. On ne conclut
donc **pas** qu'ils sont impossibles : leur espace dépasse simplement le budget.

---

## 2. La courbe de difficulté, monde par monde

| # | monde | niv. | médiane R | min | max | découvertes | lignes `CALC` | `solMin` | fruits |
|--:|---|--:|--:|--:|--:|--:|--:|--:|--:|
| 1 | Le lagon | 10 | **175** | 4 | 5 535 | 4 | 6 | 5/10 | 6 |
| 2 | Les champs de canne | 8 | **1 754** | 32 | 21 249 | 0 | **0** | **8/8** | 8 |
| 3 | La forêt | 9 | **233** | 14 | 21 807 | 2 | 8 | **0/9** | 19 |
| 4 | Le volcan | 7 | **631** | 12 | 9 536 | 0 | 6 | **0/7** | 18 |
| 5 | Les pitons | 7 | **100** | 5 | 30 188 | 0 | 7 | **0/7** | 12 |
| 6 | Les soleils | 8 | **642** | 4 | 5 933 | 0 | 8 | **0/8** | 17 |
| 7 | Le marché | 6 | **225** | 4 | 6 647 | 0 | 6 | **0/6** | 14 |
| 8 | Les tunnels | 8 | **253** | 18 | 60 091 | 0 | 6 | **0/8** | 25 |
| 9 | Mafate | 7 | **26 111** | 27 | 42 741 | 0 | 6 | **0/7** | 23 |

**Ce que ça dit.**

1. **La courbe monte, redescend, remonte.** Le monde 2 est le deuxième plus dur du
   jeu, le monde 5 est le plus facile. **Mais attention au biais** : la canne est le
   seul monde retravaillé après le lagon. Ce classement mesure surtout **qui a été
   refait**, pas l'ordre des notions. Gwenael l'a dit avant que la mesure ne le
   confirme : « les niveaux à partir de la forêt n'ont jamais été retravaillés ».
2. **`solMin` est le marqueur du travail fait** : 13 niveaux sur 70 en ont un. Les
   **46 niveaux de la forêt à Mafate n'en ont aucun** — on n'a jamais prouvé qu'un
   seul de leurs fruits se mérite.
3. **Toutes les découvertes du jeu sont dans deux mondes** (lagon 4, forêt 2). Les
   sept autres n'enseignent rien explicitement.
4. **La canne n'a aucune ligne `CALC`** : c'est le seul monde sans aide au calcul,
   et c'est cohérent avec sa promesse — « rien de neuf à apprendre, tout à chercher ».

---

## 3. Où chaque notion est rencontrée pour la première fois, et où elle est enseignée

Tout écart entre les deux colonnes est un trou.

## Dénominateurs

| fraction | première rencontre | cours |
|---|---|---|
| 1/2 | 3 · lagon « Moitié-moitié » | ✔ `demi` |
| 1/3 | 6 · lagon « Partage en tiers » | ✔ `tiers` |
| 1/4 | 7 · lagon « Les quatre quarts » | ✔ `quart` |
| 1/6 | 9 · lagon « Les six sixièmes » | ✔ `sixieme` |
| 1/8 | 16 · canne « Le grand tri » | **aucun** |
| 1/9 | 17 · canne « La chambre close » | **aucun** |
| 1/12 | 18 · canne « Les deux chemins du sixième » | **aucun** |

## Mécaniques

| mécanique | première rencontre | enseignée ? |
|---|---|---|
| les fruits à valeur | 12 · canne « Le letchi difficile » | **aucun cours** |
| les portes orientées | 14 · canne « La croisée des rayons » | **aucun cours** |
| les soleils multiples | 14 · canne « La croisée des rayons » | **aucun cours** |
| la lentille (addition) | 19 · foret « Recoller les morceaux » | ✔ `somme` et `denominateur` (forêt) |
| les loupes (multiplication) | 28 · volcan « La loupe » | **aucun cours** |
| les écritures (décimal, %) | 35 · pitons « C'est pareil ! » | **aucun cours** |
| les passes | 37 · pitons « La passe étroite » | **aucun cours** |
| les soleils à valeur | 42 · soleils « Un soleil qui vaut 2 » | **aucun cours** |
| les pièces scellées | 59 · tunnels « Le prisme scellé » | **aucun cours** |

**Le trou le plus net** : sept mécaniques sur neuf n'ont **aucun** point de cours, et
trois dénominateurs non plus. Deux d'entre elles arrivent en plein casse-tête :
les **portes orientées** sont découvertes dans « La croisée des rayons », un défi à
6 841 essais, et les **fruits à valeur** dans « Le letchi difficile ».

Nuance importante : 1/8, 1/9 et 1/12 ne sont pas des notions neuves — ce sont les
mêmes gestes appliqués à d'autres nombres. **Un seul cours dirait la règle une bonne
fois** : recouper une part multiplie le dénominateur. Le lagon la montre déjà deux
fois sans jamais la dire (le quart est la moitié de la moitié, le sixième est le
tiers de la moitié).

---

## 4. Les niveaux qui n'obligent pas à faire ce qu'ils annoncent

Le contrôle « le niveau force-t-il sa notion ? » a tourné sur les 70 niveaux et les
six types de pièce. Il faut lire ses résultats avec discernement : dans un monde de
**recherche**, une boîte plus fournie que nécessaire est **voulue** (c'est le surplus,
la mécanique même des champs de canne), et dans un niveau de **choix** — « Quel rayon
passe ? » — retirer la mauvaise pièce rend forcément le niveau plus facile.

Restent **quatre cas où un niveau annonce une notion qu'il n'oblige pas à employer** :

| niveau | ce qu'il annonce | ce que la mesure dit |
|---|---|---|
| **marché 5 · « L'addition du marché »** | une addition | se gagne **sans la lentille** (275 façons), sans miroir, sans ×2, sans ×3 — en **2 pièces**, R = 42 |
| **soleils 8 · « La passe des soleils »** | recoller pour franchir | se gagne **sans la lentille** |
| **Mafate 4 · « Les trois cheminées »** | l'addition en fin de jeu | se gagne **sans la lentille** (499 façons) |
| **forêt 1 · « Recoller les morceaux »** | la lentille additionne | se gagne **sans elle** (196 façons) — déjà traité : il a cessé d'être une découverte |

**Et la règle qui explique les quatre :** un niveau force l'addition **si et seulement
si au moins une de ses cibles ne peut pas être obtenue par un seul rayon**. Une case
qui demande 1/1 quand le soleil vaut 1, ou 1/2 quand un ÷2 traîne dans la boîte, ne
forcera jamais rien.

---

## 5. Les fruits

**19 fruits dans la forêt, 25 dans les tunnels, 23 à Mafate — et pas un seul `solMin`
dans ces trois mondes.** Autrement dit : on n'a jamais vérifié qu'y ramasser les
fruits demande autre chose que de gagner.

C'est probablement **le plus gros levier de difficulté disponible**, et le moins
coûteux : il ne touche ni à l'ordre des mondes, ni aux cours, ni aux plateaux — juste
à la place des fruits. Et il correspond exactement à ce qu'un monde-école doit être :
**la victoire est facile, les fruits se méritent.**

---

## 6. Les cinq questions, pour Gwenael

**Q1 — Les niveaux 4 et 5 de la forêt.** « Les sixièmes » (R = 14, une seule solution,
2 pièces) et « Les huitièmes » (R = 542) sont du **partage** dans un monde d'**addition**,
et « Les sixièmes » refait une notion que le lagon enseigne et que la canne fait
chercher. Où vont-ils : retirés, reversés à la canne, ou gardés ?

**Q2 — Une découverte « recouper » en fin de lagon**, qui dirait la règle générale
(recouper une part multiplie le dénominateur) et légitimerait 1/8, 1/9, 1/12 d'un
coup. Ou trois cours séparés, un par nombre ? *(Ma recommandation : un seul.)*

**Q3 — Un champ mixte après la forêt**, qui combine partage et addition. Le chemin de
l'école le rendrait contournable sans une ligne de code en plus. Où le place-t-on, et
que met-on dedans ?

**Q4 — Les fruits qui se méritent.** Règle proposée : *dans un monde-école, la victoire
est facile et les fruits se méritent* — mesurable par la présence d'un `solMin` et par
un Rtout nettement supérieur à R. On l'adopte ? Et sur quels mondes on commence ?

**Q5 — Les quatre niveaux du §4** qui annoncent une notion sans l'obliger. On les
redessine, ou on change leur promesse ?

**Une sixième, qui n'était pas prévue :** les sept mécaniques du §3 sans aucun cours.
Faut-il des points de cours pour les portes, les passes, les loupes, les soleils à
valeur — ou la consigne du niveau suffit-elle quand la mécanique se voit ?

---

## 7. Ce qu'il ne faut PAS re-débattre

Décisions déjà prises et gravées dans `SOLEY.md` §6 :

- **La canne reste en position 2.** Elle promet « rien de neuf à apprendre, tout à
  chercher » : c'est le bon geste après une école, et Gwenael l'a jouée et validée.
- **Pas de mondes-école séparés.** Mesuré : aucun verrou n'oblige à battre un niveau
  au-delà de 2 383 essais, personne n'est bloqué. Le chemin de l'école (réussir une
  école ouvre le champ suivant ET l'école suivante) suffit.
- **Les défis sont sans aide et jamais bloquants.**
- **Le support d'un point de cours est la bande de fractions ; le rayon reste le
  support du jeu.**
- **La peau ne touche jamais à ce qui se lit.**

---

## 8. Le tableau des 70 niveaux

`R` et `Rtout` en essais ; `prof` = nombre minimal de pièces d'une victoire ;
`forcé` liste les types de pièce sans lesquels le niveau devient ingagnable, et `✗`
ceux dont il peut se passer ; `⚠` = budget atteint, la valeur est un plancher.

| # | monde | niveau | enseigne | R | Rtout | prof | forcé | solMin | fruits |
|--:|---|---|---|--:|--:|--:|---|:-:|--:|
| 1 | lagon | Premier rayon |  | 4 | 4 | 1 | b |  | 0 |
| 2 | lagon | Zigzag dans les roches |  | 175 | 2 071 | 3 | b ✗s2 | ✔ | 1 |
| 3 | lagon | Moitié-moitié | **demi** | 5 | 5 | 1 | s2 |  | 0 |
| 4 | lagon | Le tour du lagon |  | 518 | 21 282 | 3 | s2 b ✗s3 | ✔ | 2 |
| 5 | lagon | La part perdue |  | 1 907 | 5 064 | 4 | s2 b ✗s3 | ✔ | 1 |
| 6 | lagon | Partage en tiers | **tiers** | 5 | 5 | 1 | s3 |  | 0 |
| 7 | lagon | Les quatre quarts | **quart** | 19 | 16 | 3 | s2 |  | 0 |
| 8 | lagon | La moitié de la moitié |  | 1 909 | 7 326 | 3 | s2 b ✗s3 | ✔ | 1 |
| 9 | lagon | Les six sixièmes | **sixieme** | 51 | 51 | 3 | s2 s3 |  | 0 |
| 10 | lagon | Le tiers de la moitié |  | 5 535 | 37 445 | 4 | s2 s3 b | ✔ | 1 |
| 11 | canne | Premier coup de sabre |  | 325 | 1 124 | 3 | s2 b ✗s3 | ✔ | 1 |
| 12 | canne | Le letchi difficile |  | 32 | 94 | 2 | s2 b | ✔ | 1 |
| 13 | canne | La part perdue devient le trésor |  | 737 | 18 731 | 3 | s3 b ✗s2 | ✔ | 1 |
| 14 | canne | La croisée des rayons |  | 6 841 | 81 969 | 5 | s2 b ✗s3 | ✔ | 1 |
| 15 | canne | Le tour du champ |  | 953 | 4 595 | 4 | s2 b | ✔ | 1 |
| 16 | canne | Le grand tri |  | 21 249 | 277 814 | 4 | s2 ✗s3 ✗b | ✔ | 1 |
| 17 | canne | La chambre close |  | 1 754 | 6 465 | 3 | s3 b | ✔ | 1 |
| 18 | canne | Les deux chemins du sixième |  | 18 263 | 320 939 | 6 | s2 s3 b | ✔ | 1 |
| 19 | foret | Recoller les morceaux |  | 91 | 11 813 | 3 | b ✗m ✗s2 |  | 2 |
| 20 | foret | Deux tiers | **somme** | 233 | 525 | 4 | m s3 b |  | 1 |
| 21 | foret | Trois quarts | **denominateur** | 2 383 | 8 351 | 6 | m s2 b |  | 1 |
| 22 | foret | Les sixièmes |  | 14 | 14 | 2 | s2 s3 |  | 1 |
| 23 | foret | Les huitièmes |  | 542 | 526 | 5 | s2 b |  | 3 |
| 24 | foret | Cinq sixièmes |  | — ⚠ | — | — | m s2 s3 b |  | 2 |
| 25 | foret | Les douzièmes |  | — ⚠ | — | — | m s2 s3 b |  | 3 |
| 26 | foret | Le champ de roches |  | 145 | 1 116 | 3 | s2 b |  | 3 |
| 27 | foret | La clairière |  | 21 807 ⚠ | 90 758 | 7 | m s3 b |  | 3 |
| 28 | volcan | La loupe |  | 12 | 12 | 2 | s3 x2 |  | 1 |
| 29 | volcan | Trois demis |  | 21 | 19 | 4 | s2 x3 b |  | 2 |
| 30 | volcan | Bouquet de neuvièmes |  | 9 536 | 24 629 | 5 | m s3 b |  | 3 |
| 31 | volcan | Deux neuvièmes |  | 1 708 | 1 770 | 6 | s3 x2 x3 b |  | 3 |
| 32 | volcan | Le grand labyrinthe |  | 4 853 | 14 622 | 5 | s2 b |  | 3 |
| 33 | volcan | L'éruption |  | 203 | 222 | 5 | s2 s3 x2 x3 b |  | 3 |
| 34 | volcan | Défi du volcan |  | 631 ⚠ | 2 524 | 9 | m s2 x3 b ✗x2 |  | 3 |
| 35 | pitons | C'est pareil ! |  | 5 | 5 | 1 | s2 |  | 1 |
| 36 | pitons | Trois écritures |  | 10 | 11 | 2 | s2 |  | 1 |
| 37 | pitons | La passe étroite |  | 100 | 119 | 4 | m s2 b |  | 1 |
| 38 | pitons | Quel rayon passe ? |  | 43 | 41 | 2 | s3 b ✗s2 |  | 2 |
| 39 | pitons | Le tamis |  | 30 188 | 62 032 | 7 | m s2 b |  | 2 |
| 40 | pitons | Égal ou pas ? |  | 689 | 906 | 4 | s2 s3 b |  | 2 |
| 41 | pitons | Le col des comparaisons |  | 161 | 154 | 3 | s2 b |  | 3 |
| 42 | soleils | Un soleil qui vaut 2 |  | 5 | 5 | 1 | s2 |  | 1 |
| 43 | soleils | Deux tiers d'un coup |  | 4 | 4 | 1 | s3 |  | 1 |
| 44 | soleils | Deux soleils |  | 133 | 164 | 3 | m b |  | 2 |
| 45 | soleils | Un et demi |  | 5 933 | 23 342 | 6 | m s2 b |  | 2 |
| 46 | soleils | Trois petits soleils |  | 4 646 | 7 733 | 4 | m b |  | 3 |
| 47 | soleils | Quatre tiers |  | 249 | 531 | 4 | m s3 b |  | 2 |
| 48 | soleils | Les soleils jumeaux |  | 1 505 | 13 771 | 2 | m s2 ✗x2 ✗b |  | 3 |
| 49 | soleils | La passe des soleils |  | 642 | 630 | 3 | s2 b ✗m ✗x2 |  | 3 |
| 50 | marche | Écritures décimales |  | 10 | 11 | 2 | s2 |  | 1 |
| 51 | marche | Les pourcentages |  | 4 | 4 | 2 | s2 |  | 2 |
| 52 | marche | L'étiquette 0,75 |  | 2 356 | 17 200 | 6 | m s2 b |  | 2 |
| 53 | marche | Remise de 25 % |  | 6 647 | 22 011 | 6 | m s2 b |  | 3 |
| 54 | marche | L'addition du marché |  | 42 | 202 | 2 | s3 ✗m ✗x2 ✗x3 ✗b |  | 3 |
| 55 | marche | Le grand marché |  | 225 | 692 | 4 | s2 b |  | 3 |
| 56 | tunnels | Le serpent |  | 28 | 28 | 4 | b |  | 3 |
| 57 | tunnels | La fourche |  | 253 | 255 | 5 | s2 b |  | 3 |
| 58 | tunnels | Le tourbillon |  | 184 | 157 | 6 | b |  | 4 |
| 59 | tunnels | Le prisme scellé |  | 29 | 42 | 2 | b |  | 2 |
| 60 | tunnels | La galerie scellée |  | 18 | 19 | 2 | b |  | 3 |
| 61 | tunnels | Les demi-tunnels |  | 1 008 | 946 | 6 | m s2 b |  | 3 |
| 62 | tunnels | L'impasse aux letchis |  | 6 912 | 6 989 | 4 | m s2 b |  | 3 |
| 63 | tunnels | Le grand réseau |  | 60 091 | 57 301 | 7 | s2 s3 b |  | 4 |
| 64 | mafate | L'entrée du cirque |  | 42 741 | 53 660 | 5 | s2 s3 b |  | 3 |
| 65 | mafate | Deux soleils sur les îlets |  | 26 111 ⚠ | — | 4 | m s2 b |  | 3 |
| 66 | mafate | La passe de la Rivière |  | 34 488 | 37 377 | 4 | m s3 b ✗s2 |  | 3 |
| 67 | mafate | Les trois cheminées |  | 4 050 ⚠ | 46 946 | 6 | s2 x2 x3 b ✗m |  | 3 |
| 68 | mafate | Le labyrinthe des remparts |  | 15 817 | 13 663 | 5 | s2 b |  | 4 |
| 69 | mafate | Les verrous du cirque |  | 27 | 26 | 4 | b |  | 3 |
| 70 | mafate | Le sommet |  | — ⚠ | — | — | m s2 s3 x2 b |  | 4 |