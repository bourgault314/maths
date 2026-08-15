# Essai — rendre les niveaux de Solèy vraiment difficiles (15/08/2026)

> **v2 — après les trois arbitrages de Gwenael.** « Le tour du lagon » : ma version
> est ANNULÉE, le niveau reste exactement comme en ligne. « La croisée des rayons » :
> redensifiée (7 % → 22 % d'obstacles) et re-mesurée. « La chambre close » : j'ai tenté
> la chambre longue à embranchements, le solveur dit qu'elle est moins bonne — je garde
> la version courte, mesures à l'appui (§6).

> **Rien n'est publié.** Branche locale `essai-niveaux-durs`, patch en fichier.
> Pas de push, pas de PR, pas de fusion. Gwenael décide après lecture.

Point de départ : « jamais plus de trente secondes pour trouver quoi que ce soit »
(verdict après avoir joué le monde de la canne en ligne), et « les retouches du
lagon sont peu visibles ». Objectif du projet : **il faut que mes élèves cherchent**.

---

## 1. D'abord mesurer, sinon on recommence à l'aveugle

La difficulté n'avait jamais été mesurée. Premier livrable, avant tout niveau :
un **solveur-étalon** en force brute (`tests/soley/solveur-etalon.mjs`). Il charge
`levels.js` + `engine.js` dans un `vm` (patron exact de `createGameContext` de
`tests/soley-public.test.mjs`) et appelle `simulate()` du moteur : **aucune
physique n'est réécrite**.

### Deux espaces de recherche

**A. Espace libre** — toutes les façons de poser un sous-ensemble de la boîte sur
les cases libres. C'est la force brute littérale. Taille exacte par dénombrement,
`G` estimé par tirage uniforme.
*Verdict : mauvaise mesure.* Elle classe « La chambre close » (boîte de 9,
plateau 9×7, espace 1,3·10¹⁴) comme le niveau le plus dur du monde — alors qu'il
se joue tout seul. Elle mesure la taille du plateau et de la boîte, pas la
recherche. Elle reste dans le script comme contexte (`--sans-libre` pour la
couper), pas comme mesure.

**B. Espace éclairé** — les configurations où **chaque pièce posée reçoit un
rayon qu'elle accepte**, et où aucune pose ne tue le rayon sur place (la pièce qui
le renvoie dans une roche à une case de là : un élève voit ce coup mourir et le
défait dans la seconde). C'est le vrai espace de tâtonnement, et il est
énumérable exhaustivement. Toute configuration gagnante « sans pièce inutile » y
est atteignable (on ajoute les pièces dans l'ordre du flux de lumière).
**C'est la mesure principale.**

### Les grandeurs

| | |
|---|---|
| `E` | espace exploré (nombre de configurations) |
| `G` · `Gtout` | configurations gagnantes · gagnantes **et** qui ramassent tous les fruits |
| `R` | rang moyen de la 1re victoire, ordre d'essai aléatoire, 200 tirages sans remise (espérance exacte `(E+1)/(G+1)` donnée en regard — les deux collent à quelques % près) |
| `Rtout` | le même, pour une victoire qui ramasse **tout** — c'est la couche ☀☀ |
| `prof` | plus petit nombre de pièces d'une configuration gagnante |
| `λ` | **largeur du tâtonnement par pose**, définie par `R = λ^prof` |

`λ` a été ajouté après l'étalonnage, et il est le garde-fou de tout l'essai.
« La chambre close » actuelle affiche `R = 15 900` — apparemment le niveau le plus
dur du jeu — avec `λ = 2,9` : neuf poses **dictées** l'une après l'autre, deux
plans gagnants en tout, boîte exacte (9 pièces pour 9). Ce n'est pas de la
recherche, c'est de la longueur. **Allonger un couloir gonfle `R` sans faire
chercher.** Tout niveau de cet essai devait donc monter `R` *et* tenir `λ`.

Explosion combinatoire : bornée par un budget de nœuds (`--budget`, 1,6 M pour les
mesures finales). Quand il est atteint, c'est écrit et `R` est un **plancher**
(deux niveaux concernés, signalés dans les tableaux).

---

## 2. Étalonnage obligatoire — le contrôle négatif

Les 8 niveaux **actuels** de la canne, passés au solveur avant de dessiner quoi
que ce soit. Ils doivent sortir faciles : c'est la condition de validité de
l'outil.

| Niveau (en ligne) | E | G | prof | **R** | Rtout | λ |
|---|---:|---:|---:|---:|---:|---:|
| Premier coup de sabre | 249 | 5 | 2 | **45** | 132 | 6,5 |
| Le letchi difficile | 181 | 5 | 2 | **32** | 94 | 5,5 |
| La part perdue devient le trésor | 169 | 10 | **1** | **18** | 56 | 15,5 |
| La croisée des rayons | 46 841 | 309 | 2 | **156** | 965 | 12,3 |
| Le tour du champ | 1 158 | 55 | 5 | **22** | 406 | **1,8** |
| Le grand tri | 359 789 | 8 336 | 2 | **46** | 424 | 6,6 |
| La chambre close | 49 903 | 2 | 9 | 15 929 | 16 167 | **2,9** |
| Les deux chemins du sixième | 284 292 | 25 889 | 2 | **10** | 1 187 | 3,3 |

**Le contrôle passe, et il dit exactement ce que Gwenael a ressenti.** Médiane de
`R` : **45**. Sept niveaux sur huit se gagnent en **1 ou 2 pièces** — voilà les
trente secondes. Et les deux niveaux qui montent (`Le tour du champ`, `La chambre
close`) montent par la **longueur** (λ = 1,8 et 2,9), pas par la recherche : ce
sont des couloirs. Le seul niveau qui fait vraiment choisir, `La croisée`
(λ = 12,3), se gagne quand même en 2 pièces.

Lagon (5 niveaux d'entraînement, en ligne) :

| Niveau | E | G | prof | **R** | Rtout | λ |
|---|---:|---:|---:|---:|---:|---:|
| Zigzag dans les roches | 92 | 9 | 2 | **10** | 23 | 3,1 |
| La part perdue | 49 | 12 | 2 | **4** | 10 | 2,0 |
| La moitié de la moitié | 233 882 | 502 | 2 | 437 | 2 801 | 21,6 |
| Quarts en croix | 3 024 | 22 | 3 | 118 | 591 | 5,1 |
| Le tour du lagon | 389 457 | 767 | 3 | 518 | 21 282 | 8,0 |

« Peu visibles » est mesuré aussi : deux niveaux à `R` = 4 et 10.

---

## 3. Ce que les chiffres ont corrigé dans le diagnostic

Le diagnostic visait **40-60 % d'obstacles** sur les niveaux tardifs. Mesures à
l'appui, **ce serait une erreur**, et l'essai s'en écarte volontairement :

- Un champ de cannes tiré au hasard à 40 % : **60 champs sur 60 n'ont laissé
  passer aucune chaîne de trois prismes.** À cette densité le plateau ne
  contraint plus, il interdit.
- Un champ dessiné, dense mais à couloirs, à 54 % (`La chambre close`, 1er jet) :
  jouable, mais `λ = 2,4` — le champ **dicte** au lieu de faire choisir.
- Les niveaux de cet essai qui résistent le mieux tournent entre **14 et 36 %**
  d'obstacles, avec des **couloirs longs** et une **boîte riche**.

**La densité n'est pas le levier ; elle en est un effet de bord.** Le vrai levier,
celui que l'étalonnage désigne du doigt, c'est la **profondeur du plan gagnant
minimal** : passer de 2 à 4-5 pièces multiplie `R` par `λ²` ou `λ³`. La densité
sert alors à une seule chose, mais elle est indispensable : **tuer les victoires
courtes**. C'est elle qui empêche le plan à 2 pièces d'exister.

Méthode de conception qui en découle, et qui est celle du diagnostic (point 5)
prise au sérieux : **aucune solution n'a été dessinée**. On fixe l'intention
(grille, soleils, cases, portes, boîte), on taille le champ, et **le solveur
trouve les plans** — `sol` (gourmand : gagne + tous les fruits) et `solMin`
(gagne sans tout ramasser) sont des **sorties** du solveur, pas des entrées.
Trois outils versés au dépôt :

- `tests/soley/atelier-niveaux.mjs` — champ en **carte ASCII**, mesures, plans trouvés dessinés sur la carte ;
- `tests/soley/carte-fruits.mjs` — **où poser les fruits** : pour chaque case et chaque valeur de rayon, combien de plans gagnants y passent et à partir de quelle profondeur ;
- `tests/soley/tailleur-champs.mjs` — recuit local : part d'un champ jouable, retaille quelques cannes, garde si le niveau résiste mieux (score = profondeur d'abord, puis `R`, puis `λ`) ;
- (`tests/soley/semeur-champs.mjs` — tirage de champs au hasard. **Conservé comme preuve d'échec** : c'est lui qui a établi le résultat sur la densité.)

---

## 4. Les niveaux — avant / après

Boîte, portes, fruits : tout est mesuré. `R` en gras. `†` = budget de nœuds
atteint, `R` est un plancher.

### Les champs de canne (bloc 9-16, noms et ordre intacts)

| Niveau | prof av→ap | **R** av→ap | Rtout av→ap | λ av→ap | obst. | boîte / par |
|---|---|---|---|---|---|---|
| **1. Premier coup de sabre** | 2 → **3** | 45 → **325** | 132 → **1 124** | 6,5 → 7,0 | 15 % | 6 / 5 |
| **2. Le letchi difficile** | *inchangé — c'est la découverte des fruits à valeur, il doit rester doux* | | | | | |
| **3. La part perdue devient le trésor** | 1 → **3** | 18 → **737** | 56 → **18 731** | 15,5 → 8,9 | 13 % | 7 / 5 |
| **4. La croisée des rayons** | 2 → **5** | 156 → **6 841** | 965 → **81 969** | 12,3 → 6,0 | **22 %** | 8 / 6 |
| **5. Le tour du champ** | 5 → **4** | 22 → **953** | 406 → **4 595** | 1,8 → **5,4** | 36 % | 7 / 6 |
| **6. Le grand tri** | 2 → **4** | 46 → **21 249** | 424 → **277 814** | 6,6 → 11,8 | 27 % | 7 / 5 |
| **7. La chambre close** | 9 → 3 | 15 929 → 1 755 | 16 167 → 6 465 | 2,9 → **12,3** | 30 % | 7 / 4 |

*(`La croisée` n'est plus bornée par le budget : son espace est désormais énuméré en entier — 302 775 configurations, 39 gagnantes, 3 seulement qui ramassent le letchi ½.)*
| **8. Les deux chemins du sixième** | 2 → **6** | 10 → **18 263** | 1 187 → **320 939** | 3,3 → 5,1 | 14 % | 7 / 7 |

**Médiane des 7 niveaux redessinés : `R` 45 → 1 755 (× 39), `Rtout` 424 → 18 731
(× 44), profondeur 2 → 4.** L'objectif « un ordre de grandeur au-dessus » est
tenu, souvent deux.

**L'idée de chaque niveau, et où est le piège :**

1. **Premier coup de sabre** — mise en jambe : le soleil tire vers la gauche, deux
   cases veulent le même demi. *Piège* : la boîte donne un ÷3 et quatre miroirs
   pour trois pièces utiles ; le fruit (facultatif) n'est traversé que par le
   rayon **entier**, donc avant toute coupe — 3 pièces pour gagner, **5** pour
   tout prendre.
3. **La part perdue devient le trésor** — le ÷3 fabrique trois parts, il n'y a que
   deux cases. *Piège* : la troisième part est la seule qui puisse atteindre le
   letchi ⅓, et le soleil tire vers le **haut** : il faut d'abord tourner, ce qui
   déplace toute la coupe. 3 pièces pour gagner, 5 pour le fruit — et `Rtout`
   passe de 56 à 18 731.
4. **La croisée des rayons** — deux soleils, deux cases à porte orientée, un seul
   carrefour au milieu. *Piège* : une pièce posée au croisement sert un rayon et
   **arrête l'autre** (une pièce n'accepte qu'une direction d'entrée) ; les portes
   interdisent de servir les deux cases avec un seul soleil. Sel supplémentaire :
   au départ, le deuxième soleil **atteint déjà sa case** — mais il y arrive entier,
   « 1 au lieu de 1/4 ». Le niveau s'ouvre donc sur un rayon qui touche au but et
   se trompe : il faut le couper en chemin. 3 plans sur 39 ramassent le letchi ½.
5. **Le tour du champ** — le cœur du champ est bouché, la porte de la case tourne
   le dos au soleil. *Piège* : ce n'était qu'un couloir (λ = 1,8) ; la couronne
   passe à 2-3 cases de large, la coupe peut se faire à beaucoup d'endroits du
   tour, et une seule position sert la porte. λ triple.
6. **Le grand tri** — deux cases à 1/8, tout le reste du soleil est de trop.
   *Piège* : ½ puis ¼ partent en pure perte et **ne doivent pas** tomber dans une
   case (une case n'accepte qu'un rayon : un rayon perdu qui arrive dessus fait
   perdre). Le letchi ½ oblige à rediriger le déchet de la première coupe.
   `R` = 21 249, `Rtout` = 277 814.
7. **La chambre close** — chambre fermée, une entrée, une case à 1/9 dedans,
   porte à l'ouest. *Piège* : il faut décider **dehors** combien de fois couper —
   entrer avec un tiers ou entrer avec un neuvième ne mène pas au même plan.
   `R` baisse (le couloir de 9 poses a disparu) mais λ passe de 2,9 à **12,3** :
   c'est le niveau qui a le plus changé de nature. *Voir la note d'honnêteté §6.*
8. **Les deux chemins du sixième** — 1/6 d'un côté, 1/12 de l'autre. *Piège* :
   ÷2 puis ÷3 et ÷3 puis ÷2 donnent le même sixième, mais **une seule des deux
   routes** laisse de quoi fabriquer le douzième et franchir la porte. Plan
   minimal : **6 pièces** ; un seul plan sur 34 ramasse le letchi 1/12.

### Le lagon (4 niveaux d'entraînement ; tutoriel, 3 découvertes et « Le tour du lagon » intacts)

Un cran moins dense, comme demandé : gagner reste à portée d'un 6e qui débute,
la résistance va dans la couche fruits.

| Niveau | prof av→ap | **R** av→ap | Rtout av→ap | λ av→ap | obst. |
|---|---|---|---|---|---|
| Zigzag dans les roches | 2 → **3** | 10 → **175** | 23 → **2 071** | 3,1 → 5,7 | 13 % |
| La part perdue | 2 → **4** | 4 → **1 907** | 10 → **5 064** | 2,0 → 6,7 | 19 % |
| La moitié de la moitié | 2 → **3** | 437 → **1 909** | 2 801 → **7 326** | 21,6 → 12,7 | 13 % |
| Quarts en croix | 3 → **4** | 118 → **2 840**† | 591 → **5 503**† | 5,1 → 7,4 | 10 % |
| ~~Le tour du lagon~~ | *inchangé — ma version annulée, décision du 15/08* | | | | |

Les quatre retouchés : `R` × 4 à × 480, et **le fruit ne se ramasse jamais par le
plan qui gagne**.

### Fractions

Autorisées par le brief et utilisées : **1/8** (`Le grand tri`, ÷2÷2÷2), **1/9**
(`La chambre close`, ÷3÷3), **1/6 et 1/12** (`Les deux chemins du sixième`,
deux routes vers le sixième puis ÷2). Tout reste du **partage** : aucune lentille,
aucune addition, aucune loupe — la loupe ×2 qui traînait dans la boîte du
`Grand tri` (une notion du volcan offerte à des 6e) a été retirée.
`CALC` et `COURS` : **non touchés** — aucun niveau de la canne n'y a d'entrée, et
les deux entrées du lagon concernées (`1/2 ÷ 2 = 1/4`, pour `La moitié de la
moitié` et `Quarts en croix`) restent exactes après refonte. Les `hint` des
niveaux de la canne, eux, étaient vides : chacun en a reçu un (une question ou
l'égalité du partage), sinon le Coup de pouce s'ouvre sur du vide.

---

## 5. Preuves

- **`node --test tests/soley-public.test.mjs` → 16/16.**
  Compteur de fruits adapté : **145 → 142** (deux fruits en moins à la canne, un
  au lagon) — les fruits ont été *déplacés* sur des cases exigeantes, pas
  multipliés ; un fruit rare vaut mieux que deux gratuits.
  **Le contrôle P2 a été RESSERRÉ** : l'exception de `La chambre close` est
  **supprimée** — le niveau a été redessiné et son fruit se mérite comme les
  autres. Il ne reste qu'une exception, `Le tour du lagon`, laissé tel quel.
- **`python tests/soley/test_soley.py --root .` → TOUT VERT** (43 contrôles :
  cohérence des 69 niveaux, 69 `sol` gagnantes, 142 fruits ramassés, passes,
  écrans, paysage, progression, cours, T10, zéro erreur JavaScript).
- **`node tests/soley/solveur-etalon.mjs --monde canne`** rejoue l'étalonnage ;
  toutes les mesures de ce rapport sont reproductibles (graines fixes).
- **Captures 375 px** (téléphone, ×3) dans `_captures/` : `La croisée des rayons`,
  `Le tour du champ`, `Le grand tri`, `La chambre close`,
  `Les deux chemins du sixième`, `Quarts en croix`.

Aucun niveau montré ici n'a échappé au solveur : tout candidat qui tombait en
3 pièces ou moins a été **rejeté avant d'être dessiné en carte** (le tamis rapide
du semeur et du tailleur). Une vingtaine de champs ont été écartés à ce titre.

---

## 6. Ce qui ne va pas, et que je ne cache pas

1. **« Le tour du lagon » : essai abandonné, sur ma recommandation.** Mon champ
   était plus profond (3 → 5 pièces) mais la couche fruits régressait
   (`Rtout` 21 282 → 1 776) : ses 25 plans gagnants traversaient presque les mêmes
   cases, impossible d'y poser un fruit rare. Deux tentatives à deux fruits n'ont
   donné aucun plan complet. **Le niveau est resté exactement comme en ligne**, et
   le contrôle P2 garde donc son unique exception documentée pour lui.
2. **« La chambre close » : j'ai tenté la chambre longue, elle est moins bonne.**
   Sur demande de Gwenael, j'ai construit un troisième champ — même chambre fermée,
   mais avec un pilier intérieur pour créer deux routes dedans, murs protégés du
   tailleur. Mesures des trois versions :

   | version | prof | R | λ | plans gagnants |
   |---|---:|---:|---:|---:|
   | en ligne (couloir de 9 poses, boîte exacte) | 9 | 15 929 | **2,9** | 2 |
   | chambre longue à pilier (essai du 15/08) | 4 | 1 209 | 5,9 | 5 |
   | **retenue** (chambre fermée, décision dehors) | 3 | **1 755** | **12,3** | 10 |

   Le pilier **retire** des choix au lieu d'en ajouter : il coupe la chambre en
   couloirs. La version retenue reste une vraie chambre fermée à une seule entrée
   (voir la capture) ; ce qu'elle a perdu, c'est le couloir de neuf poses dictées.
3. **Deux `E` encore bornés par le budget** (`Quarts en croix` au lagon, et le
   niveau le plus ouvert de la canne) : leurs `R` sont des planchers, la vraie
   valeur est plus haute. `La croisée` ne l'est plus depuis la redensification.
4. **`R` est un modèle, pas un chronomètre.** Il compte des essais aveugles ; un
   élève raisonne. Il sert à **comparer** des niveaux mesurés pareil, pas à prédire
   des secondes. C'est pour ça que `prof` et `λ` sont donnés à côté, jamais `R` seul.
5. **Textes des consignes** : réécrits en questions, jamais la solution, écriture
   étagée, typographie française — mais ce sont des premiers jets, à polir avec
   Gwenael comme les précédents.
6. **Non testé sur élèves.** Tout ce rapport est une mesure de machine. La seule
   preuve qui compte reste une classe.

## 7. Fichiers

**Modifiés**
- `outils/club_maths/soley/js/levels.js` — **11 niveaux redessinés** (7 canne + 4 lagon).
  Noms, ordre, clés de sauvegarde, `CALC`, `COURS`, `WORLDS` : **intacts**.
  Les 69 niveaux et les 58 autres `sol` ne bougent pas.
- `tests/soley-public.test.mjs` — compteur 145 → 142 ; exception P2 de « La chambre close » supprimée.

**Ajoutés** (outils de ce lot, sur le modèle de `verifier-lot-canne.mjs`)
- `tests/soley/solveur-etalon.mjs` · `atelier-niveaux.mjs` · `carte-fruits.mjs`
  · `tailleur-champs.mjs` · `semeur-champs.mjs`
- `_captures/` — 6 captures 375 px.

**Livraison** : branche locale `essai-niveaux-durs`, patch `essai-niveaux-durs.patch`.
Rien n'est poussé.
