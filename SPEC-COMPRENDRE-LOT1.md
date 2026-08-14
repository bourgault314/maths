# SPEC-COMPRENDRE-LOT1.md — Chantier 2 « Comprendre », premier lot

> Spécification à faire valider par Gwenael LIGNE PAR LIGNE avant tout codage.
> Rédigée le 14/08/2026 (session Cowork), à partir de DESIGN-SOLEY.md (pilier 1),
> SOLEY.md, BIBLIOTHEQUE-IDEES.md et du code réellement déployé (levels/engine/render/ui).
> **v2 du 14/08** : textes des cours retravaillés (retour de Gwenael : ne pas reprendre
> l'aide existante telle quelle), décision « guidage dégressif » actée, question de
> l'aide sur les défis ré-ouverte. Arbitrages A1-A3 et A5-A8 validés par Gwenael.
> **v3 du 14/08** : exigences de Gwenael intégrées — rigueur des écritures (toutes les
> étapes, mise au même dénominateur explicite, règle R1) et scènes vraiment visuelles
> (les quatre rayons 1/4 VISIBLES en C3, règle R2) ; balayage du Coup de pouce ajouté.
> **v4 du 14/08** : sur mandat de Gwenael (« tu es aussi l'aide didactique »), ajouts
> de Claude — cascade ANIMÉE au rythme du texte, prédire à révélation (R3), phrase-carte
> habillée en carte de savoir (R4), bouton « Revoir ».
> **v5 du 14/08 — FINALE, feu vert donné** : « règle du gâteau » ajoutée à R1 sur
> objection de Gwenael — un demi plus un demi ne passe PAS par 2/2 : la réunion de
> toutes les parts d'un même entier s'écrit en direct (l'intuition et le rayon la
> portent) ; les étapes ne sont exigées que là où elles ne sont pas évidentes.
> Textes C1-C2-C3 ajustés en conséquence. Bonne pour session Code.
> **v5.1 du 14/08** : réponse à la question « 2/2 » consignée au §10 (progression du
> cours de la lentille en trois temps).
> **v6 du 14/08 — DÉFINITIVE** : Gwenael tranche en dernier ressort — le total n/n
> s'écrit PARTOUT (1/2 + 1/2 = 2/2 = 1 ; 1/3 + 1/3 + 1/3 = 3/3 = 1) : « au pire,
> c'est un truc en plus pour l'élève », et une seule forme d'écriture pour tous.
> Règle du gâteau retirée ; textes C1-C2-C3 et balayage CALC ajustés.
> Une fois les textes du §5 validés, ce document entre au dépôt et sert de cahier
> des charges à la session Code correspondante.

Devise du projet : **« On ne joue pas pour jouer : on comprend en jouant. »**

---

## 1. Rappel de la mécanique actée (rien de nouveau ici)

Décision de Gwenael du 13/08, consignée dans DESIGN-SOLEY.md :

1. **Niveau-découverte** : un défi tout simple, sans labyrinthe ni piège, construit pour
   que la seule issue soit la notion elle-même.
2. **Point de cours** : juste après la victoire, quand l'élève vient de le VIVRE, un
   panneau met des mots et l'écriture propre sur ce qu'il a fait. Le « prédire avant de
   voir » est un ingrédient du point de cours, pas un écran à part.
3. **Niveaux d'entraînement** : ensuite seulement, la notion dans des niveaux plus riches.

Aide graduée : découverte **aidée** / entraînement **par paliers** (carte de savoir
→ question → calcul en dernier recours) ; pour les défis, la question « avec ou sans
aide ? » est RÉ-OUVERTE (14/08) — à trancher au chantier 4, rien à coder dans ce lot.
Les « cours déjà écrits » = le Coup de pouce actuel (moteur sSun/sBeam/sceneFor/
calcLineHTML + table CALC) : c'est LA base technique, on la réutilise.

## 2. Périmètre du lot 1 — et ce qui n'y est PAS

**Dans ce lot** : le moteur générique des niveaux-découverte + points de cours, appliqué
au monde « Le lagon » uniquement : 2 niveaux existants promus découvertes, 1 niveau
fondateur NOUVEAU (les quatre quarts), 3 points de cours rédigés mot pour mot (§5),
relecture des cours, condition de déblocage enrichie, tests.

**Pas dans ce lot** (viendra après, dans cet ordre proposé) :
- lot 2 : l'aide graduée par paliers dans les niveaux d'entraînement + enrichissement
  du Coup de pouce (étapes, mise au même dénominateur détaillée, erreurs typiques) ;
- lots suivants : les niveaux-découverte des autres mondes (table des notions au §10) ;
- chantier 3 : le carnet péi — mais le lot 1 enregistre déjà les cartes de savoir
  gagnées (§8), pour que le carnet les retrouve plus tard sans migration.
- le tutoriel « flèche qui pointe le geste » (idée 2 de la bibliothèque) : DÉCISION du
  14/08 — pas de système de flèches au lot 1. Principe retenu : **guidage dégressif**.
  Les toutes premières découvertes s'appuient sur la consigne-question, un plateau sans
  piège et le Coup de pouce ; les découvertes des mondes suivants (sixièmes, loupes…)
  laisseront l'élève se débrouiller davantage — on a expliqué le quart, on n'explique
  pas le sixième pareil. À réévaluer après les tests en classe.

## 3. Le parcours joueur

Rien ne change pour les niveaux ordinaires. Pour un niveau-découverte :

1. L'élève ouvre le niveau (badge « découverte » visible sur sa carte, §6).
2. Il joue ; le Coup de pouce reste disponible (découverte = aidée).
3. Victoire : cinématique habituelle → « Lévé ! » → **le point de cours s'affiche**
   (panneau plein écran). La scène s'ANIME : la cascade se dessine au ralenti (le
   moteur de victoire sait déjà dessiner segment par segment) et les lignes de texte
   apparaissent au rythme du dessin — l'élève REVIT ce qu'il vient de faire,
   lentement, avec les écritures qui se posent dessus.
4. La question « Et si… ? » (le prédire) s'affiche SANS sa réponse, avec un bouton
   « À ton avis… » : l'élève se prononce dans sa tête, touche, la réponse se révèle.
   C'est le « prédire avant de voir » voulu dès l'origine — une ligne qui donne la
   réponse immédiatement n'est pas une prédiction.
5. La phrase-carte apparaît en dernier, habillée en VRAIE petite carte (cadre,
   titre « Carte de savoir ») : elle prépare le carnet du chantier 3 sans le construire.
6. Boutons : « J'ai compris ! » (→ fenêtre des petits soleils) et « Revoir »
   (rejoue l'animation). L'ordre victoire-puis-cours reste celui voulu : on nomme
   ce qu'on vient de réussir (l'action d'abord, l'institutionnalisation ensuite).
7. Le point de cours est **relisible à tout moment** depuis l'écran des niveaux (§6).
8. En rejouant un niveau-découverte déjà réussi, le cours ne se réaffiche PAS tout
   seul (on ne fait pas la leçon deux fois) — il reste accessible par le bouton.

## 4. Les trois niveaux-découverte du lagon

Le lagon passe de 8 à 9 niveaux. Ordre final :
1. Premier rayon · 2. Zigzag dans les roches · **3. Moitié-moitié (découverte)** ·
4. La part perdue · **5. Partage en tiers (découverte)** · **6. Les quatre quarts
(découverte, NOUVEAU)** · 7. La moitié de la moitié · 8. Quarts en croix ·
9. Le tour du lagon.

Aucun niveau existant n'est déplacé, renommé ni modifié dans ses données de jeu ;
les clés de sauvegarde sont intactes. Seules les CONSIGNES (sub) des deux niveaux
promus changent (voir 4.1, 4.2) — car une découverte pose une question, elle ne
donne pas la notion.

### 4.1 « Moitié-moitié » — découverte du demi (existant, promu)

Plateau, pièces, solution : INCHANGÉS (un soleil, deux maisons 1/2, un prisme ÷2).
C'est déjà un niveau-découverte parfait : la seule issue est le partage en deux.

- Consigne actuelle (donne la notion) : « Le prisme ÷2 coupe le rayon en deux parts
  égales : chaque part vaut 1/2. Regarde l'épaisseur des rayons ! »
- **Consigne validée** : « Deux maisons attendent chacune la même part… et la boîte
  ne contient qu'un prisme ÷2. Que va-t-il faire du rayon ? Observe l'épaisseur ! »
- Point de cours associé : C1 « Le demi » (§5.1).

### 4.2 « Partage en tiers » — découverte du tiers (existant, promu)

Plateau, pièces, solution : INCHANGÉS (un soleil, trois maisons 1/3, un prisme ÷3).

- Consigne actuelle : « Le prisme ÷3 partage le rayon en trois parts égales : des
  tiers. Nouvelle couleur : les tiers sont bleus ! »
- **Consigne validée** : « Trois maisons, un seul prisme ÷3. En combien de parts
  va-t-il couper le rayon ? Regarde la nouvelle couleur ! »
- Point de cours associé : C2 « Le tiers » (§5.2).

### 4.3 « Les quatre quarts » — le niveau fondateur (NOUVEAU, nom validé)

L'exemple fondateur de Gwenael, tel quel : un soleil qui vaut 1, quatre maisons à 1/4,
des prismes ÷2 dans la boîte — l'élève découvre seul qu'en coupant, puis en recoupant,
il fabrique des quarts.

- Position : 6e niveau du lagon, juste avant « La moitié de la moitié » (qui devient
  son entraînement naturel : mêmes prismes, mais cibles mélangées 1/2 + 1/4 et roches).
- **Consigne validée** : « Quatre maisons veulent chacune 1/4… mais la boîte n'a que
  des prismes ÷2 ! Comment fabriquer des quarts avec des moitiés ? »
- Plateau 9×7 (comme « La moitié de la moitié »), sans roche, sans fruit, sans surplus
  d'outils : une découverte est pure, les pièges sont pour l'entraînement (pilier 1).

```
   0   1   2   3   4   5   6   7   8
0  ·   ·   ·   ·   ·   ·   ·   ·   ·
1  ·  [¼]  ·   ·  (B)  ·   ·  [¼]  ·
2  ·   ·   ·   ·   |   ·   ·   ·   ·
3 ☀→  —   —   —  (A)  ·   ·   ·   ·
4  ·   ·   ·   ·   |   ·   ·   ·   ·
5  ·  [¼]  ·   ·  (C)  ·   ·  [¼]  ·
6  ·   ·   ·   ·   ·   ·   ·   ·   ·
```

- Données : soleil `{x:0,y:3,dir:1}` (val 1) ; maisons `need:[1,4]` en (1,1), (7,1),
  (1,5), (7,5) ; `rocks:[]`, `fruits:[]`.
- Boîte : 3 prismes ÷2, orientations données — `s2(1,0,2)`, `s2(0,3,1)`, `s2(2,3,1)`.
- Solution de référence `sol` : A=(4,3) coupe le rayon entier en deux moitiés (haut/bas) ;
  B=(4,1) coupe la moitié montante en deux quarts (gauche/droite) ; C=(4,5) pareil pour
  la moitié descendante. **Vérifiée en exécutant la vraie fonction `simulate()` du
  moteur (14/08) : victoire, chaque maison reçoit exactement 1/4, une seule fois.**
- Coup de pouce (aide, disponible pendant le jeu) : hint « Coupe le rayon en deux…
  puis coupe encore chaque moitié. » + CALC `["1 ÷ 2 = 1/2","1/2 ÷ 2 = 1/4"]`.
- Point de cours associé : C3 « Le quart » (§5.3), affiché après la victoire.

## 5. Les points de cours — MOT POUR MOT (v2, en validation ligne par ligne)

Textes v2 du 14/08, retravaillés à la demande de Gwenael : ils ne reprennent plus
l'aide existante telle quelle. Fil conducteur : partir du geste que l'élève vient de
faire (« regarde ce que tu viens de faire »), donner l'écriture et sa lecture, traiter
une erreur typique quand c'est le bon moment (C2-2), installer le réflexe de
VÉRIFICATION (recomposer l'entier), finir par le « prédire ». Chaque ligne est
numérotée : réponds par exemple « C2-3 à revoir ».

**Deux règles de qualité, valables pour tous les cours (exigence de Gwenael, 14/08) :**

- **R1 — Rigueur des écritures : aucune étape sautée, TOUTES les étapes écrites**
  (décision finale de Gwenael, 14/08, après débat — « au pire, ça fait juste un
  truc en plus pour l'élève »). Toute addition de dénominateurs différents passe
  par la mise au même dénominateur ÉCRITE (1/2 + 1/4 = 2/4 + 1/4 = 3/4, jamais
  « 3/4 » direct) ; tout nombre mixte est décomposé (1 + 1/2 = 2/2 + 1/2 = 3/2) ;
  toute simplification est montrée (1/6 + 1/6 = 2/6 = 1/3) ; et les recompositions
  d'entier écrivent leur total : 1/2 + 1/2 = 2/2 = 1 ; 1/3 + 1/3 + 1/3 = 3/3 = 1.
  Une seule forme d'écriture, partout : l'élève voit toujours le même geste
  (compter les parts), et n/n = 1 — point faible classique en 6e — se rejoue à
  chaque occasion. L'intuition du gâteau n'est pas perdue : ce sont les MOTS qui
  la portent (« deux moitiés refont le rayon entier »), pendant que la ligne
  écrit le compte. Norme du projet (SOLEY.md §6), pour tous les contenus futurs.
- **R2 — Des scènes vraiment visuelles : on voit TOUTE l'histoire.** La scène d'un
  cours n'est pas une ligne de calcul illustrée : elle montre le partage en entier.
  En C3, on doit VOIR le rayon entier, puis les deux moitiés, puis LES QUATRE rayons
  d'un quart, avec leurs vraies épaisseurs et couleurs — l'actuel « un demi recoupé
  en deux » ne montrait pas les quatre rayons, c'est exactement ça qu'on corrige.
- **R3 — Le prédire est une vraie prédiction.** La question s'affiche sans sa
  réponse ; la révélation vient au toucher (bouton « À ton avis… »). Règle valable
  pour tous les cours futurs.
- **R4 — La carte de savoir se voit.** La phrase-carte est présentée comme une
  petite carte (cadre, titre), pas comme une ligne de texte parmi d'autres : c'est
  la trace écrite, et la future carte du carnet.

Chaque point de cours = un panneau avec : titre, scène en rayons (règle R2), les
lignes de texte, et la phrase de la carte de savoir (la trace écrite en une phrase,
future carte du carnet).

### 5.1 — C1 « Le demi » (après « Moitié-moitié »)

Scène (R2) : le rayon entier (épais, doré, étiqueté 1) entre dans le prisme ÷2 ;
les DEUX moitiés sortent, visibles ensemble, étiquetées 1/2 chacune.
Écriture : `1 ÷ 2 = 1/2`.

- **C1-1** : « Regarde ce que tu viens de faire : un rayon entier est entré dans le
  prisme, deux rayons plus fins en sont sortis. »
- **C1-2** : « Les deux parts sont exactement égales : chacune est une moitié.
  On écrit 1/2, on lit « un demi ». »
- **C1-3** : « Partager, c'est diviser : 1 ÷ 2 = 1/2. »
- **C1-4** : « Le nombre du bas — le dénominateur — raconte le partage :
  coupé en 2 parts égales. »
- **C1-5** (vérifier) : « La preuve que chaque part vaut un demi ? Remets les deux
  ensemble : 1/2 + 1/2 = 2/2 = 1. Rien ne s'est perdu. »
- **C1-carte** : « Partager 1 en 2 parts égales : chaque part vaut 1/2. »

### 5.2 — C2 « Le tiers » (après « Partage en tiers »)

Scène (R2) : le rayon entier entre dans le prisme ÷3 ; les TROIS tiers sortent,
visibles ensemble, étiquetés 1/3 — et à côté, pour l'œil, un demi plus épais qu'un
tiers (support de C2-2). Écriture : `1 ÷ 3 = 1/3`.

- **C2-1** : « Trois maisons, trois parts égales : le prisme a partagé le rayon en
  tiers. On écrit 1/3, on lit « un tiers ». 1 ÷ 3 = 1/3. »
- **C2-2** : « Compare les épaisseurs : 1/3 est PLUS FIN que 1/2. Surprenant ?
  3 est plus grand que 2… mais partager entre 3, c'est donner moins à chacun. »
- **C2-3** (vérifier) : « Vérifie : les trois tiers réunis refont le rayon entier.
  1/3 + 1/3 + 1/3 = 3/3 = 1. »
- **C2-4** (prédire, en deux temps — R3) — question : « Un prisme ÷4 fabriquerait
  des quarts, encore plus fins. Mais ce prisme n'existe pas dans le lagon… Comment
  faire des quarts sans lui ? » → bouton « À ton avis… » → révélation : « La
  réponse t'attend au prochain niveau. »
- **C2-carte** : « Partager 1 en 3 parts égales : chaque part vaut 1/3. Plus il y a
  de parts, plus chaque part est petite. »

### 5.3 — C3 « Le quart » (après « Les quatre quarts »)

Scène (R2) — la cascade complète : soleil → rayon entier → prisme ÷2 → deux moitiés
→ un prisme ÷2 sur CHAQUE moitié → LES QUATRE rayons 1/4 visibles côte à côte, avec
les épaisseurs et couleurs réelles du jeu (entier doré, demis orangés, quarts roses)
et les étiquettes 1, 1/2, 1/4. Écritures : `1 ÷ 2 = 1/2` puis `1/2 ÷ 2 = 1/4`.

- **C3-1** : « Quatre maisons à 1/4, et seulement des prismes ÷2 dans la boîte…
  et tu as trouvé : couper, puis couper encore. »
- **C3-2** : « Premier prisme : le rayon entier devient deux moitiés. 1 ÷ 2 = 1/2. »
- **C3-3** : « Deuxième coupe : chaque moitié, partagée en 2, donne deux quarts.
  1/2 ÷ 2 = 1/4. »
- **C3-4** : « La moitié de la moitié, c'est le quart. »
- **C3-5** (vérifier) : « Compte tes rayons : quatre quarts, et
  1/4 + 1/4 + 1/4 + 1/4 = 4/4 = 1. Le rayon entier est bien là, partagé en quatre. »
- **C3-6** (prédire, en deux temps — R3) — question : « Et si tu recoupais un quart
  en 2 ? » → bouton « À ton avis… » → révélation : « 1/8 : la moitié du quart.
  Ce petit rayon-là t'attend dans la forêt… »
- **C3-carte** : « La moitié de la moitié, c'est le quart : 1/2 ÷ 2 = 1/4. »

### 5.4 — Balayage du Coup de pouce existant (application de R1, données seulement)

La table CALC actuelle saute parfois des étapes — exactement ce que Gwenael pointe
(« un demi plus un quart, on écrivait directement trois quarts sans explication »).
Corrections identifiées, à faire dans ce lot (aucune autre donnée de ces niveaux
ne change) :

- « Défi du volcan », « Deux soleils sur les îlets », « Remise de 25 % » :
  `1/2 + 1/4 = 3/4` → `1/2 + 1/4 = 2/4 + 1/4 = 3/4`.
- « Un et demi », « Les soleils jumeaux » : `1 + 1/2 = 3/2` → `1 + 1/2 = 2/2 + 1/2 = 3/2`.
- « La passe de la Rivière » et « Cinq sixièmes » (1re ligne) :
  `1/6 + 1/6 = 1/3` → `1/6 + 1/6 = 2/6 = 1/3`.
- Recompositions d'entier, désormais complètes aussi (décision finale) :
  `1/2 + 1/2 = 1` → `1/2 + 1/2 = 2/2 = 1` (« Recoller les morceaux », « La passe
  étroite », « Deux soleils », « Les demi-tunnels », « Les verrous du cirque »,
  « Trois petits soleils » 2e ligne…) ; `2/3 + 1/3 = 1` → `2/3 + 1/3 = 3/3 = 1`
  (« L'addition du marché ») ; `1/3 × 3 = 1` → `1/3 × 3 = 3/3 = 1`
  (« Deux neuvièmes ») ; `1/4 × 2 = 1/2` et autres produits : total écrit si un
  passage intermédiaire existe (`1/4 × 2 = 2/4 = 1/2`).
  Les partages du type `2 ÷ 2 = 1` restent tels quels (pas d'étape cachée).
- La session Code balaie ensuite TOUTE la table avec la règle R1 et liste chaque
  ligne corrigée dans son compte rendu.

Le rendu en chaîne (`a + b = c = d`) est déjà géré par calcLineHTML — des lignes de
ce type existent (« Trois quarts », « Cinq sixièmes » 2e ligne) ; vérifier seulement
que les chaînes allongées tiennent sur téléphone (320 px).

## 6. L'écran des niveaux d'un monde

- La carte d'un niveau-découverte porte un petit badge « découverte » (picto sobre,
  cohérent avec l'univers — PAS une étoile ; dessin exact à juger par Gwenael sur
  capture, comme d'habitude).
- Sur la carte d'une découverte déjà réussie : un petit bouton « Revoir le cours »
  qui rouvre le panneau du point de cours. C'est la relecture « à tout moment »
  du pilier 1, version lot 1 ; le menu/carnet complet viendra au chantier 3.
- La mini-légende des trois petits soleils existante ne bouge pas.

## 7. Déblocage des mondes

Conforme au pilier 2 : pour ouvrir un monde, il faut ses niveaux-découverte + le seuil.

- Le seuil reste calculé automatiquement : ⌈5/8 des niveaux du monde précédent⌉.
  Le lagon passant à 9 niveaux, le seuil d'ouverture de la forêt passe de 5 à 6
  (vérifié dans le code : la formule est dynamique, aucun réglage à faire).
- S'ajoute : les niveaux-découverte du monde précédent doivent être réussis (ils
  comptent aussi dans le seuil, bien sûr). Ils sont conçus triviaux : personne ne
  reste bloqué, l'esprit « jamais 100 % » est respecté.
- Affichage sur la carte du monde fermé (formulation validée) : « Réussis 6 niveaux
  de « Le lagon » (0/6), dont ses 3 découvertes (0/3) ».
- Le mode classe `?classe` continue de tout déverrouiller, cours compris.

## 8. Données et technique (pour la session Code)

- **levels.js sera modifié pour la première fois depuis le découpage.** Changements
  STRICTEMENT additifs + 2 consignes réécrites : ajout du niveau « Les quatre
  quarts », champ `dec:'<id-du-cours>'` sur les 3 découvertes, nouvelle table
  `COURS` (à côté de CALC), 1 entrée CALC pour le nouveau niveau. Les 60 `sol`
  existants restent intacts À L'OCTET ; un test le garantit (diff structurel :
  seuls les champs listés ci-dessus peuvent différer).
- `COURS = { demi:{titre, calc:[…], lignes:[…], carte}, tiers:{…}, quart:{…} }`
  — les textes du §5, rien en dur dans le moteur.
- Scènes des cours (R2) : petit constructeur dédié « cascade de partage » bâti sur
  les primitives existantes (sSun/sBeam/sLbl, épaisseurs fwidth, couleurs fcol) —
  il montre l'arbre COMPLET du partage, tous les rayons terminaux visibles. Les
  scènes du Coup de pouce actuel ne bougent pas dans ce lot (leur refonte visuelle
  viendra au lot 2 ; seules leurs ÉCRITURES sont corrigées, §5.4).
- Animation de la cascade : réutiliser le patron de la cinématique de victoire
  (dessin segment par segment, minuteries nettoyables) ; les lignes de texte
  apparaissent au rythme du dessin ; bouton « Revoir » = rejouer l'animation ;
  bouton « À ton avis… » = révélation du prédire (masqué avant le toucher).
  Si l'animation menace la stabilité sur téléphone, repli statique assumé +
  note au compte rendu — le contenu prime sur l'effet.
- Panneau du point de cours : nouvel overlay (même patron que `#hintov`), construit
  avec le moteur existant (`sceneFor`/`calcLineHTML`) ; bouton « J'ai compris ! » ;
  s'insère entre le splash « Lévé ! » et `#winov` dans la séquence de victoire.
- Sauvegarde : nouveau champ additif `save.cours` (ids des points de cours vus),
  même patron que l'ajout de `pieces` — aucune migration, anciennes sauvegardes OK.
  C'est aussi la matière première des futures cartes de savoir du carnet.
- Compteurs : 61 niveaux, 183 petits soleils (61×3), fruits inchangés (135).
- API SOLEY étendue de ce qu'il faut pour tester (ex. `SOLEY.cours(id)`).
- render.js : badge découverte + picto ; ui.js : bouton « Revoir le cours » ;
  engine.js : séquence de victoire + save.cours + condition de déblocage.

## 9. Tests (batterie obligatoire avant tout push)

- Tout l'existant (T1→T8 + node 13/13) reste vert, avec compteurs mis à jour.
- Nouveau T9 : (1) « Les quatre quarts » gagne par sa `sol` et chaque maison reçoit
  exactement 1/4 ; (2) le point de cours s'affiche après victoire d'une découverte,
  pas après un niveau ordinaire ; (3) « J'ai compris ! » mène à la fenêtre de
  victoire normale ; (4) pas de réaffichage automatique au rejeu, bouton « Revoir
  le cours » fonctionnel ; (5) seuil forêt = 6 et découvertes exigées, condition
  lisible sur la carte fermée ; (6) `?classe` ignore tout ; (7) sauvegarde ancienne
  (sans `cours`) chargée sans erreur ; (8) les 60 niveaux historiques inchangés
  (hors champs autorisés) ; (9) zéro caractère ★, zéro erreur console, 320/402 px ;
  (10) les scènes des trois cours se construisent sans erreur et la scène C3 contient
  bien QUATRE rayons terminaux (comptage des éléments SVG) ; (11) chaque ligne CALC
  corrigée (§5.4) rend correctement, y compris à 320 px ; (12) la réponse du prédire
  est absente du panneau avant le toucher de « À ton avis… » et présente après ;
  « Revoir » rejoue sans erreur ni fuite de minuteries ; aucun total non écrit
  dans les textes COURS (R1 : les 2/2, 3/3, 4/4 sont présents).

## 10. Ce que ce lot prépare (pour mémoire, pas dans ce lot)

| Notion (niveau-découverte futur) | Monde | Cours |
|---|---|---|
| L'addition à la lentille (1/2 + 1/2 = 1) | La forêt | à écrire |
| Les huitièmes (recouper encore) | La forêt | à écrire |
| Les équivalences (2/4 = 1/2, couleur commune) | Les pitons | à écrire |
| La comparaison aux passes (1/3 < 1/2) | Les pitons | à écrire |
| La multiplication à la loupe | Le volcan | à écrire |
| Le soleil qui vaut 2 | Les soleils | à écrire |
| Les écritures (0,5 ; 25 % ; 3/4) | Le marché | à écrire |

Chaque futur lot suivra le même patron : spec Cowork validée ligne par ligne → session
Code. Les découvertes y seront de moins en moins guidées (guidage dégressif, §2).
Les cartes de savoir (C1-carte…) alimenteront l'étagère 4 du carnet (chantier 3).

**Décision d'avance pour le cours de la lentille (forêt).** Principe maître :
*l'écriture raconte ce que le rayon fait — complète, la même partout ; les mots
portent l'intuition.* Le cours de la lentille se déroulera en trois temps :

1. **1/2 + 1/2 = 2/2 = 1 — le moment où le 2/2 s'EXPLIQUE.** L'élève voit cette
   écriture depuis le lagon ; ici on la déplie : « on compte les parts : deux
   parts sur deux, c'est l'entier ». Le résultat étant connu d'avance (deux
   demi-gâteaux font un gâteau), toute l'attention va au mécanisme — le connu
   valide l'écriture.
2. **1/4 + 1/4 = 2/4… et le rayon dit plus.** Le rayon-somme a exactement
   l'épaisseur et la couleur d'un demi (le moteur réduit d'office : c'est déjà
   vrai à l'écran). L'écriture confirme ce que l'œil voit : 2/4 = 1/2. Remarque
   de Gwenael : l'équivalence est FACILE à montrer avec les rayons — le rayon
   prouve, l'écriture nomme.
3. **1/2 + 1/4 — maintenant seulement, la mise au même dénominateur.** On réécrit
   1/2 en 2/4, avec la preuve par les rayons : couper un demi en deux puis le
   recoller à la lentille redonne LE MÊME rayon. Puis 2/4 + 1/4 = 3/4.

Après ce cours, rien ne change dans la forme (R1 : toutes les étapes, partout) —
ce qui change, c'est que l'élève sait désormais POURQUOI la ligne s'écrit ainsi.

## 11. Arbitrages — état au 14/08

Validés par Gwenael (« d'accord avec tout le reste ») :
- **A1** nom « Les quatre quarts » ✓ · **A2** promotion des 2 niveaux existants ✓ ·
  **A3** consignes ✓ · **A5** formulation du déblocage ✓ · **A6** « dénominateur »
  entre parenthèses… devenu tiret en C1-4 ✓ · **A7** cours entre « Lévé ! » et la
  fenêtre des soleils ✓ · **A8** zéro fruit dans les découvertes ✓.

Restant : rien — **A4 validé le 14/08** (textes du §5, ajustés par la règle du
gâteau). **FEU VERT DONNÉ : cette spécification est bonne pour la session Code.**

> **Addendum v7 (14/08, retours de Gwenael sur les captures de la session Code —
> PR #357).** Ces retours, donnés en direct, amendent le §5 et le §6 :
>
> - **R5 — L'écriture mathématique est toujours étagée et séparée du texte.**
>   Dans les points de cours, plus aucune fraction « en slash » : chaque égalité
>   vit sur sa propre ligne, en fractions empilées, avec son explication courte
>   au-dessus ; une fraction citée dans une phrase s'écrit empilée, en petit,
>   dans le texte. Une chaîne d'égalités se coupe AVANT un « = » (Coup de pouce
>   compris), jamais au milieu d'une somme.
> - **Les cours s'allègent** : le schéma et les écritures portent le cours, la
>   narration et les redites disparaissent ; la phrase-bilan ne vit QUE dans la
>   carte de savoir. Textes v7 dans la table COURS de levels.js — à valider par
>   Gwenael sur captures.
> - **C2-2 (comparaison des épaisseurs demi/tiers) est retirée du cours du
>   tiers** : l'idée resservira là où elle s'utilise (les passes étroites —
>   futur cours de la comparaison, monde des pitons, table §10).
> - **Écran des niveaux : toutes les cases d'un monde gardent la même taille** —
>   l'espace du bouton « Revoir le cours » est réservé sous toute la grille dès
>   qu'un cours y est disponible.
> - TRANCHÉ sur maquette (14/08) : l'écriture étagée passe AUSSI sur le plateau —
>   maisons et étiquettes de rayons (chiffres un peu grossis), et les étiquettes
>   des scènes des cours. Restent en slash, à juger sur téléphone :
>   les passes étroites (≤1/2) et les badges des soleils spéciaux (très petits).
> - **La scène des cours passe des rayons aux BANDES DE FRACTIONS** (proposition
>   d'une collègue, validée par Gwenael sur image de référence : mur 1 / demis /
>   quarts) : bandes proportionnelles, séparations pointillées, fractions étagées
>   noires au centre des cases ; adaptation Solèy = couleur de case par
>   dénominateur (entier doré, demis orangés, tiers bleus, quarts roses), les
>   étages apparaissent l'un après l'autre. La somme (C3-3) se LIT sur la bande.
>   Les fractions des maisons (19 px) et des rayons (23 px) sont grossies à sa
>   demande — tailles à confirmer sur téléphone, réglables en un nombre.
> - **Le pont entre les deux mondes — v8 (RETOUCHE-PONT-v8.md, entré au dépôt ;
>   remplace le morphing de la v7).** Le morphing couchait le rayon sur la
>   longueur de la bande — le MAUVAIS axe (dans le jeu, c'est l'ÉPAISSEUR du
>   rayon qui se partage, jamais sa longueur). La scène a désormais DEUX zones
>   synchronisées : en haut le vécu (la cascade de rayons du jeu, avec les
>   prismes), en bas la forme de l'école (le mur de bandes collées) ; entre les
>   deux, la phrase-pont fixe : « Dans le jeu, ta part est un rayon plus FIN.
>   Sur la bande, c'est un morceau plus COURT. Même partage, même fraction. »
>   Les deux zones grandissent ENSEMBLE, étape par étape, au rythme du texte —
>   à chaque instant, l'image montre ce que la phrase dit ; jamais de rayon
>   entier seul à l'écran. Le comptage des QUATRE rayons terminaux de C3
>   (règle R2 d'origine) est réactivé, en plus des quatre cases du mur.
>   Étages collés et couleurs du jeu : confirmés. En réserve pour le cours de
>   la lentille : l'addition en bandes (deux dispositions fournies par Gwenael
>   — bout à bout / en L), forme académique à trancher à ce lot-là.
> - **v9 — la cascade verticale : le mur est un ZOOM sur les rayons**
>   (RETOUCHE-ZOOM-v9.md, entré au dépôt ; idée de Gwenael, amende l'orientation
>   de la zone rayons et la phrase-pont, tout le reste de la v8 conservé).
>   Soleil en haut au centre, le rayon descend, les prismes aux étages, et
>   chaque rayon terminal arrive JUSTE AU-DESSUS de SA case de la dernière
>   rangée : largeur des rayons et longueur des cases vivent sur le même axe
>   horizontal — la division d'épaisseur (le jeu) et la division de longueur
>   (l'école) deviennent le même geste, vu deux fois. Fins traits pointillés
>   « de zoom » des bords du rayon aux bords de sa case (option, à juger sur
>   capture). Nouvelle phrase-pont : « Le mur, c'est un zoom sur tes rayons :
>   chaque part de lumière devient un morceau de la bande. » Un contrôle
>   d'alignement automatique garantit que chaque rayon tombe dans l'intervalle
>   de sa case.
> - **Mention de Refraction** (textes de Gwenael au caractère près) : courte au
>   pied de la page du jeu, complète dans le panneau « D'où vient Solèy ? »
>   (le jeu n'a pas de panneau de règles : ce panneau, ouvert depuis le pied de
>   l'accueil, en tient lieu). Consignée dans SOLEY.md §6.
> - Défis : question FERMÉE définitivement (14/08 au soir) — les défis se jouent
>   SANS AUCUNE AIDE, et ils ne doivent jamais être bloquants. Remplace la
>   ré-ouverture du §11 ; contrainte de conception pour le chantier 4.

Ajouts didactiques de Claude (v4, sur mandat de Gwenael « tu es aussi l'aide
didactique — s'il y a mieux à faire, on fait ») :
- cascade animée au rythme du texte (revivre le partage au ralenti) ; prédire à
  révélation R3 (une prédiction dont la réponse est déjà écrite n'en est pas une) ;
  phrase-carte habillée en carte de savoir R4 (prépare l'attachement du chantier 3) ;
  bouton « Revoir ». (Historique du débat 2/2 : totaux ajoutés en v4, retirés en
  v5 — règle du gâteau —, rétablis DÉFINITIVEMENT en v6 par décision de Gwenael :
  une seule forme d'écriture, partout ; les mots portent l'intuition.)

Ré-ouvert (hors lot, pour mémoire) :
- L'aide (Coup de pouce) disponible ou non sur les niveaux les plus durs / défis :
  Gwenael n'est plus sûr du « défis sans aide » — à trancher au chantier 4.
  Recommandation de Claude, à éprouver en classe : garder les défis sans aide
  gratuite (un défi est une situation de recherche, l'aide y tue l'enjeu), mais
  si des blocages décourageants apparaissent, offrir un indice PAYANT en fruits
  péi — cohérent avec l'économie du carnet et avec l'esprit de l'original.

## 12. Mises à jour du cahier à embarquer dans la même PR (sync en attente)

- Ce document entre au dépôt à la racine (SPEC-COMPRENDRE-LOT1.md), renvoi depuis
  DESIGN-SOLEY.md pilier 1 (chantier lancé, lot 1 = lagon).
- DESIGN-SOLEY.md, pilier 5 : RETIRER la « passe grand écran » (annulée par Gwenael le
  13/08 au soir : le jeu se veut téléphone d'abord ; la vraie limite est le NOMBRE DE
  CASES borné par l'écran du téléphone → à noter comme contrainte de conception des
  niveaux, pilier 4). L'ancien prompt « session 7 grand écran » est caduc, ne pas l'utiliser.
- DESIGN-SOLEY.md, pilier 1 : noter le guidage dégressif (pas de flèches au lot 1,
  décision du 14/08) ; pilier 2/4 : la question « aide disponible pendant les défis ? »
  redevient OUVERTE (elle était tranchée « sans aide ») — à décider au chantier 4.
- SOLEY.md : §3 (lagon 9 niveaux, 61 au total), §6 (décisions du 14/08), journal.
- SOLEY.md §6, nouvelle décision à graver : R1 — aucune étape sautée, nulle part :
  mise au même dénominateur, nombres mixtes, simplifications ET totaux n/n
  toujours écrits (1/2 + 1/2 = 2/2 = 1). Une seule forme d'écriture pour tout le
  projet, cours et Coup de pouce, contenus futurs compris. Le POURQUOI du n/n
  sera l'objet du cours de la lentille (forêt, lot suivant).
- Si la session 6 (miroirs 45°) est fusionnée entre-temps : consigner aussi son verdict.
