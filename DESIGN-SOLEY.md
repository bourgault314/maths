# DESIGN-SOLEY.md — Cahier de conception du « vrai jeu »

> Vision de Gwenael (13/08/2026) : contrairement à l'original où l'on ne faisait que jouer,
> Solèy doit APPRENDRE. L'élève doit comprendre POURQUOI couper un rayon en deux donne
> un demi, et un demi coupé en deux un quart. Le jeu porte une partie de cours.
> Devise du projet : **« On ne joue pas pour jouer : on comprend en jouant. »**

Ce document guide les chantiers après le découpage technique. Il complète SOLEY.md
(qui reste la référence des règles et de l'existant) et doit vivre dans le dépôt à côté.

---

## Pilier 1 — Comprendre : découvrir en jouant, nommer ensuite (le cours vivant)

Le cœur de la demande. Mécanique voulue par Gwenael (validée le 13/08) :
**la découverte passe par un challenge simple, le cours vient APRÈS.**

Séquence type pour chaque notion nouvelle :

1. **Le niveau-découverte** : un défi tout simple, SANS labyrinthe ni piège, construit
   pour que la seule issue soit la notion elle-même. Exemple fondateur : un soleil
   qui vaut 1, quatre maisons à 1/4, des prismes ÷2 dans la boîte — l'élève doit
   découvrir seul qu'en coupant, puis en recoupant, il fabrique des quarts.
2. **Le point de cours** : juste après la victoire, quand l'élève vient de le VIVRE,
   un panneau met des mots et l'écriture propre sur ce qu'il a fait : « Tu as coupé
   le rayon en 2 : 1 ÷ 2 = 1/2. Puis coupé la moitié en 2 : 1/2 ÷ 2 = 1/4. La moitié
   de la moitié, c'est le quart. » Schéma en rayons + fractions empilées (on a déjà
   le moteur du Coup de pouce pour ça). Le « prédire avant de voir » devient un
   ingrédient DU point de cours quand c'est pertinent (« et si on recoupe encore,
   ça donnera quoi ? »), pas des écrans à part.
3. **Les niveaux d'entraînement** : ensuite seulement, l'élève s'amuse avec la
   notion dans des niveaux plus riches (détours, fruits, pièges…).

- Un niveau-découverte + son point de cours par notion : partage ÷2, ÷3, la moitié
  de la moitié, l'addition à la lentille, les équivalences, la comparaison aux
  passes, la multiplication à la loupe, le soleil qui vaut 2, les sixièmes…
- Les points de cours sont relisibles à tout moment (menu « Comprendre » / carnet).
- Chaque point de cours vu ajoute une **carte de savoir** au carnet (voir Pilier 3) :
  la trace écrite en une phrase + le schéma en rayons.
- RÉSOLU (réponse de Gwenael, 13/08) : les « cours déjà ajoutés » sont **le Coup de
  pouce actuel** (scènes en rayons + écritures fractionnaires, table CALC, 51 cartes).
  C'est LA base à enrichir pour ce pilier — rien d'autre à chercher. Les points de
  cours réutiliseront ce moteur (sSun/sBeam/sceneFor/calcLineHTML dans engine.js).
- **CHANTIER LANCÉ (14/08) — lot 1 = le lagon.** Cahier des charges validé ligne par
  ligne : **SPEC-COMPRENDRE-LOT1.md** (racine du dépôt). Contenu : 2 niveaux promus
  découvertes, « Les quatre quarts » créé, cours C1-C2-C3 mot pour mot, règles
  R1 (toutes les étapes écrites, totaux n/n compris) / R2 (scènes complètes,
  tous les rayons terminaux visibles) / R3 (prédire à révélation) / R4 (phrase-carte
  en carte de savoir), déblocage seuil + découvertes, `save.cours`.
- **Guidage dégressif (décision du 14/08) : pas de système de flèches au lot 1**
  (idée 2 de la bibliothèque, écartée pour l'instant). Les toutes premières
  découvertes s'appuient sur la consigne-question, un plateau sans piège et le
  Coup de pouce ; les découvertes des mondes suivants (sixièmes, loupes…)
  laisseront l'élève se débrouiller davantage — on a expliqué le quart, on
  n'explique pas le sixième pareil. À réévaluer après les tests en classe.

## Pilier 2 — Progresser : le jeu se mérite

Fini le tout-accessible : l'élève valide petit à petit.

- **Mondes verrouillés** : pour ouvrir un monde, il faut avoir passé ses
  niveaux-découverte (avec leurs points de cours) + un nombre de niveaux réussis
  du monde précédent (ex. 5 sur 8 — jamais 100 %, pour ne bloquer personne sur un
  niveau récalcitrant).
- **Étoiles par niveau** : ★ réussi · ★★ tous les fruits ramassés · ★★★ défi de
  maîtrise (nombre minimum de pièces, affiché après la première réussite).
- **Niveaux défis** (« les cailloux durs ») : une poignée par monde, cachés,
  débloqués en dépensant des fruits — les vrais casse-têtes de 10-20 minutes.
- **Aide pendant les défis : TRANCHÉ définitivement (14/08 au soir)** — les défis
  se jouent SANS AUCUNE AIDE, et ils ne doivent jamais être bloquants (l'esprit
  « jamais 100 % » les couvre : on peut toujours avancer ailleurs). Contrainte de
  conception à respecter au chantier 4.
- Le professeur garde un **mode classe** (code ou réglage) qui déverrouille tout,
  pour la vidéoprojection et l'AP.

## Pilier 3 — S'attacher : le carnet péi (collection et île)

Reprendre l'idée de collection de l'original, en mieux et en créole.
(État confirmé le 13/08 : rien n'est encore construit — ce pilier est le chantier 3.)

- Tout fruit ramassé rejoint le **carnet péi** : une page par fruit (letchi, mangue,
  ananas Victoria — puis goyavier, combava, vanille, chouchou…), avec une jolie
  carte et 2-3 phrases vraies sur l'île : saison, où ça pousse, petite anecdote.
  Le jeu « fait parler l'île ».
- Plus tard, les **animaux péi** : chaque maison servie abrite un animal qui rejoint
  le carnet (paille-en-queue, tortue verte, tangue, gecko vert de Manapany…).
- Le carnet montre aussi les cartes de savoir (Pilier 1) : sur la même étagère,
  ce qu'on a compris et ce qu'on a collectionné.
- Compteurs à repenser autour du carnet (les chiffres nus deviennent des pages qui
  se remplissent).
- **Les cinq étagères du carnet** (proposition du 13/08, suite à la question
  « qu'apprendre avec les cartes ? ») :
  1. Fruits péi — ramassés dans les niveaux (l'existant, à redessiner) ;
  2. Animaux péi — découverts dans les maisons servies ;
  3. Merveilles de l'île — une carte-lieu par MONDE terminé (nos mondes sont déjà
     des lieux : lagon, volcan, Mafate…) ;
  4. Cartes de savoir — gagnées aux points de cours (les maths) ;
  5. Grandes figures de la Réunion — réservées aux niveaux défis les plus durs.
     Première carte : Edmond Albius (l'enfant de 12 ans qui a découvert la
     fécondation de la vanille en 1841) ; puis Roland Garros, Juliette Dodu,
     Célimène… Chaque carte : illustration + 2-3 phrases vraies.
- **À la manière de la Trophy Room de l'original** : les pages vides restent
  visibles, avec l'indice « se trouve au niveau … — condition : … ».
- **Refonte graphique des fruits** (demande Gwenael) : vraie étude des fruits
  locaux avec références visuelles, liste à établir ensemble (letchi, mangue José,
  ananas Victoria, goyavier, combava, longani, papaye, fruit de la passion…).

## Pilier 4 — Chercher : la vraie difficulté

Constat honnête de Gwenael après avoir rejoué l'original : ses niveaux demandaient
parfois 15 minutes de recherche ; les nôtres se résolvent presque instantanément.
Diagnostic : nos niveaux donnent les outils exacts, sans fausses pistes, avec une
seule décomposition évidente. Principes pour de vrais casse-têtes :

1. **Outils en surplus avec pièges plausibles** : des décompositions qui SEMBLENT
   marcher mathématiquement mais coincent spatialement (et inversement).
2. **Plusieurs chemins mathématiques possibles, un seul qui passe sur le plateau** :
   entrelacer la contrainte numérique et la contrainte spatiale — c'était le génie
   de l'original.
3. **Interdépendance des cibles** : servir la case A d'une certaine façon rend la
   case B impossible ; il faut planifier l'ensemble avant de poser.
4. **Pièces scellées « mal » placées** qu'il faut intégrer au lieu de subir.
5. **Étalonnage au chrono** : cible de temps par palier (6e : 1-3 min ; standard :
   3-8 min ; défis : 10-20 min). On reclasse les niveaux existants, on garde les
   faciles en début de monde, et on crée la couche « défis ».
6. **Les captures de l'original** (Gwenael joue, capture, envoie) alimentent une
   bibliothèque d'idées de niveaux à transposer — sans copier les plateaux.
7. **Maisons à porte orientée** (décision du 13/08) : aujourd'hui les maisons
   acceptent le rayon de TOUTES les directions — douceur voulue, à conserver dans
   les premiers mondes. La « porte orientée » (varangue d'un seul côté : le rayon
   doit entrer par la façade) devient un levier de difficulté réservé aux mondes
   avancés et aux niveaux défis — à concevoir dans ce chantier.
8. **Contrainte de conception des niveaux** (14/08, remplace la « passe grand
   écran » annulée) : le jeu se veut téléphone d'abord — la vraie limite est le
   NOMBRE DE CASES d'un plateau, borné par l'écran du téléphone.

## Pilier 5 — Habiller : l'écrin

- **Splash** : écran d'accueil illustré (lever de soleil sur l'île, titre, Jouer /
  Comprendre / Carnet), première impression digne d'un concours.
- **Musique et sons** : nappe discrète d'ambiance (inspiration locale, légère),
  sons de découpe/victoire, bouton couper le son toujours visible. Jamais imposé.
- **Dessins** : passe graphique sur les pièces, maisons, fruits, roches ; animations
  de ramassage (le fruit vole vers le carnet).
- **Mécanique à revoir au besoin** : tout ce que le test en classe révélera.
  (La « passe grand écran » a été RETIRÉE d'ici le 14/08 — annulée par Gwenael le
  13/08 au soir, le jeu se veut téléphone d'abord ; l'ancien prompt « session 7
  grand écran » est caduc. Ce qu'il en reste vit au pilier 4, principe 8 :
  le nombre de cases est borné par l'écran du téléphone.)
- **Le miroir de la collègue** — RÉALISÉ (13/08 nuit) : barre-miroir à 45° orientée
  entrée/sortie (double trait sombre/clair + reflet), réflexion NETTE à angle droit,
  trajets internes de toutes les pièces en lignes brisées — plus aucune courbe de
  rayon dans le jeu. Isolé dans render.js seul (revert facile si le réveil en décide
  autrement). Rendu à juger par Gwenael au matin.
- **Interaction hybride** (proposition à valider) : téléphone/tablette = toucher
  l'outil puis toucher la case (l'actuel, le doigt ne cache pas le plateau) ;
  ordinateur = glisser-déposer à la souris EN PLUS du clic-clic, y compris pour
  déplacer une pièce déjà posée.
- **Version-témoin** : publier une copie figée du premier jeu à une adresse stable
  (ex. `soley-v1.html`, « le musée ») pour que Gwenael puisse toujours revoir les
  niveaux d'origine ; le dépôt garde de toute façon l'historique complet.

---

## Ordre proposé des chantiers (après le découpage technique)

1. **Progression verrouillée + étoiles** — c'est la colonne vertébrale, tout le
   reste s'y accroche (ateliers qui débloquent, défis achetés en fruits).
2. **Ateliers « Comprendre »** — le cours vivant, la raison d'être du projet.
3. **Carnet péi** — collection, cartes de savoir, fiches de l'île.
4. **Difficulté** — reclassement, niveaux défis, transposition des captures.
5. **Habillage** — splash, musique, dessins, animations.

Chaque chantier = un chapitre de discussion ici (Cowork) pour fixer les détails,
puis une ou plusieurs sessions Code pour fabriquer, tester, publier après accord.

## Retouches du chantier 1 (passe du 13/08 au soir — FAITES)

1. [x] **Les étoiles deviennent des petits soleils** (cartes de niveaux, fenêtre de
   victoire, compteur d'accueil, textes) — pictogramme soleil maison (disque doré à
   rayons, cohérent avec les soleils du plateau), pas le caractère ★. Le code garde
   `etoiles()` comme nom interne (API et tests stables).
2. [x] **Mini-légende des trois soleils** sur l'écran des niveaux d'un monde :
   « réussi · tous les fruits · nombre de pièces minimal » — discrète, lue avant de
   choisir un niveau (demande de Gwenael : élèves et professeur ne devinaient pas).
3. [x] **Lambrequins v2** : vraie dentelle créole en bordure de toit — festons
   suspendus terminés par une perle, silhouette franche qui pend DEVANT la façade,
   sans surcharger la petite maison.

## Décisions actées le 13/08

- [x] Mécanique d'apprentissage : niveau-découverte simple → point de cours → niveaux
      d'entraînement (version Gwenael, remplace les « ateliers » séparés).
- [x] Mode classe qui déverrouille tout pour le professeur : oui — fait (`soley.html?classe`).
- [x] L'ordre des cinq chantiers : progression d'abord (chantier 1 lancé et livré le 13/08).
- [x] Le seuil de déblocage des mondes : ⌈5/8 des niveaux du monde précédent⌉, jamais
      100 % (pour ne bloquer personne sur un niveau récalcitrant) ; VALIDÉ
      définitivement par Gwenael après essai (13/08 au soir) ; les niveaux-découverte
      s'y ajouteront quand le pilier 1 existera.
- [x] Maisons multidirectionnelles conservées dans les premiers mondes (douceur
      voulue) ; la « porte orientée » devient un levier de difficulté — voir le
      principe 7 du pilier Chercher (13/08 au soir).

## Décisions en attente (à valider par Gwenael)

- [x] Où sont les cours déjà ajoutés : le Coup de pouce actuel (réponse du 13/08,
      voir le RÉSOLU du pilier 1).
- [ ] Les premiers contenus du carnet : quels fruits, quels textes sur l'île.
