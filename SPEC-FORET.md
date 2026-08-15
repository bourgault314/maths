# SPEC — La forêt devient un monde-école (lot 1)

Brouillon à valider **ligne par ligne**. Tout ce qui est chiffré ici a été mesuré
sur `origin/main` à `79af6493`, jamais estimé. Rien n'est codé avant ton accord.

---

## 0. Ce que le lot fait, en une phrase

La forêt enseigne l'addition — mais son niveau d'introduction se gagne sans jamais
additionner, deux de ses consignes annoncent des découvertes déjà faites deux mondes
plus tôt, et la mise au même dénominateur, qu'elle exige dès son deuxième niveau,
n'est enseignée nulle part. Le lot rend la forêt cohérente : **chaque niveau qui
enseigne force sa notion**, et les deux notions qui manquaient reçoivent leur point
de cours.

---

## 1. La règle nouvelle : un niveau qui enseigne FORCE sa notion

**Énoncé.** Si on retire de la boîte toutes les pièces qui portent la notion d'un
niveau-découverte, ce niveau doit devenir **ingagnable**. Sinon l'élève peut le
finir sans jamais faire le geste qu'on prétend lui apprendre.

**Ce n'est pas un avis, c'est un contrôle.** L'outil existe : il retire le type de
pièce visé, relance le solveur-étalon sur le vrai moteur, et compte les victoires.
Il entrera au dépôt sous `tests/soley/notion-forcee.mjs`.

**État actuel de la forêt** (type retiré : la lentille) :

| niveau | verdict |
|---|---|
| 1. Recoller les morceaux | **NON FORCÉ — 196 victoires sans lentille, en 3 pièces** |
| 2. Trois quarts | forcé (0 victoire sur 12 778 configurations) |
| 3. Deux tiers | forcé (0 sur 816) |
| 6. Cinq sixièmes · 7. Les douzièmes | **non conclu** — budget atteint, 0 victoire trouvée mais l'espace n'est pas épuisé |
| 9. La clairière | forcé (0 sur 199 408) |

Le seul niveau de la forêt qui n'oblige pas à additionner est **celui qui enseigne
l'addition**.

---

## 2. « Recoller les morceaux » : pourquoi il faut redessiner le PLATEAU

Ton relevé en jouant est exact, et voici le détail mesuré.

- **La boîte** : un prisme ÷2, quatre miroirs (`N→E`, `E→S`, `S→E`, `E→N`), une
  lentille. Six pièces, `par` 6, zéro surplus.
- **La solution prévue** utilise les six : on coupe en deux, chaque moitié fait le
  tour du mur de roches, la lentille recolle. Elle ramasse les **2** fruits.
- **L'échappatoire** : trois miroirs suffisent (`E→N` en (3,3), `N→E` en (3,1),
  `E→S` en (8,1)). Le rayon entier contourne le mur par le haut et sert la maison,
  qui demande justement 1/1. Elle ramasse **1** fruit sur 2 — c'est exactement le
  « 1/2 » de ta capture.

**Conséquence importante : rogner la boîte ne peut pas marcher.** Les trois miroirs
de l'échappatoire sont **inclus** dans les six pièces de la solution (vérifié) :
tout miroir qu'on retire pour tuer le contournement tue aussi la solution prévue.

**Et redessiner le plateau ne suffira pas non plus.** En cherchant la bonne forme,
j'ai trouvé la règle qui décide, et je l'ai vérifiée contre la mesure :

> **Un niveau force l'addition si et seulement si au moins une de ses cibles ne
> peut PAS être obtenue par un seul rayon** (c'est-à-dire par le soleil suivi
> d'une suite de coupes et d'agrandissements).

Vérification sur les neuf niveaux de la forêt — la règle tombe juste partout :

| niveau | cible | obtenable d'un seul rayon ? | verdict du solveur |
|---|---|---|---|
| 1. Recoller les morceaux | 1/1 | **oui** | **non forcé** |
| 2. Trois quarts | 3/4 | non | forcé |
| 3. Deux tiers | 2/3 | non | forcé |
| 6. Cinq sixièmes | 5/6 | non | forcé |
| 9. La clairière | 2/3 · 1/3 | non | forcé |
| 7. Les douzièmes | 1/4 · 1/12 · 1/2 | **oui** | *non conclu — probablement non forcé aussi* |

**Conséquence pour « Recoller les morceaux » : sa maison demande 1/1, et le soleil
donne 1/1. Aucun plateau au monde ne pourra forcer la lentille tant que la cible
vaut ce que le rayon vaut déjà.** Les seules mécaniques qui y arriveraient — une
passe trop étroite, une pièce scellée, un soleil qui ne vaut pas 1 — appartiennent
toutes à des mondes plus loin. Ta règle « on n'apprend pas deux choses au même
endroit » les interdit ici.

**Ce que je propose à la place, et c'est plus simple que tout ce qu'on envisageait :
remettre les deux additions dans le bon ordre.**

Aujourd'hui la forêt donne le cas DIFFICILE avant le cas FACILE : « Trois quarts »
(dénominateurs différents, il faut réécrire 1/2 en 2/4) est au niveau 2, et
« Deux tiers » (même dénominateur, on compte simplement) au niveau 3. C'est à
l'envers — et c'est pour ça que la mise au même dénominateur tombe si tôt.

- **« Deux tiers » devient la 1ʳᵉ découverte** (cours `somme`) : 1/3 + 1/3 = 2/3,
  même dénominateur, **forcé** (0 victoire sans lentille sur 816), R = 233 — un
  vrai niveau d'école.
- **« Trois quarts » devient la 2ᵈᵉ découverte** (cours `denominateur`) : 1/2 + 1/4,
  **forcé** (0 sur 12 778).
- **« Recoller les morceaux » reste le niveau d'accueil du monde** — il montre la
  lentille, sa ligne `CALC` reste juste, mais **il cesse d'être un niveau-découverte**
  puisqu'il ne peut pas forcer sa notion. Rien d'autre n'y change ; sa clé de
  sauvegarde est conservée.

Les deux découvertes se suivent alors dans l'ordre naturel : on apprend à recoller
deux parts **de même taille**, puis on découvre qu'il faut d'abord les mettre à la
même taille.

---

## 3. Deux points de cours, pas un

Deux notions, donc **deux découvertes**, comme les quatre du lagon, et chacune reste
**pure** : une notion, un cours.

### 3.1 — `somme` : « Recoller deux parts » (porté par « Deux tiers »)

**Ce qu'on enseigne :** la lentille additionne deux rayons.

**Ce n'est PAS une répétition du cours du demi — c'est son INVERSE**, et tu as eu
raison de me reprendre. Au lagon, un rayon entier entre dans un prisme et deux
moitiés en sortent ; ici, deux moitiés entrent dans une lentille et un rayon entier
en sort. Mêmes nombres, sens contraire. **Le schéma doit donc se lire dans l'autre
sens**, sinon l'élève voit deux fois la même image et n'apprend rien.

**Scène** — deux registres, comme les quatre cours existants, mais montés à
l'envers du cours du tiers :
- en haut, les rayons du JEU : deux rayons `1/3` arrivent **de deux côtés
  différents** dans la lentille, et il en sort un rayon `2/3` ;
- en bas, les bandes : les deux `[1/3]` sont d'abord **écartées**, chacune de son
  côté ; on les rapproche **bout à bout** ; la bande `[2/3]` apparaît dessous, de
  même longueur. La lecture **monte** des morceaux vers leur somme, quand le mur du
  lagon **descendait** de l'entier vers les morceaux.

**Étapes :**
1. « Tu as deux tiers, chacun de son côté. »
2. « La lentille les recolle : on les met **bout à bout**. » — `1/3 + 1/3 = 2/3`
3. « Deux tiers, ce sont deux parts sur les trois de la bande. »

**Carte de savoir :** « Le prisme coupe, la lentille recolle. »
— `1/3 + 1/3 = 2/3`

**Pas de prédire.** (Règle du 14/08 : un prédire révèle un NOM, jamais une
stratégie que le jeu demande de chercher.)

### 3.2 — `denominateur` : « Le même dénominateur » (porté par « Trois quarts »)

**Ce qu'on enseigne :** pour additionner, il faut des parts de la même taille — et
c'est **le même cours que l'équivalence**, qui ne s'enseignait nulle part.

**Scène** — c'est **ton premier dessin**, exactement :
- ligne du haut : `[1/2][1/4]`, bout à bout ;
- ligne du bas : `[1/4][1/4][1/4]` ;
- **même longueur totale** — c'est l'alignement qui démontre.

En haut, le registre des rayons : `1/2` et `1/4` entrent dans la lentille, `3/4`
en sort.

**Étapes :**
1. « Ces deux parts n'ont pas la même taille : on ne peut pas les compter
   ensemble. »
2. « Mais le demi, c'est **deux quarts** : la même part, écrite autrement. » —
   `1/2 = 2/4`
3. « Maintenant toutes les parts sont des quarts, on peut les compter. » —
   `2/4 + 1/4 = 3/4`

**Carte de savoir :** « Pour additionner, on écrit les deux parts avec le même
dénominateur. » — `1/2 + 1/4 = 2/4 + 1/4 = 3/4`

**Ton objection, et pourquoi elle ne gêne pas.** Tu as raison : dans le jeu,
`1/4 + 1/4` donne `1/2` d'un coup, le moteur réduit tout seul. Ce n'est pas un
obstacle, **c'est le sujet** : le cours explique justement pourquoi `2/4` et `1/2`
sont la même part. Et ce n'est pas un décrochage par rapport aux rayons : on a déjà
décidé (session du 14/08) que **le support d'un point de cours est la bande, et que
le rayon reste le support du jeu**. Les quatre cours du lagon sont déjà ainsi.

**Ta deuxième disposition (en L) est écartée** : les mêmes morceaux, mais l'œil y
lit une aire et non une longueur — on perd la comparaison des deux lignes, qui est
tout l'argument.

### 3.3 — Ce qu'il faut construire dans le code

`sceneCours` ne sait aujourd'hui dessiner **que des partages** : elle prend
`scene:{divs:[…]}` (un ou deux diviseurs) et empile 1, puis 1/d₁, puis 1/(d₁×d₂).
Il n'existe **aucune scène d'addition**. Il faut donc un second constructeur —
`sceneSomme` — qui prend `scene:{somme:[[1,2],[1,4]]}` et dessine les deux lignes
alignées, et un aiguillage dans `construireCours`. Le reste (étapes, carte de
savoir, écriture étagée, ouverture après victoire) est déjà en place et ne bouge
pas.

---

## 4. Les deux consignes fausses

Depuis la refonte du 15/08, les champs de canne servent déjà 1/8 (niveau 6), 1/9
(7), 1/6 et 1/12 (8). Les consignes de la forêt qui s'en étonnent sont donc fausses
**depuis ce jour-là, pas depuis ce lot** :

| niveau | aujourd'hui | proposé |
|---|---|---|
| 4. Les sixièmes | « Des cases à 1/6 ?! Aucun outil ne coupe en six d'un coup… » | *voir §5 — ce niveau disparaît* |
| 5. Les huitièmes | « Un huitième ?! Personne ne sait couper en huit d'un coup… » | « Un huitième par case, et seulement des ÷2 dans la boîte. Combien de coupes faut-il ? » |

---

## 5. « Les sixièmes » (niveau 4) : le jumeau de « Quarts en croix »

- **14 essais** avant de tomber sur la victoire — le 11ᵉ niveau le plus facile du
  jeu sur les 67 mesurés, placé au 22ᵉ rang.
- **Une seule** configuration gagnante, en 2 pièces, sur 28 explorées.
- Sa notion est `1/3 ÷ 2 = 1/6`. Le sixième est découvert au lagon (cours du
  sixième, qui enseigne l'autre route, `1/2 ÷ 3`), et **cette route-ci est
  exactement ce que « Les deux chemins du sixième » demande de trouver aux champs
  de canne**, au 18ᵉ niveau du jeu. Quand l'élève arrive ici, au 22ᵉ, il l'a donc
  déjà cherchée et trouvée — et on la lui « découvre » une troisième fois.

Même profil que « Quarts en croix », donc même traitement : **retiré**, et remplacé
par un entraînement taillé au solveur sur la notion du monde — l'addition. La clé
`foret:Les sixièmes` devient inerte, comme `lagon:Quarts en croix` avant elle.

---

## 6. Les deux niveaux immesurables

« Cinq sixièmes » et « Les douzièmes » : le solveur n'y trouve **aucune** victoire
en 3 millions de configurations, même sans son filtre du coup mort. Leur `sol` est
pourtant valide. Ils sont donc soit énormes, soit très étroits — on ne sait pas
encore, et je ne conclurai pas sans avoir mesuré.

**Tu m'as laissé décider : on les laisse tels quels dans ce lot.** Trois raisons.
(1) Ils ne sont pas cassés — ils sont durs et non mesurés, ce qui n'est pas la même
chose ; on ne retouche pas ce qu'on n'a pas compris. (2) Un monde-école a le droit
d'avoir des niveaux durs, et depuis le double déblocage du §7 personne n'est obligé
de les battre pour avancer. (3) Le lot porte déjà une scène de cours entièrement
neuve et un plateau redessiné : ajouter deux refontes à l'aveugle, c'est le
transformer en chantier qu'on ne saura plus prouver.

Ils passeront dans leur propre passe, avec le solveur poussé jusqu'à conclure.

---

## 7. Le double déblocage : le chemin de l'école

**Ta règle :** réussir un monde-école ouvre **le champ difficile suivant ET l'école
suivante** — pour qu'un élève puisse suivre le fil de l'apprentissage sans jamais
être forcé de se battre.

**Ce que ça change dans le code :** une seule fonction, `mondeDeverrouille`. Un
monde s'ouvre si le monde qui le précède est réussi au seuil, **ou** si le dernier
monde-ÉCOLE avant lui l'est. Aucune donnée de niveau, aucune sauvegarde touchée.

**Ce qu'il faut trancher, et c'est toi :** quels mondes sont des écoles. Ma lecture
des mesures, à confirmer ou corriger :

| monde | leçons / défis | proposé |
|---|---|---|
| Le lagon | 6 / 1 | **école** |
| Les champs de canne | 1 / 3 · zéro ligne `CALC` · « rien de neuf à apprendre » | **champ** |
| La forêt | 4 / 4 · 8 lignes `CALC` | **école** |
| Le volcan | 3 / 2 · introduit les loupes | **école** |
| Les pitons | 5 / 1 · introduit passes et équivalences | **école** |
| Les soleils | 4 / 2 · introduit les soleils à valeur | **école** |
| Le marché | 4 / 2 · introduit les écritures | **école** |
| Les tunnels | 5 / 2 · « esprit de l'original » | **champ** |
| Mafate | 1 / 6 | **champ** |

**À savoir avant de décider :** l'alternance école/champ que tu décris n'existe pas
encore dans le jeu. Aujourd'hui c'est école, champ, puis **cinq écoles de suite**,
puis deux champs. La règle marchera dès maintenant (elle ouvrira la forêt en même
temps que la canne), mais elle ne prendra tout son sens que si d'autres champs
apparaissent plus loin.

**Et une chose que la mesure a déjà tranchée :** aucun verrou du jeu n'oblige
aujourd'hui à battre un niveau au-delà de 2 383 essais — la règle des ⌈5/8⌉ laisse
toujours contourner les monstres. Ton double déblocage n'est donc pas un
déblocage de secours : c'est un **confort de parcours**, et c'est très bien ainsi.
Autant le dire dans le cahier pour ne pas le re-débattre.

---

## 8. Ce que le lot NE fait PAS

- Il ne déplace **aucun monde** (décision prise : la canne reste en 2, la forêt en
  3 — la forêt introduit trop de neuf pour passer devant).
- Il ne crée **pas** les mondes-école séparés (la mesure a montré qu'aucun élève
  n'est bloqué ; on s'épargne le remaniement).
- Il ne touche **pas** aux cours de 1/8, 1/9, 1/12 : ces trois-là n'ont toujours
  aucun point de cours, et c'est un chantier à part.
- Il ne touche **pas** au niveau formateur des portes (première maison clôturée =
  « La croisée des rayons », canne n°4, un défi à 6 841 essais) : c'est la canne,
  pas la forêt. Il se fera à côté, dès que tu le voudras.
- Aucun renommage, aucun changement de clé de sauvegarde.

---

## 9. Les preuves qui accompagneront le lot

- `node tests/soley/notion-forcee.mjs foret m` : **zéro victoire sans lentille** sur
  les niveaux-découverte de la forêt.
- Un vérificateur daté du lot (`verifier-lot-foret.mjs`), appariant les niveaux par
  clé `monde:nom` et jamais par index.
- Un contrôle de batterie sur chacun des deux nouveaux cours.
- Contrôle du double déblocage : un élève qui n'a fait que les écoles atteint bien
  l'école suivante, et un élève qui n'a rien fait ne passe rien.
- `node --test`, les cinq validateurs, batterie Playwright complète.
- Captures avant/après de chaque écran touché.

---

## 9 bis. Les pistes que tu as ouvertes, et qui attendent leur tour

Notées ici pour ne pas les perdre, et **volontairement hors de ce lot** :

1. **Les fruits sont tous faciles.** Aucun niveau de la forêt n'a de `solMin` : on
   n'a jamais prouvé qu'un seul de ses fruits « se mérite ». C'est la couche ☀☀,
   et c'est sans doute le meilleur levier de difficulté du monde — plus sûr que de
   durcir les victoires.
2. **Un cours par notion neuve.** 1/8, 1/9 et 1/12 n'ont toujours aucun point de
   cours nulle part dans le jeu.
3. **Appliquer un cours, puis le rejouer plus dur.** Ton idée d'un monde
   d'application après chaque école — c'est exactement ce que la canne est pour le
   lagon. Tu penses en intercaler d'autres après la forêt et après le volcan : la
   règle du §7 est écrite pour que ça marche le jour où tu les créeras, sans
   retoucher le code.
4. **Les idées du jeu d'origine pas encore utilisées** (tes photos) : à reprendre
   quand tu voudras.
5. **La peau de la forêt.** Voir §9 ter.

## 9 ter. La peau de la forêt : kiosques et fougères — mon avis

Oui, et c'est même le geste le moins cher du lot suivant. Le lagon a eu ses patates
de corail : `corailSVG` reprend **les trois silhouettes exactes** de `rockSVG`, seule
la peau change, et la lecture du plateau ne bouge pas d'un pixel. Deux re-peaux ici,
sur le même principe :

- **les obstacles deviennent des fougères arborescentes** (le fanjan des Hauts) —
  même silhouette de galet que la roche pour l'encombrement, mais habillée d'une
  couronne de frondes qui retombent : c'est ce qui cache le soleil dans une forêt,
  et ça se dessine bien à 100 px de côté ;
- **les cases deviennent des kiosques** — silhouette de la maison conservée (mêmes
  proportions, même emplacement de la fraction, même clôture pour les portes), mais
  toit à quatre pentes en bardeaux, poteaux de bois apparents et pas de murs. Pas
  de lambrequins créoles au fond des bois.

**La règle à ne pas franchir** : la peau ne doit jamais changer ce qui se LIT. La
fraction, la couleur du dénominateur, l'anneau vert de la case servie et la clôture
des portes sont du langage, pas de la décoration.

Je le mets **hors de ce lot** : mélanger une refonte pédagogique et un changement de
peau, c'est se priver de savoir lequel des deux a cassé quelque chose. Mais c'est un
petit lot à part, rapide, et je peux te le faire juste après.

## 10. Ce que j'attends de toi

**Validé par toi le 15/08 :** la règle du §1 · le classement école/champ du §7 (avec
la remarque que d'autres champs viendront après la forêt et après le volcan) · les
deux monstres laissés pour plus tard (§6, décision rendue par moi à ta demande).

**Corrigé par toi le 15/08 :** le cours du §3.1 n'est pas une répétition du cours du
demi, c'est son inverse — le schéma se lit dans l'autre sens (§3.1 réécrit).

**Validé aussi :** les textes des étapes (§3.2 mot pour mot ; §3.1 réécrit sur
« Deux tiers » depuis, mêmes phrases transposées de 1/2 à 1/3).

**Décisions que tu m'as laissées et que je prends :**
- le registre des rayons du cours §3.2 montre **ce que le niveau fait**
  (`1/2` et `1/4` entrent, `3/4` sort) et rien d'autre ; l'équivalence `1/2 = 2/4`
  vit **uniquement sur les bandes**. Raison : les rayons ne peuvent PAS montrer
  `2/4` — le moteur réduit tout seul, un rayon « 2/4 » n'existe pas dans le jeu.
  La bande est le seul endroit où cette écriture peut se voir ;
- l'ordre des deux additions est corrigé (§2), et « Recoller les morceaux » cesse
  d'être une découverte faute de pouvoir forcer sa notion.

**La peau de la forêt** (§9 ter) : **kiosques** pour les cases et **fougères
arborescentes** pour les obstacles, tes deux idées. Lot séparé, juste après.
