# SOLEY.md — Bible du projet Solèy

> Jeu de fractions à rayons de soleil, thème Réunion, pour maths&go (mathsgo.re).
> Ce fichier est la mémoire du projet : toute session (Claude Code, Cowork, autre)
> doit le lire AVANT de toucher au code, et le mettre à jour APRÈS chaque évolution validée.
> La vision du vrai jeu est dans DESIGN-SOLEY.md ; le réservoir d'idées de niveaux
> (analyse des captures de l'original) dans BIBLIOTHEQUE-IDEES.md — tous deux à la racine.

## 1. Règle d'or

**La source de vérité est ce dépôt.** La version en ligne = ce qui est sur `main`.
Plus jamais de fichier qui circule par chat/GPT/mail : toute modification passe par le dépôt,
sinon les versions divergent (c'est déjà arrivé une fois).

Règles maths&go qui s'appliquent (voir AGENTS.md) : ne jamais publier sans accord explicite
de Gwenael ; lire le dépôt et l'historique récent avant de modifier ; ne modifier que le
nécessaire ; tester mobile ET ordinateur ; compte rendu : problème → cause → solution →
fichiers modifiés → tests → reste à vérifier.

## 2. Le jeu en bref

- Un ou plusieurs soleils émettent des rayons (valeur 1, 2, ou une fraction : 1/2, 1/3…).
- Pièces posables : Miroir (déviation), Prisme ÷2 / ÷3 (partage égal), Lentille + (addition
  de deux rayons), Loupe ×2 / ×3 (multiplication).
- Cases créoles (cibles) : exigent une fraction EXACTE, un seul rayon par case.
- Épaisseur du rayon proportionnelle à sa valeur ; couleur selon le dénominateur réduit
  (demis orangés, tiers bleus, quarts roses, sixièmes verts, huitièmes lilas, neuvièmes cyan, douzièmes pervenche).
- Le rayon reste continu à travers les pièces (même épaisseur/couleur) et tourne NET,
  à angle droit ; le miroir est une barre à 45° orientée par son entrée/sortie
  (réflexion sèche — proposition de la collègue réalisée le 13/08, fini les tubes courbes).
- Obstacles : roches (bloquent), passes étroites `≤ f` (ne laissent passer que les rayons
  assez fins — comparaison visuelle), pièces scellées (pré-posées, indéplaçables, rivets dorés).
- Fruits péi (letchis, mangues, ananas) à ramasser en les traversant. Décoratifs pour l'instant.
- Un rayon peut se perdre (pas d'obligation de tout utiliser), sauf niveaux « rien ne se perd ».
- Victoire : cinématique (rayon qui avance segment par segment, confettis, « Lévé ! »).
- Aide à deux étages : bouton Indice → panneau « Coup de pouce » avec la scène en rayons
  (prisme qui sépare réellement en 2/3 branches, lentille qui cumule, référence « rayon entier = 1 »)
  + le calcul typographié en fractions empilées (avec mise au même dénominateur).
- Sauvegarde locale par clé stable `monde:nom-du-niveau` (survit aux ajouts de niveaux).
  Repli silencieux en mémoire si localStorage indisponible.
  Champs : `done` (réussi), `fruits` (meilleur ramassage), `pieces` (meilleur nombre de pièces).
- Progression (chantier 1 du vrai jeu, 13/08) : les mondes se MÉRITENT — un monde s'ouvre
  quand on a réussi ⌈5/8 des niveaux du monde précédent⌉ (jamais 100 %) ; condition affichée
  sur la carte du monde fermé, avec cadenas. Récompenses par niveau : les PETITS SOLEILS
  (pictogramme doré à rayons dessiné maison — jamais le caractère ★) : 1 = réussi ·
  2 = + tous les fruits (acquis d'office si le niveau n'en a pas) · 3 = + défi de maîtrise
  = réussir avec au plus autant de pièces que la solution de référence (annoncé après la
  première réussite, rappelé en rejouant). Mini-légende des trois soleils sur l'écran des
  niveaux d'un monde. Mode classe pour le professeur : `soley.html?classe` déverrouille
  tout (badge visible, rien n'est modifié dans la sauvegarde).
- Plein écran : bouton ⛶ (API fullscreen quand dispo ; sinon mode focus + astuce
  « Ajouter à l'écran d'accueil » sur iOS). Installable (manifest inline + icônes data-URI).
- Paysage : plateau pleine hauteur à gauche, barre/consigne/outils dans colonne droite.

## 3. Les mondes (état à la v6.1 côté Claude — vérifier ce qui est déployé)

| Monde | Palier | Contenu | Niveaux |
|---|---|---|---|
| Le lagon | 6e | découverte, partage égal — dont 5 niveaux-découverte (demi, tiers, quart, sixième, **recouper**) | 11 |
| Les champs de canne | 6e | partage JOUÉ à fond, notion constante : surplus, pièges, fruits à valeur, portes orientées (refonte 08/2026) | 8 |
| La forêt | 5e | additions (lentille), équivalences — dont 2 niveaux-découverte (somme, même dénominateur) | 8 |
| Le volcan | 4e | loupes ×, fractions > 1, 1/9 | 7 |
| Les pitons | 5e-4e | équivalences, comparaisons (passes) | 7 |
| Les soleils | 4e | soleils multiples / fractionnaires / valeur 2 | 8 |
| Le marché | 5e-3e | 0,5 ; 25 % ; 100 % (écritures) | 6 |
| Les tunnels | 6e-4e | labyrinthes denses (41-64 % de roches), esprit de l'original | 8 (dont « Le prisme scellé » et « La galerie scellée ») |
| Mafate | Expert | tout combiné, 2 soleils, grands plateaux | 7 (dont « Les verrous du cirque ») |

Total : 70 niveaux, chacun avec une solution de référence `sol` vérifiée automatiquement.
Depuis la refonte (08/2026), les niveaux retouchés ou nouveaux portent AUSSI un champ
`solMin` : un plan gagnant qui ne ramasse PAS tous les fruits — la batterie prouve
ainsi que le fruit se mérite (règle d'or, idée 11 de la bibliothèque). Deux mécaniques
sont réservées à la canne puis aux mondes avancés : le fruit à valeur `[x,y,[n,d]]`
(cueilli seulement par un rayon valant n/d) et la porte orientée `{porte:côté}` sur
les cibles (0 N, 1 E, 2 S, 3 O — les autres côtés bloquent comme une roche).
Depuis le lot 1 du chantier « Comprendre » (14/08), les niveaux-découverte portent un
champ `dec` qui les relie à leur point de cours (table `COURS` de levels.js).

## 4. Format d'un niveau (données)

```js
{ w:'foret',                 // id du monde
  name:"Trois quarts",       // clé de sauvegarde (NE PAS renommer sans migration)
  sub:"…",                   // consigne SANS donner la solution (question, pas recette)
  hint:"…",                  // texte du Coup de pouce (facultatif)
  cols:9, rows:7,
  suns:[{x,y,dir,val:[n,d]?}],        // dir: 0=haut 1=droite 2=bas 3=gauche ; val par défaut [1,1]
  targets:[{x,y,need:[n,d],disp:"0,75"?}], // disp = écriture affichée (décimal, %, 2/4…)
  rocks:[[x,y],…], fruits:[[x,y],…],
  gates:[{x,y,max:[n,d]}]?,           // passes étroites
  fixed:[[def,x,y],…]?,               // pièces scellées
  tools:[b(in,out), s2(in,o1,o2), s3(in,o1,o2,o3), mg(in1,in2,out), x2(in,out), x3(in,out)],
  sol:[[toolIndex,x,y],…] }           // solution de référence — OBLIGATOIRE
```
Champ `dec:'<id>'` (facultatif) : niveau-découverte, relié à son point de cours dans
la table `COURS` (titre, scène en cascade, textes mot pour mot de la spec, prédire,
phrase-carte). Calculs du Coup de pouce : table `CALC` par nom de niveau, lignes du
type `"1/2 + 1/4 = 2/4 + 1/4 = 3/4"` (rendues en scène de rayons + fractions
empilées) — règle R1 : aucune étape sautée, totaux n/n toujours écrits.

## 5. Qualité : la procédure de test est OBLIGATOIRE avant tout push

API de test exposée : `window.SOLEY = {openLevel, simulate, state, LV, solve(i),
etoiles(i), parNiveau(i), seuilMonde(wi), mondeDeverrouille(wid), reussisMonde(wid), renderHome,
cours(id), montrerCours(id, apresVictoire), fermerCours(), decouvertesMonde(wid),
decouvertesReussies(wid)}` — les cinq dernières sont arrivées avec le chantier
« Comprendre » et manquaient à cette liste jusqu'au 15/08.
`openLevel`/`solve` IGNORENT les verrous (c'est voulu : la batterie joue tout).
Batterie (script Playwright Python, à conserver dans `tests/`) :
1. Cohérence des données de chaque niveau (bornes, chevauchements, outils valides).
2. `solve(i)` gagne pour TOUS les niveaux (solutions de référence).
3. Tous les fruits sont ramassables par la solution de référence.
4. Test négatif : une passe bloque un rayon trop épais.
5. Écrans réellement masqués (`getComputedStyle(#play).display === 'none'` sur l'accueil —
   attention au piège de spécificité #id vs .classe, déjà corrigé une fois).
6. Paysage : zéro défilement de page, clic précis (letterbox pris en compte).
7. Zéro erreur JavaScript.
8. Progression : seuils ⌈5/8⌉ exacts, accueil neuf tout fermé sauf lagon, clic sur monde
   fermé sans effet (condition lisible), déblocage après 6 réussites dont les 3
   découvertes, étoiles sur les cartes, mode classe, zéro défilement horizontal téléphone.
9. Chantier « Comprendre » (lot 1) : « Les quatre quarts » gagne par sa `sol` (1/4 exact
   partout), point de cours affiché après victoire d'une découverte seulement (jamais au
   rejeu), cascade C3 à quatre rayons terminaux, prédire à révélation, « Revoir le
   cours » sur la carte du niveau, vieille sauvegarde sans `cours` intacte, stabilité
   320/402 px. (Le bouton « Revoir » DU PANNEAU n'existe plus depuis le 14/08.)
10. Panneau de cours (T10, depuis le 14/08) : posé d'un coup — aucun `--win-delay`
   dans le corps —, sortie « J'ai compris ! » à la FIN du cours (hors écran tant que
   le panneau déborde, atteignable une fois descendu), flèche de défilement présente
   tant que le panneau déborde et effacée une fois en bas.
11. Refonte (depuis le 14/08 au soir) : chaque niveau à `solMin` gagne SANS tous
   ses fruits (le fruit se mérite — exceptions documentées dans le test), les
   portes orientées acceptent le bon côté et bloquent l'autre, un fruit à valeur
   ignore les rayons d'une autre valeur (contrôle « refonte » de la batterie node).
   **Depuis le 15/08, il ne reste QU'UNE exception au contrôle P2 : « Le tour du
   lagon ».** Celle de « La chambre close » est tombée avec la refonte du niveau —
   son fruit se mérite comme les autres.
12. Pages générées : toute modification de `catalogue-refonte-data.js`
   (descriptions, classement) exige de régénérer les sorties dérivées — au
   moins `outils/toutes-les-ressources.html` (c'est le test seo-publication
   qui le garde). Oubli réel du lot canne, attrapé par la CI.
13. **Mesure de la difficulté (depuis le 15/08).** Tout lot qui redessine des
   niveaux passe par `tests/soley/solveur-etalon.mjs` : force brute sur l'espace
   ÉCLAIRÉ (les poses où chaque pièce reçoit un rayon qu'elle accepte), rejouant
   `simulate()` du vrai moteur — aucune physique réécrite. Graines fixes, donc
   rejouable :
   ```
   node tests/soley/solveur-etalon.mjs --monde canne --sans-libre --budget 1600000
   node tests/soley/solveur-etalon.mjs --monde lagon --sans-libre --budget 1600000
   ```
   **Le `--budget` n'est pas décoratif** : c'est le plafond de nœuds explorés, et
   le rapport a mesuré à 1,6 M là où le script en prend 400 000 par défaut. Sans
   lui, « Le grand tri » sort à `R` = 15 522 au lieu de 21 249 avec la mention
   `[BUDGET ATTEINT : E borné, R plancher]` — un plancher, pas un désaccord. Quand
   cette mention apparaît, la vraie valeur est plus haute, jamais plus basse.
   Ses trois compagnons servent à concevoir, pas à contrôler : `atelier-niveaux.mjs`
   (champ en carte ASCII + plans trouvés), `carte-fruits.mjs` (où poser un fruit
   pour qu'il se mérite), `tailleur-champs.mjs` (recuit local sur un champ jouable).
   `semeur-champs.mjs` est conservé comme PREUVE D'ÉCHEC : c'est lui qui a établi
   le résultat sur la densité (§6). **Attention à ne pas les confondre avec un
   vérificateur de lot** (modèle `verifier-lot-canne.mjs`) : ils mesurent la
   difficulté, ils ne prouvent pas que l'existant est intact. Cette preuve-là,
   c'est `verifier-lot-niveaux-durs.mjs`.
14. **Lisibilité d'un fruit à valeur (T11, depuis le 15/08).** La fraction d'un
   fruit à valeur se peint DEVANT les rayons. Le contrôle lit l'ORDRE DE PEINTURE
   dans le SVG (`g.fruitval` après le dernier `line.beam`), pas des pixels — et il
   a été vérifié dans les deux sens : rouge sur l'ancien rendu, vert sur le
   correctif. Voir §6, décision « le corps du fruit sous le rayon, sa fraction
   devant ».
15. **Un progrès se réenregistre (T12, depuis le 15/08).** On gagne, on RESTE sur
   le niveau, on pose les pièces qui cueillent le fruit : le fruit doit être
   recompté sans qu'on ait à retirer une pièce d'abord. Le contrôle joue
   « Le tiers de la moitié » (son `solMin` est le préfixe exact de son `sol`) et
   lit `soley-save-v5` aux deux étapes. Vérifié dans les deux sens : rouge sur
   l'ancien rendu, vert sur le correctif.

16. **Un niveau qui ENSEIGNE force sa notion (depuis le 15/08).** Si on retire de
   la boîte toutes les pièces qui portent la notion d'un niveau-découverte, ce
   niveau doit devenir INGAGNABLE — sinon l'élève le finit sans jamais faire le
   geste qu'on prétend lui apprendre. Ce n'est pas un avis : c'est
   `node tests/soley/notion-forcee.mjs <monde> <type>`, à passer sur tout nouveau
   niveau-découverte. **La règle qui décide, vérifiée sur les neuf niveaux de la
   forêt : un niveau force l'addition si et seulement si au moins une de ses cibles
   ne peut PAS être obtenue par un seul rayon** (le soleil suivi d'une suite de
   coupes et d'agrandissements). Corollaire à ne pas oublier en dessinant : une
   case qui demande 1/1 quand le soleil vaut 1 ne forcera JAMAIS la lentille, quel
   que soit le plateau.

**Batterie de L'atelier (depuis le 15/08), à lancer en plus dès qu'on touche à
`soley-atelier.html` ou `atelier.js` :**
```
python tests/soley/test_atelier.py --root .      # 18 contrôles A1→A13
node tests/soley/verifier-atelier.mjs            # le jeu n'a pas bougé d'un octet
node tests/soley/rejouer-bloc.mjs <fichier>      # rejoue un bloc exporté (harnais)
```
Le contrôle A8 est le garde-fou du lot : une fausse progression est semée dans
`soley-save-v5` AVANT le chargement, on gagne réellement dans l'atelier, et la clé
doit être identique à l'octet après la victoire. A5b vérifie qu'un niveau gagné
plateau vide est refusé au jeu (sinon la célébration démarre à l'ouverture et le
plateau ne répond plus aux clics — défaut trouvé en construisant le lot).

## 6. Historique des décisions (ne pas re-débattre sans raison)

- Nom « Solèy » validé. Pièce « Lentille + » validée (PAS « Recolleur »).
- **Une notion s'enseigne UNE fois, avant qu'on s'en serve** (16/08). Un monde ne
  redécouvre pas ce qu'un monde précédent a enseigné : c'est ce qui a coûté sa place à
  « Quarts en croix » (15/08) puis à « Les sixièmes » (16/08). Corollaire : une notion
  servie sans cours est une dette, pas un choix — 1/8, 1/9 et 1/12 l'ont été deux jours.
- **Le support d'un point de cours est la bande de fractions ; le rayon reste le support
  du jeu.** Un cours peut donc se passer entièrement de rayons (`scene.murs`, cours
  `recouper`, 16/08) — et il le doit dès que la cascade dépasse deux coupes.
- Textes des niveaux = questions, jamais la solution ; l'équation vit dans le Coup de pouce.
- Un seul rayon par case (la lentille sert à additionner, pas la case).
- Couleur par dénominateur RÉDUIT (3/6 s'affiche orange comme 1/2 : c'est voulu, ça montre l'égalité).
- Pas de panneau solaire sur les maisons (jugé moche) ; maisons créoles à lambrequins.
- Fruits = vraiment péi et reconnaissables.
- Inspiration : Refraction (Center for Game Science, UW, 2010). Mécaniques et pédagogie
  librement reprises (non protégées) ; nom, graphismes, code, niveaux = originaux.
  Original rejouable : flashmuseum.net/game/refraction-5nm (émulation, parfois capricieuse)
  ou app de bureau Flashpoint Archive ; vidéos walkthrough sur YouTube pour captures.
- Progression (13/08, Gwenaël) : seuil de déblocage = ⌈5/8 des niveaux du monde précédent⌉,
  jamais 100 % ; à terme s'y ajouteront les niveaux-découverte (DESIGN-SOLEY.md pilier 1).
- Étoiles calculées sur les MEILLEURS scores enregistrés (fruits maxi, pièces mini), pas sur
  une seule partie parfaite — choix assumé, plus doux pour les élèves.
- Défi de maîtrise (★★★) : « au plus autant de pièces que la solution de référence » —
  le par d'un niveau = la taille de son `sol`. Sans fruits dans un niveau, ★★ vient avec ★.
- Mode classe : paramètre d'URL `?classe`, non persistant (le lien suffit au professeur).
- Anciennes sauvegardes : champ `pieces` additif, rien à migrer ; le 3e soleil apparaît en rejouant.
- Les récompenses s'appellent et se dessinent « petits soleils » (13/08 au soir) — pictogramme
  maison soleilIco/soleilRang dans render.js ; le code garde `etoiles()` en interne (API stable).
- Lambrequins v2 (13/08 au soir) : dentelle à festons et perles qui pend DEVANT la façade
  (ordre de peinture SVG : corps de maison d'abord, dentelle ensuite).
- Seuil ⌈5/8⌉ VALIDÉ définitivement par Gwenaël après essai (13/08 au soir).
- Miroirs à 45° et rayons nets (13/08 nuit, proposition de la collègue) : barre-miroir
  orientée entrée+sortie (diagonale de la somme des directions), réflexion à angle droit,
  plus AUCUNE courbe de rayon (les segments internes portent data-part in/out, l'attribut
  through a disparu). Tout est dans render.js : un revert du commit suffit à revenir.
- Chantier « Comprendre », lot 1 (14/08) : niveau-découverte → point de cours →
  entraînement, appliqué au lagon (cahier des charges : SPEC-COMPRENDRE-LOT1.md, racine
  du dépôt, validé ligne par ligne). Le point de cours s'affiche entre « Lévé ! » et la
  fenêtre des soleils, à la première victoire seulement ; relecture par « Revoir le
  cours » sur la carte du niveau. Sauvegarde : champ additif `save.cours`.
- **R1 — aucune étape sautée, nulle part** (14/08, décision finale de Gwenael) : mise au
  même dénominateur, nombres mixtes, simplifications ET totaux n/n toujours écrits
  (1/2 + 1/2 = 2/2 = 1 ; 1/3 × 3 = 3/3 = 1 ; les partages du type 2 ÷ 2 = 1 restent
  tels quels). Une seule forme d'écriture pour tout le projet — cours et Coup de pouce,
  contenus futurs compris. Le POURQUOI du n/n sera l'objet du cours de la lentille
  (forêt, lot suivant). Règles sœurs gravées pour tous les cours : R2 scènes complètes
  (tous les rayons terminaux visibles), R3 prédire à révélation, R4 phrase-carte
  habillée en carte de savoir.
- Déblocage enrichi (14/08) : seuil ⌈5/8⌉ + les niveaux-découverte du monde précédent
  réussis (la forêt est passée d'elle-même à 6 avec le lagon à 9 niveaux) ; condition
  affichée « …, dont ses 3 découvertes (0/3) ». Badge découverte sur les cartes —
  picto « rayon qui se partage », jamais une étoile. `?classe` déverrouille tout,
  cours compris.
- R5 (14/08, retours de Gwenael sur captures) : dans les cours, l'écriture mathématique
  est ÉTAGÉE et SÉPARÉE du texte (explication courte au-dessus, égalité en fractions
  empilées dessous ; fraction citée dans une phrase = empilée en petit) ; les chaînes
  d'égalités se coupent avant un « = », jamais au milieu d'une somme (Coup de pouce
  compris). Les cours sont courts : la phrase-bilan ne vit que dans la carte de savoir.
- Défis (14/08 au soir, décision DÉFINITIVE — ferme la question ré-ouverte le matin) :
  les défis se jouent sans aucune aide, et ils ne doivent jamais être bloquants.
  Contrainte de conception du chantier 4.
- Scène des cours v9 (14/08, idée de Gwenael — RETOUCHE-ZOOM-v9.md à la racine) : la
  cascade devient VERTICALE, chaque rayon terminal arrive juste au-dessus de SA case
  de la dernière rangée — le mur se lit comme un ZOOM sur les rayons (même axe pour la
  largeur des rayons et la longueur des cases). Traits pointillés de zoom en option
  (à juger sur capture) ; alignement garanti par test. v9.1 (décision sur rendu) :
  PAS de phrase-pont — la scène seule porte le lien entre les deux registres.
- Mention de Refraction (14/08, textes de Gwenael au caractère près) : mention COURTE au
  pied de la page du jeu (« Solèy est librement adapté de Refraction (Center for Game
  Science, université de Washington, 2010). ») ; mention COMPLÈTE dans le panneau
  « D'où vient Solèy ? » ouvert depuis le pied de l'accueil — le jeu n'ayant pas de
  panneau de règles, ce lien en tient lieu. Elle remplace l'ancienne ligne « jeu
  original librement inspiré… ».
- Bandes des cours, suite (14/08) : étages COLLÉS (aucun espace entre les bandes).
  PONT v8 (RETOUCHE-PONT-v8.md, racine du dépôt — remplace le morphing v7, qui
  identifiait les deux représentations sur le MAUVAIS axe : dans le jeu, c'est
  l'ÉPAISSEUR du rayon qui se partage, jamais sa longueur) : la scène a DEUX zones
  synchronisées — en haut le vécu (cascade de rayons avec prismes), en bas la forme
  de l'école (mur de bandes) — reliées par la phrase-pont fixe « Dans le jeu, ta
  part est un rayon plus FIN. Sur la bande, c'est un morceau plus COURT. Même
  partage, même fraction. » Les deux zones grandissent ensemble, au rythme du
  texte : à chaque instant, l'image montre ce que la phrase dit ; jamais de rayon
  entier seul à l'écran. Couleurs des cases = celles du JEU par dénominateur
  (confirmé v8 : la couleur relie les deux zones, la matière les distingue ; les
  bandes jaune/vert des gabarits maths&go restent la référence hors Solèy).
  EN RÉSERVE pour le cours de la lentille (forêt, lot suivant) : l'addition en
  bandes — Gwenael a fourni deux dispositions (bout à bout sur une ligne / en L),
  forme académique à trancher alors.
- DÉCISION SUR MAQUETTE (14/08) : l'écriture étagée passe AUSSI sur le plateau —
  maisons (numérateur/barre/dénominateur dans la façade) et étiquettes de rayons
  (chiffres 20 px, un peu plus gros que la maquette, à la demande de Gwenael), ainsi
  que les étiquettes des scènes en cascade des cours. Restent en slash pour l'instant
  (très petits, à juger sur téléphone) : les passes étroites (≤1/2) et les badges des
  soleils spéciaux. Les écritures non fractionnaires (1, 2, 0,5, 25 %…) ne changent
  pas. Toutes les cases d'un monde gardent la même taille (pied « Revoir le cours »
  réservé sur toute la grille).
- AUDIT À FROID DU LAGON (14/08 — Claude joue les 9 niveaux hors production) et
  retouches qui en découlent. Décisions à ne pas re-débattre :
  1. **Le point de cours ne se déroule plus au chronomètre.** Il s'affiche ENTIER
     dès l'ouverture. Raison de Gwenael : « quand je lis un cours dans un cahier,
     le cours ne s'affiche pas petit à petit » ; une minuterie confisque le rythme
     au lecteur (trente élèves lisent à trente vitesses) et se répète à chaque
     relecture. L'ancien déroulé synchronisé était le pansement d'un défaut réglé
     depuis autrement (scène à deux registres) : la règle « à chaque instant
     l'image montre ce que la phrase dit » est désormais tenue par l'ESPACE —
     chaque étage du mur sous son étape — et non par le temps.
     Corollaire gravé : **on anime ce qui bouge dans le jeu** (propagation des
     rayons, cinématique de victoire), **jamais du texte de cours**.
  2. **Le bouton « Revoir » du panneau disparaît** (sans animation il ne fait plus
     rien) ; la relecture passe par « Revoir le cours » sur la carte du niveau.
  3. **« J'ai compris ! » vit à la FIN du cours, et nulle part ailleurs.** Pour
     sortir, l'élève doit être descendu jusqu'en bas — comme un texte qu'on fait
     défiler avant de pouvoir valider. Le bouton n'est PAS épinglé : le pré-requis
     du défilement est VOULU (décision de Gwenael, 14/08, après l'avoir vu en
     ligne). Si un cours tient dans l'écran, le bouton est là tout de suite, et
     c'est très bien. Le vrai défaut d'origine n'était pas la position du bouton
     mais l'absence de tout signal qu'il y avait une suite : le fond ne ferme pas,
     et rien n'indiquait qu'on pouvait faire défiler — c'est la flèche (décision 4)
     qui le règle. Relevé du dépassement avant correction (3 cours × 3 largeurs) :
     de 0 px (le demi sur 402 px) à 384 px (le quart sur 320 px), 221 px pour le
     quart sur 375 px.
  4. **Flèche de défilement** (idée de Gwenael) : une pastille-flèche pulse au bas
     du panneau UNIQUEMENT s'il reste du contenu sous le bord, et s'efface dès
     qu'on arrive en bas ; on peut appuyer dessus pour descendre d'un écran.
  5. **Pointillés de zoom retirés** des scènes de cours : huit traits qui se
     croisaient en frange floue, alors que l'alignement de chaque rayon terminal
     au-dessus de sa case dit déjà le zoom (même raisonnement que le retrait de la
     phrase-pont en v9.1).
  6. **Étiquettes des rayons terminaux décalées hors du rayon** : elles étaient
     traversées par leur propre trait.
  7. **Un « prédire » révèle un NOM, jamais une STRATÉGIE que le niveau suivant
     demande de trouver** — et on ne pose pas dans un cours une question que la
     consigne du niveau suivant pose déjà. Application : le prédire du tiers est
     retiré (« comment faire des quarts sans prisme ÷4 ? » est la consigne même de
     « Les quatre quarts ») ; celui du quart reste, il nomme le 1/8. En code : le
     bouton « À ton avis… » n'existe que si une `reponse` existe.
  8. **Une carte de savoir ne dit que ce que SON cours démontre.** La carte du
     tiers portait « Plus il y a de parts, plus chaque part est petite » — orpheline
     de l'étape C2-2 (comparaison) retirée à la réduction des cours. Retirée ; la
     phrase attend le futur cours de comparaison (pitons).
  9. **Les trois cours ouvrent de la même façon et disent toujours « parts
     égales »** : « Tu as coupé le rayon en N parts égales : chaque part est … ».
     C'est l'élève qui a coupé, pas le prisme (pilier 1 : il a vécu le geste, le
     cours le nomme). Le cours du quart précise « chaque demi », parce que dans
     « Les quatre quarts » la coupe se fait des deux côtés.
  10. **Titres des cours = la série du vocabulaire** : Le demi, Le tiers, Le quart.
      « La moitié de la moitié » décrit exactement le niveau 7 (un seul demi
      recoupé) et pas le niveau 6 (les deux) : la phrase reste le nom de ce niveau
      et l'énoncé de la carte de savoir, elle ne monte pas en titre.
  11. **Consignes** : écriture étagée comme partout ailleurs (c'est la première
      fraction que l'élève lit) ; typographie française avec espace fine insécable
      autour des guillemets et avant `; : ! ?`. « La part perdue » et « La moitié
      de la moitié » redeviennent des questions — la première donnait son idée, la
      seconde redemandait ce que la carte du niveau précédent venait de dire.
  12. **Fraction des maisons** : la barre touchait le dénominateur (les deux se
      fondaient en une tache à taille réelle). Numérateur et barre remontés, barre
      affinée, dénominateur descendu — TAILLE DES CHIFFRES INCHANGÉE : dans une
      maison, sur un téléphone de 375 px, un chiffre fait déjà ~6 px de haut.
      Question ouverte pour l'habillage : faut-il de plus grosses fractions sur les
      maisons, quitte à simplifier porte et fenêtre ?
  13. **Flèches d'orientation des pièces** : elles partaient du centre et le rond
      ÷n cachait tout leur fût (3 unités de trait visibles sur 15) ; la flèche
      d'entrée n'avait même pas de pointe. Elles démarrent maintenant à côté du
      rond, vont plus loin (36→41), pointe raccourcie (12→9), trait épaissi.

- REFONTE DES NIVEAUX (14/08 au soir — critique fondatrice de Gwenael). Constat :
  les 33 idées de la bibliothèque n'avaient JAMAIS touché un niveau (les 60 niveaux
  datent du 11/08, l'étude de l'original est postérieure) ; diagnostic chiffré dans
  DIAGNOSTIC-REFONTE-NIVEAUX.md (31/61 niveaux à boîte exacte, 135/135 fruits
  ramassés par les solutions de référence : le fruit ne demandait jamais un autre
  plan, la couche ☀☀/☀☀☀ tournait à vide) ; destination de chaque idée dans
  AUDIT-33-IDEES.md. Décisions à ne pas re-débattre :
  1. **Les mécaniques de l'original s'intègrent, pas son rythme.** La somme de
     fractions reste tôt (« on n'est pas obligé d'être pareil » — Gwenael) ; ce
     qu'on prend : surplus, pièges numériques, fruits en bifurcation, difficulté
     par l'espace à notion constante.
  2. **Un monde intercalé entre lagon et forêt : « Les champs de canne »** (la
     coupe = la récolte péi ET le geste du prisme). 8 niveaux, dénominateurs
     2-3-4 + le sixième par composition au sommet, AUCUNE notion nouvelle, aucun
     cours. Spec : SPEC-MONDE-CANNE.md.
  3. **Les cibles restent des cases, partout.** Objection de Gwenael sur les
     charrettes : « pourquoi on verrait les rayons de soleil sur des
     charrettes ? » — la métaphore du jeu est « la lumière nourrit les cases ».
     Dans la canne : les boucans des coupeurs. (Re-peau des cibles par monde au
     chantier Habiller — au lagon, des maisons dans l'eau clochent un peu.)
  4. **Fruits à valeur** (idée 12) : mécanique introduite en douceur par « Le
     letchi difficile » (C2, boîte exacte assumée — c'est une découverte de jeu,
     pas de maths, donc sans cours).
  5. **Portes orientées** (décision du tour du propriétaire, 13/08, qui trouve
     ici sa place) : premières portes à « Le tour du champ » (C5), la porte
     impose le tour sans une ligne de texte ; disponibles ensuite pour les mondes
     avancés et les défis.
  6. **Retouche LÉGÈRE du lagon** (5 niveaux d'entraînement ; le tutoriel
     « Premier rayon » et les 3 découvertes ne bougent pas) : surplus, fruits
     déplacés en bifurcation, pièges s3 — gagner reste facile, la couche
     ☀☀/☀☀☀ gagne des dents. Les noms, grilles, cibles et consignes ne changent
     pas (clés de sauvegarde intactes, preuve : verifier-lot-canne.mjs).
  7. **Le contrôle P2 entre dans la batterie** : tout niveau retouché ou nouveau
     porte un `solMin` gagnant qui ne ramasse pas tout. Exceptions documentées :
     « La chambre close » (la porte force le tour, les fruits sont dessus) et
     « Le tour du lagon » (le tour est sa propre récompense).
     *(15/08 : « La chambre close » a été redessinée, son exception est tombée —
     il n'en reste qu'une, « Le tour du lagon ». Voir §5 point 11.)*
  8. **Sauvegardes face aux retouches : pas de renommage.** Les niveaux
     retouchés gardent leur nom (donc un élève qui les avait réussis les garde) ;
     Gwenael dira aux joueurs de supprimer leurs données de site s'ils veulent
     revivre le monde. Rappel technique : la sauvegarde est le localStorage
     `soley-save-v5`, clé par niveau `monde:nom` ; les petits soleils sont
     recalculés à la volée contre la définition courante (un fruit ajouté ou une
     solution raccourcie peut en retirer un sans rejeu) ; les vrais leviers de
     remise à zéro sont le renommage (nouvelle clé — mais le nom est aussi la
     clé de CALC) ou le passage à `soley-save-v6` (remise à zéro générale).
  9. **Outils de migration morts = archives datées, en place.**
     verifier-lot1-comprendre.mjs (mort avec l'insertion de la canne :
     comparaison par index) et verifier-decoupage.mjs (mort avant) restent dans
     tests/soley/ comme preuves datées de leur lot — ni retirés, ni réparés,
     jamais en CI. Chaque nouveau lot apporte SON vérificateur (modèle :
     verifier-lot-canne.mjs).
  10. **L'atelier s'atteint par son URL, et par rien d'autre** (Gwenael, 15/08,
     choix explicite parmi trois options). `soley-atelier.html` n'a aucun lien
     entrant depuis le jeu : ni carte, ni bouton, ni mention. À ne pas confondre
     avec le mode classe `soley.html?classe`, qui ouvre les mondes du JEU —
     l'atelier est une page à part où tout est disponible par nature. L'activité
     élèves « concevez votre niveau » marche dès maintenant en donnant l'adresse
     en classe : le niveau d'un élève ne vit que sur son appareil et la remise
     passe par le bloc exporté. Une entrée visible serait une décision de v2.

- **La difficulté se MESURE** (15/08, lot « niveaux qui résistent »). Cinq grandeurs,
  produites par `solveur-etalon.mjs` (§5 point 13) : `E` espace exploré, `G`
  configurations gagnantes, `R` rang moyen de la première victoire en essais
  aveugles, `prof` plus petit nombre de pièces d'un plan gagnant, et `λ` défini par
  `R = λ^prof` — la largeur du tâtonnement à chaque pose. **Un niveau qui se gagne
  en 2 pièces ou moins est rejeté avant d'être montré** — c'était le défaut mesuré,
  sept des huit niveaux de la canne étaient dans ce cas. *(Le rapport écrit deux fois
  « 3 pièces ou moins » ; cinq des onze niveaux qu'il livre sont pourtant à 3, dont
  « La chambre close ». La règle réellement appliquée est celle-ci, et c'est elle que
  contrôle `verifier-lot-niveaux-durs.mjs`.)* `R` seul ne suffit jamais :
  l'ancienne « Chambre close » affichait `R = 15 929` — le chiffre le plus haut du
  jeu — avec `λ = 2,9`, c'est-à-dire neuf poses dictées l'une après l'autre. Ce
  n'était pas de la recherche, c'était de la longueur. **Allonger un couloir gonfle
  `R` sans faire chercher : toujours lire `prof` et `λ` à côté.** Et `R` reste un
  modèle d'essais aveugles, jamais un chronomètre : il sert à comparer des niveaux
  mesurés pareil, pas à prédire des secondes.
- **La densité n'est PAS le levier** (15/08, mesuré — corrige le diagnostic du 14/08,
  qui visait 40-60 % d'obstacles sur les niveaux tardifs). Un champ tiré au hasard à
  40 % : 60 champs sur 60 n'ont laissé passer aucune chaîne de trois prismes — à
  cette densité le plateau n'oriente plus, il interdit. Un champ dessiné dense à
  couloirs (54 %) reste jouable mais tombe à `λ = 2,4` : il DICTE au lieu de faire
  choisir. Les niveaux qui résistent le mieux tournent entre **14 et 36 %**
  d'obstacles, avec des couloirs longs et une boîte riche. Le vrai levier est la
  **profondeur du plan gagnant minimal** (passer de 2 à 4-5 pièces multiplie `R` par
  `λ²` ou `λ³`) ; la densité sert à une seule chose, mais elle est indispensable :
  **tuer les victoires courtes**, empêcher le plan à 2 pièces d'exister.
- **Le corps du fruit sous le rayon, sa fraction devant** (15/08, demande de Gwenael).
  Les fruits se peignent AVANT les rayons : la lumière passe dessus, et c'est ainsi
  qu'on la voit les cueillir — ça vaut pour les 135 fruits sans badge, dont 31 ont un
  rayon sur leur case. Mais un fruit À VALEUR porte une fraction, et un rayon qui la
  traverse la mange. Le badge est donc sorti dans sa propre passe de `redraw`, après
  les rayons (`fruitValSVG`, classe `g.fruitval`) ; une pièce posée sur la case le
  recouvre toujours, elle occupe la case. **Le défaut dormait depuis la création des
  fruits à valeur** : il n'était jamais apparu parce qu'aucun des 9 fruits à valeur
  n'avait jamais été posé sur un rayon. Le lot du 15/08 en a posé un — le douzième des
  « Deux chemins du sixième » — et l'a révélé. À retenir : **un défaut d'ordre de
  peinture ne se voit que le jour où les données l'exposent** ; c'est la troisième
  fois sur ce jeu (lambrequins, coude des miroirs, ce badge). Contrôle T11, §5 pt 14.
- **On ne dessine plus jamais la solution** (15/08). On fixe l'intention — grille,
  soleils, cases, portes, boîte —, on taille le champ, et c'est le solveur qui trouve
  les plans : `sol` et `solMin` sont des **sorties**, pas des entrées. Preuve à
  rebours que l'ancienne méthode coûtait cher : sur deux niveaux d'avant le lot, le
  solveur a trouvé des victoires PLUS COURTES que le `solMin` qu'on avait dessiné à
  la main (« Le tour du champ » 5 contre 6 pièces, « Quarts en croix » 3 contre 4) —
  on annonçait donc une exigence de maîtrise plus dure qu'elle ne l'était.

### Le sixième entre au lagon (15/08/2026)

1. **« Quarts en croix » est retiré.** Ses cibles étaient exactement celles de
   « La moitié de la moitié » (1/2, 1/4, 1/4) et sa ligne `CALC` était la même au
   caractère près : sur neuf niveaux, le lagon consacrait trois niveaux au quart.
   Le vérificateur du lot le PROUVE au lieu de l'affirmer.
2. **Le trou que ça a révélé** (constat de Gwenael, mesuré ici) : depuis la refonte
   du 15/08, les champs de canne servent 1/6, 1/8, 1/9 et 1/12 sans qu'aucun cours
   ne les ait jamais introduits — et la forêt, APRÈS, les « découvre » encore
   (« Des cases à 1/6 ?! », « Un huitième ?! »). La difficulté avait été mesurée,
   l'ORDRE DES NOTIONS ne l'avait pas été. Le sixième au lagon rend légitimes les
   compositions des mondes suivants.
3. **Deux niveaux, pas un.** Une découverte est PURE (règle du lot 1 « Comprendre ») :
   la remplacer par une découverte aurait rendu le lagon plus facile, l'inverse du
   but. Donc « Les six sixièmes » (découverte, boîte exacte, 1 ÷2 et 2 ÷3) PUIS
   « Le tiers de la moitié » (entraînement taillé au solveur). Le lagon passe à 10
   niveaux, le seuil de la canne à ⌈5×10/8⌉ = 7 (calculé, pas écrit en dur).
4. **Le nom dit le geste**, comme « La moitié de la moitié » : le sixième est le
   TIERS de la moitié. Les deux niveaux se répondent, et la règle générale
   (recouper une part multiplie le dénominateur) se lit dans la comparaison des
   deux cartes de savoir, sans être énoncée abstraitement.
5. **Le cours du sixième ne donne PAS la route `1/3 ÷ 2`** : c'est ce que
   « Les deux chemins du sixième » demande de trouver aux champs de canne. Un
   prédire révèle un NOM, jamais une STRATÉGIE que le jeu demande de chercher
   (règle du 14/08). Il n'a donc pas de prédire du tout : c'est le plus court des
   quatre cours, l'élève sait déjà couper.
6. **Le fruit à valeur reste la découverte de la canne** : le letchi du nouvel
   entraînement est un fruit ordinaire. On ne prend pas à un monde sa seule
   mécanique neuve.
7. **La difficulté est MESURÉE, pas estimée** (`tests/soley/atelier-niveaux.mjs`) :
   « Le tiers de la moitié » demande 4 pièces pour gagner (R = 5 534) et 6 pour
   cueillir le letchi (Rtout = 37 445, 5 plans gagnants sur 35) — la résistance est
   dans la couche ☀☀, pas dans la victoire (idée 32). Le champ n'a été dessiné par
   personne : le solveur a trouvé `sol` et `solMin`.
8. **Les étiquettes des rayons sont CENTRÉES SUR LEUR RAYON**, quelle que soit
   l'orientation — comme dans l'original, que Gwenael a rouvert pour comparer
   (« c'est toujours centré, je pense qu'il va falloir qu'on fasse ça »). Avant, le
   décalage vers le haut faisait deux règles selon l'orientation : posée sur le
   rayon quand il était vertical, flottant au-dessus quand il était horizontal. Ce
   qui rend l'étiquette lisible n'est pas sa place mais son LISERÉ sombre
   (`paint-order:stroke`) — la preuve était déjà à l'écran sur les rayons verticaux.
   Effet de bord heureux : le bug du « 1 » avalé par le soleil disparaît de
   lui-même, puisque le décalage ne ramène plus l'étiquette en arrière vers sa
   source ; un garde-fou la fait tout de même glisser le long du rayon dans les
   4 cas (sur 451) où elle tomberait encore dans un soleil.
   **La couleur est conservée** (l'original écrit en blanc) : chez nous la couleur
   dit le dénominateur réduit, c'est une règle du jeu — l'étiquette de la même
   couleur que son rayon renforce le lien, le blanc le casserait.
   **Écrire la valeur à une taille qui TIENNE dans l'épaisseur a été essayé et
   écarté** : l'épaisseur EST la valeur (entier 24 unités, demi 12, sixième 4 sur
   une case de 100), il ne resterait que 17 px pour l'entier et 8 pour le demi.
   L'étiquette garde donc sa taille pleine et déborde du rayon : c'est ce que fait
   l'original.
9. **Espacement de la fraction** (même œil, même jour) : le dénominateur montait à
   3 unités sous la barre quand le numérateur en avait 5,5 au-dessus, et le halo
   sombre de la barre mangeait le reste. Le dénominateur descend de 10 à 12,5.
   Taille des chiffres inchangée — c'est la même correction que sur les maisons le
   14/08.
10. **Patates de corail au lagon** : les obstacles du lagon ne sont plus des roches
   de basalte. `corailSVG` réutilise EXACTEMENT les trois silhouettes de `rockSVG`
   (la lecture du plateau ne change pas d'un pixel), seule la peau change — sillons
   de corail cerveau, couleur vivante. Même principe que `canneSVG` pour la canne :
   re-peau des obstacles monde par monde (pilier Habiller). Les sept autres mondes
   gardent leur basalte.
11. **Icône du lagon** refaite (bandes sable / eau turquoise / écume de la barrière /
   océan, deux patates de corail) : l'ancienne était un rond turquoise qui, à 46 px,
   ne disait rien. Choix de Gwenael sur planche de quatre pistes.

## 7. Architecture (découpage d'août 2026, statique, sans build, GitHub Pages)

Décision validée : `outils/club_maths/soley.html` RESTE la page publique (URL, sitemap,
catalogue et SEO inchangés) ; elle charge ses modules depuis le sous-dossier `soley/`.
Scripts classiques en fin de body, ordre de chargement OBLIGATOIRE :
```
outils/club_maths/
  soley.html            (coquille : head, écrans, <link> css, 4 <script src>)
  soley/css/soley.css   (tout le style)
  soley/js/levels.js    (fractions + constructeurs de pièces, WORLDS, LV, CALC)
  soley/js/engine.js    (scènes du Coup de pouce, sauvegarde, état, simulate, victoire)
  soley/js/render.js    (SVG : pièces, roches, passes, fruits, cases, soleils, redraw)
  soley/js/ui.js        (écrans, toolbox, boardClick, plein écran, relayout, API SOLEY)
  soley-atelier.html    (L'ATELIER : page CACHÉE de conception, voir plus bas)
  soley/js/atelier.js   (le concepteur de niveaux, chargé après les quatre modules)
tests/soley/            (batterie Playwright + procédure + verifier-decoupage.mjs)
```
Étape 1 faite aux CISEAUX : tranches contiguës du fichier d'origine, seul le bloc
« Victoire » (déclarations pures) a été déplacé en fin d'engine.js ; la preuve
octet par octet est rejouable (`node tests/soley/verifier-decoupage.mjs`).
Écarts assumés vs l'idéal thématique, à résorber SEULEMENT à une éventuelle étape
modules ES : fractions/constructeurs vivent dans levels.js (LV en a besoin à
l'évaluation) ; scènes du Coup de pouce et sauvegarde vivent dans engine.js.
Règle : les 4 fichiers restent des scripts classiques (pas de type=module), chacun
commence par "use strict"; et le partage se fait par la portée globale.

**L'atelier Solèy (15/08/2026) — page cachée de conception.**
`outils/club_maths/soley-atelier.html` est le concepteur de niveaux de Gwenael :
grille réglable, palette de tous les objets, boîte à outils, et le VRAI moteur pour
tester ce qu'on vient de poser. Spec complète : `SPEC-ATELIER-NIVEAUX.md` à la racine.
Trois choses à savoir avant d'y toucher :
1. **Statut caché**, comme le musée `soley-v1.html` : `noindex`, hors `sitemap.xml`,
   hors catalogue, et AUCUN lien depuis le jeu (décision de Gwenael du 15/08 : l'URL
   se donne à la main). Une entrée visible serait une décision de v2.
2. **Le lot est purement additif** : les quatre modules, `soley.html` et `soley.css`
   sont inchangés à l'octet. `atelier.js` est chargé APRÈS eux et se sert de leur
   portée partagée ; il réserve au brouillon une place à la fin de `LV` et appelle
   `openLevel` dessus — seul chemin possible, `cur` étant interne aux modules.
   Preuve rejouable : `node tests/soley/verifier-atelier.mjs`.
3. **Le rayon est visible DÈS l'écran de construction** (décision du 15/08, après
   le premier usage réel). L'atelier fait tourner `simulate()` sur le brouillon,
   plateau nu : seuls le soleil, le décor et les pièces SCELLÉES agissent. Ce
   n'est pas un spoiler — c'est exactement l'image que l'élève voit en ouvrant le
   niveau, avant d'avoir posé quoi que ce soit. Sans elle on règle des fractions
   à l'aveugle. L'écran affiche aussi le diagnostic du jeu (ce que chaque case
   reçoit, les fruits sur le trajet).
4. **Deux réserves d'objets, à ne pas confondre** — c'est LA confusion du premier
   essai : le **décor** (soleil, cases, roches, fruits, passes) est posé sur le
   plateau et l'élève ne peut pas y toucher ; la **boîte** est ce que l'élève
   reçoit à côté du plateau et place lui-même. Une pièce de la boîte peut être
   « scellée » sur le plateau : elle passe alors du côté décor (`fixed`).
5. **La sauvegarde du jeu n'est jamais touchée.** `engine.js` LIT `soley-save-v5` dès
   son chargement (`let save=loadSave();`) : il ne suffit donc pas d'éviter de gagner.
   La page pose, AVANT les quatre `<script>`, un rideau sur `Storage.prototype` —
   `getItem` de cette seule clé renvoie `null`, `setItem` de cette seule clé lève une
   erreur, et `persist()` bascule tout seul sur son repli mémoire déjà présent. Les
   autres clés passent normalement (brouillons de l'atelier, consentement).
   **Si cet ordre de chargement s'inverse un jour, la progression de Gwenael est lue.**

## 8. Feuille de route (idées validées ou proposées, à prioriser avec Gwenael)

- [ ] Écran de démarrage / splash (image d'accueil du jeu).
- [ ] Rétablir l'installation en app (manifest + icônes, en vrais fichiers dans assets/),
      supprimée lors de la mise en ligne.
- [ ] Revoir l'entrée en matière : aides/tutoriel d'abord, puis jouer — on guide peut-être
      trop pendant les niveaux (idée Gwenael à creuser).
- [ ] Musique et sons (discrets, désactivables — WebAudio ou petits fichiers).
- [ ] Fruits péi = monnaie : débloquer des niveaux bonus / défis (comme les pièces de l'original).
- [ ] Animaux péi à sauver dans les cases (paille-en-queue, tortue, tangue…) — flavor de l'original.
- [ ] Succès / badges. Étoiles de maîtrise (réussir avec un minimum de pièces).
- [ ] Amélioration continue des niveaux et de la difficulté (retours élèves).
- [ ] Éditeur de niveaux pour le professeur.
- [ ] Fiche pédagogique par monde (dossier concours).
- [ ] S'inspirer de l'original par captures d'écran (Gwenael capture → Claude lit les images).

## 9. Journal

- 2026-08-11 : sessions Cowork — v1 (12 niveaux) → v6.1 (60 niveaux, 8 mondes, passes,
  soleils multiples, tunnels, pièces scellées, Coup de pouce, plein écran, PWA).
  Mise en ligne initiale via ChatGPT (+ retouches graphiques/mobile côté GPT — à inventorier).
- 2026-08-13 : état des lieux (session Code). Le jeu vit dans `outils/club_maths/soley.html`
  (https://mathsgo.re/outils/club_maths/soley.html) ; en ligne = main à l'octet près.
  Mise en ligne en 6 PR (#337→#343 du 11/08) : 51 puis 60 niveaux ; les 60 `sol` intacts,
  aucun niveau retiré ni renommé ; 2 consignes reformulées (« Premier rayon », « Zigzag
  dans les roches »). Écarts avec ce fichier : « Le prisme scellé » vit dans Les tunnels
  (forêt = 9 niveaux, tunnels = 8, le tableau §3 dit 10/7) ; pas de manifest PWA inline
  (méta iOS seulement) ; plein écran sans « mode focus » (aide honnête par navigateur,
  bouton masqué quand inutile) ; cinématique de victoire réécrite en propagation
  topologique (chaque tronçon attend ses parents) ; logo dédié mathsgo-logo-soley.png ;
  un test node tests/soley-public.test.mjs (11 tests) était déjà en place. Batterie §5
  créée dans tests/soley/ (Playwright Python) et exécutée sur la version déployée ET la
  copie locale : TOUT VERT (T1→T7 + sauvegarde). Découpage §7 : plan proposé, en attente
  de validation.
- 2026-08-13 (session 2) : découpage en modules, comportement STRICTEMENT identique.
  Plan validé par Gwenaël (option A : soley.html reste la page publique ; scripts
  classiques ; ciseaux seulement). soley.html (1911 lignes) → coquille de 119 lignes
  + soley/css/soley.css + soley/js/{levels,engine,render,ui}.js. Double preuve :
  (1) verifier-decoupage.mjs reconstruit l'original octet par octet (sha256 bfd02ad877b0…,
  seule liberté : bloc Victoire déplacé tel quel en fin d'engine.js, déclarations pures) ;
  (2) batterie §5 complète verte sur la version découpée. tests/soley-public.test.mjs
  adapté (il lisait le script inline par regex) + nouveau test de coquille : 12/12.
  Tableau §3 aligné sur le déployé (forêt 9, tunnels 8 dont le prisme scellé) ;
  feuille de route §8 : ajout « rétablir l'installation en app » (demande Gwenaël).
  Fusion et déploiement vérifiés le jour même : 6/6 fichiers servis identiques aux
  octets committés, batterie complète verte sur mathsgo.re.
- 2026-08-13 (session 3) : rangement des documents du projet — DESIGN-SOLEY.md (cahier
  de conception du vrai jeu) et BIBLIOTHEQUE-IDEES.md (analyse des captures de
  l'original, paquets 1-4) ajoutés à la racine, renvoi en tête de ce fichier.
  Version-témoin « musée » publiée : https://mathsgo.re/outils/club_maths/soley-v1.html
  = le dernier mono-fichier d'avant découpage (sha256 bfd02ad877b0…), à l'identique à
  UNE ligne près : meta robots passé à « noindex, follow » (imposé par le générateur
  SEO du dépôt pour toute page hors catalogue — c'est l'esprit demandé : lien direct
  seulement, ni sitemap ni catalogue). Batterie verte sur le musée et sur la version
  actuelle.
- 2026-08-13 (session 4) : CHANTIER 1 DU VRAI JEU — progression verrouillée + étoiles
  (DESIGN-SOLEY.md pilier 2, ordre et seuil validés par Gwenaël). Mondes verrouillés au
  seuil ⌈5/8 du monde précédent⌉ (5,6,5,5,5,4,5), condition + cadenas sur la carte, clic
  fermé = secousse ; étoiles ★/★★/★★★ sur les cartes et à la victoire (winstars), défi de
  maîtrise = taille de `sol`, rappel en rejouant (defiline) ; compteur d'étoiles à
  l'accueil ; mode classe `?classe` avec badge ; sauvegarde enrichie du champ `pieces`
  (additif). API SOLEY étendue (etoiles, parNiveau, seuilMonde, mondeDeverrouille,
  reussisMonde, renderHome) ; batterie §5 enrichie du point 8 (7 contrôles T8) ; test node
  « progression » ajouté (13/13). Vérifié au navigateur en 375 px (arbre d'accessibilité,
  zéro erreur console) — captures d'écran du panneau indisponibles sur ce poste, rendu à
  juger par Gwenaël sur téléphone après fusion.
- 2026-08-13 (session 4 bis) : chantier 1 fusionné et vérifié en ligne (7/7 fichiers,
  batterie 21/21). Réponses de Gwenaël consignées dans DESIGN-SOLEY.md : les « cours
  déjà écrits » = le Coup de pouce actuel (LA base du pilier 1, rien d'autre à
  chercher) ; retouche décidée EN TÊTE de la prochaine passe : les étoiles deviennent
  des petits soleils (cartes, victoire, compteur d'accueil).
- 2026-08-13 (session 5) : passe de retouches visuelles du chantier 1, validée par les
  retours de Gwenaël. Petits soleils partout (soleilIco/soleilRang dans render.js :
  disque doré à rayons plein/vide — cartes, « Lévé ! », compteur « petits soleils »,
  textes, plus aucun caractère ★ dans le code) ; mini-légende des trois soleils sur
  l'écran des niveaux (#stlegende) ; lambrequins v2 à festons et perles pendant devant
  la façade. Décisions du soir au cahier : seuil 5/8 validé définitivement, « maisons
  à porte orientée » = levier de difficulté (pilier Chercher, principe 7), carnet péi
  confirmé chantier 3. levels.js STRICTEMENT intact. Batterie complète verte (dont
  légende et comptages de soleils), node 13/13.
- 2026-08-13 (session 6, nuit) : miroirs à 45° et rayons nets — le miroir affiche sa
  barre-miroir inclinée (double trait + reflet) orientée par son entrée/sortie, le rayon
  s'y réfléchit net à angle droit ; les trajets internes de toutes les pièces sont des
  lignes brisées (les prismes/lentille/loupes l'étaient déjà, les scènes du Coup de pouce
  aussi — seul le miroir avait une courbe). Plus aucune courbe de rayon dans le code
  (garde-fou au test node, géométrie des barres testée pentes ±1). CHANGEMENT ISOLÉ dans
  render.js seul (levels.js/engine.js/ui.js/css/html intacts) : un simple revert ramène
  les tubes courbes si le rendu déplaît au matin. Comparatif avant/après envoyé à Gwenaël.
  Verdict : PR #356 fusionnée et vérifiée en ligne (7/7 fichiers aux octets committés,
  batterie complète verte sur mathsgo.re) ; le rendu net est resté en place.
- 2026-08-14 : CHANTIER 2 « Comprendre », lot 1 (session Code ; cahier des charges
  SPEC-COMPRENDRE-LOT1.md validé ligne par ligne, entré au dépôt). Le lagon passe à
  9 niveaux (61 au total) : « Moitié-moitié » et « Partage en tiers » promus
  niveaux-découverte (consignes-questions de la spec), « Les quatre quarts » créé
  (4 maisons 1/4, prismes ÷2 seulement — sol vérifiée par simulate). Table COURS
  (C1 demi, C2 tiers, C3 quart) ; panneau « point de cours » inséré entre « Lévé ! »
  et la fenêtre des soleils, première victoire seulement : cascade de partage ANIMÉE
  (délais CSS sur les keyframes de la victoire — zéro minuterie à nettoyer, « Revoir »
  reconstruit le panneau), textes au rythme du dessin, prédire à révélation, phrase-carte
  en carte de savoir. Badge découverte + « Revoir le cours » sur les cartes ;
  save.cours additif ; déblocage = seuil + découvertes, condition affichée. Balayage R1
  de la table CALC : 23 lignes corrigées dans 21 entrées (liste exhaustive et preuve
  « 60 niveaux intacts » : node tests/soley/verifier-lot1-comprendre.mjs). Batterie
  T1→T9 complète verte en local (39 contrôles), node 15/15. DESIGN-SOLEY.md :
  chantier lancé au pilier 1 (guidage dégressif), « passe grand écran » retirée
  (→ pilier 4 principe 8), aide des défis ré-ouverte.
  PASSE 2 (même jour, retours de Gwenael sur les captures — addendum v7 de la spec) :
  règle R5 (écritures étagées séparées du texte, fractions empilées inline dans les
  phrases, chaînes coupées avant les =), cours allégés (textes v7, bilan seulement
  dans la carte), C2-2 réservée au futur cours des passes, cases de niveaux uniformes
  (pied « Revoir le cours » réservé). Maquette « étagé sur le plateau ? » fournie à
  Gwenael (décision ouverte). Batterie re-verte (40 contrôles), node 15/15.
  PASSE 3 (même jour) : Gwenael valide la maquette — écriture étagée SUR LE PLATEAU
  (maisonTxtSVG et beamLblSVG dans render.js) ; slash conservé sur les passes
  étroites et les badges de soleils (à juger sur téléphone). Captures au format
  téléphone (390×844, échelle 3) fournies pour prévisualiser la taille réelle.
  PASSE 4 (même jour) : la scène des cours passe des rayons aux BANDES DE FRACTIONS
  (proposition d'une collègue validée par Gwenael — sceneBandes/bandeLbl dans
  engine.js : mur proportionnel, séparations pointillées, fractions étagées noires,
  couleurs par dénominateur, étages animés) ; fractions des maisons grossies à 19 px
  et des rayons à 23 px (tailles à confirmer sur téléphone). Batterie 40/40.
  PASSE 5 (même jour) : bandes COLLÉES + PONT rayon→bande en tête de scène (le soleil
  et son rayon étiqueté 1 se fondent dans la bande qui se lève — keyframes cours-fondu
  et bande-leve) ; mention Refraction ajoutée (courte au pied de page, complète dans le
  panneau « D'où vient Solèy ? », textes exacts) ; réserve « addition en bandes » pour
  le cours de la lentille. Batterie 41 contrôles, node 15/15.
  PASSE 6 (même jour, RETOUCHE-PONT-v8.md entré au dépôt) : le morphing rayon→bande
  est remplacé par la MISE EN CORRESPONDANCE à deux registres — cascade de rayons en
  haut (sceneCours, étiquettes étagées cEtiq, quatre rayons terminaux re-comptés),
  mur de bandes en bas, phrase-pont fixe entre les deux, TOUT synchronisé étape par
  étape avec le texte (tE(i), jamais de rayon entier seul à l'écran). Batterie et
  node re-verts. PR #357 fusionnée (squash 58054d3e) PENDANT le push de cette passe →
  commit v8 reporté proprement (branche fraîche + cherry-pick) en PR #358, fusionnée
  à son tour ; les deux fusions vérifiées en ligne (7/7 fichiers aux octets, batterie
  complète verte sur mathsgo.re).
- 2026-08-14 : PASSE 7 (v9, RETOUCHE-ZOOM-v9.md entré au dépôt) : cascade VERTICALE —
  soleil en haut, rayons terminaux alignés chacun au-dessus de SA case (une seule
  image : le mur est le zoom des rayons), traits pointillés de zoom en option,
  nouvelle phrase-pont, contrôle d'alignement automatique (node + batterie).
  Décision « défis sans aucune aide, jamais bloquants » gravée (DESIGN pilier 2,
  §6, addendum spec).
- 2026-08-14 : v9.1 — la phrase-pont est retirée des trois points de cours (décision
  de Gwenael sur rendu : la scène seule porte le lien) ; tests de présence inversés,
  CSS nettoyée. Tout le reste des cours validé tel quel.
- 2026-08-14 (audit à froid + retouches du lagon, PR #361, fusionnée en d428f5dd) :
  le lot 1 étant en ligne, le lagon a été joué de bout en bout hors production
  (9 niveaux résolus, 3 cours capturés étape par étape, 375/320/430 px). Ce qui
  tenait : déclenchement du cours, synchronisation des deux registres, alignement
  du zoom v9, totaux R1, chaînage tiers → « Les quatre quarts ». Treize décisions
  en sont sorties (détail et raisons : §6, bloc « AUDIT À FROID DU LAGON ») —
  la principale : le point de cours ne se déroule plus au chronomètre, il s'affiche
  entier, et sa sortie est enfin atteignable (elle tombait jusqu'à 384 px sous le bas
  de l'écran). Aussi : bouton « Revoir » du panneau supprimé, pastille-flèche de
  défilement, pointillés de zoom retirés, étiquettes des rayons dégagées de leur
  trait, prédire du tiers supprimé, carte du tiers resserrée, les trois cours ouverts
  de la même façon avec « parts égales », consignes étagées + typographie française,
  deux consignes redevenues des questions, barre de fraction dégagée dans les maisons,
  flèches d'orientation des pièces enfin visibles. `levels.js` : 61 niveaux, mêmes
  noms dans le même ordre, les 61 `sol` intacts, `CALC`/`WORLDS`/`FRW` inchangés —
  seuls 2 `sub`, 5 textes de cours, le `predire` et la carte du tiers diffèrent
  (preuve : verifier-lot1-comprendre.mjs, étendu aux 2 consignes, 38/38).
  Batterie 43/43 en local ET sur le déployé, node 15/15, 7/7 fichiers servis aux
  octets committés (musée compris), zéro erreur console. Trois contrôles T10 ajoutés
  à la batterie ; c'est l'un d'eux qui a débusqué un reste de minuterie (la carte de
  savoir arrivait encore 1,5 s après le reste). Cahiers à jour : §5 point 10, §6,
  DESIGN-SOLEY.md « Retouches du chantier 2 », SPEC §13.
- 2026-08-14 (soir) : REFONTE DES NIVEAUX, lot 1 — le monde des champs de canne.
  Point de départ : critique de Gwenael (« les idées de la bibliothèque, tu ne les
  as jamais intégrées — il faut que mes élèves cherchent »). Diagnostic chiffré au
  moteur (DIAGNOSTIC-REFONTE-NIVEAUX.md), audit des 33 idées (AUDIT-33-IDEES.md),
  spec (SPEC-MONDE-CANNE.md), puis construction prouvée : 2 ajouts moteur
  rétrocompatibles (fruits à valeur, portes orientées — testés dans les deux sens),
  8 niveaux de la canne gagnants avec fruits mérités (solMin au contraire ne
  ramasse pas tout), 5 niveaux du lagon retouchés à l'identique de nom et de
  grille, bibliothèque complétée des idées 21-33, compteurs publics 60→69.
  Batterie node 16/16 (nouveau contrôle « refonte » : P2 + portes + valeurs),
  verifier-lot-canne.mjs vert (61 niveaux en ligne intacts hors champs autorisés),
  0 erreur console, captures 375 px faites. Retours visuels de Gwenael intégrés
  avant l'envoi (v2) : icône du monde, obstacles dessinés en vraies cannes, badge
  des fruits à valeur agrandi, cases à porte clôturées sur trois côtés. Fusionné
  en PR #363 (squash 97923b14) après audit croisé — la session Code a trouvé LE
  manque du patch (l'annuaire généré toutes-les-ressources.html disait encore
  60 niveaux, corrigé en commit séparé d'une ligne) et vérifié levels.js par un
  diff sémantique indépendant, par nom. Rituel post-fusion : 9/9 fichiers servis
  aux octets (musée témoin non modifié), batterie complète verte sur le déployé
  (69 niveaux, 145 fruits, seuils [0,6,5,6,5,5,5,4,5]). Les textes des niveaux
  (sub) de la canne restent à polir avec Gwenael.
- 2026-08-15 : LA SORTIE DU POINT DE COURS VIT À LA FIN. Troisième correctif arrivé
  tout écrit d'ailleurs (prompt et patch dans un seul fichier) ; consigne inchangée :
  l'appliquer, le re-prouver, ouvrir la PR, ne rien réinventer. « J'ai compris ! »
  n'est plus épinglé au bas du panneau — pour sortir, l'élève doit être descendu
  jusqu'en bas, comme un texte qu'on fait défiler avant de pouvoir valider ; si un
  cours tient dans l'écran, le bouton est là tout de suite, et c'est voulu. Le vrai
  défaut d'origine n'était pas la position du bouton mais l'absence de tout signal
  qu'il y avait une suite : c'est la flèche qui le règle, et elle seule reste
  épinglée (repère `#coursbas` de hauteur nulle, donc hors mise en page ; masqué par
  `visibility` et NON `display` — sortir la flèche de la mise en page supprimerait le
  débordement même qui la déclenche). Contrôle T10 retourné : le bouton DOIT être
  hors écran à l'ouverture tant que le panneau déborde, et atteignable une fois
  descendu. Appliqué sur 66078241 sans conflit, zéro écart prouvé (somme de contrôle
  du patch conforme, 58 lignes +/− identiques une à une, mêmes 5 en-têtes
  `diff --git`). Relevé indépendant en worktree détaché, 12 cas (3 cours ×
  320/375/402/430 px) : dépassement 0 px partout AVANT (barre épinglée), 0 à 405 px
  APRÈS selon le débordement, bouton atteignable en bas dans les douze. Cas limite
  consigné : `deborde` se déclenche au-delà de 8 px quand `enbas` tolère 24 px, donc
  entre les deux (Le demi en 402 px, 18 px à défiler) le bouton est déjà visible et
  la flèche absente — l'invariant du T10 n'y vaut pas, mais le test ne l'exerce pas.
  Retouche de Gwenael sur rendu, en second commit de la même PR : le chevron était le
  caractère « ⌄ », qu'une police pose où elle veut (fin, pâle, trop haut dans son
  rond) — il est désormais DESSINÉ ; la pastille descend sous la ligne de calcul ; et
  surtout le voile de bas de panneau s'arrêtait à 14 px du bord visible, si bien que
  le texte ressortait en pleine lumière sous la zone estompée. Cause à retenir : une
  ancre `position:sticky` s'arrête au bord du CONTENU et non du remplissage (12 px de
  padding bas + 2 px de bordure) ; rattrapé en débords négatifs, les coins arrondis
  du panneau écrêtant proprement ce débord. Preuves : node 16/16, batterie 43
  contrôles verts dont les trois T10, zéro erreur console. PR #365 (squash 5ff87749).
  Rituel post-fusion : Vérifications et Publication vertes, 7/7 fichiers servis
  identiques aux octets committés (musée soley-v1 compris), batterie complète verte
  sur mathsgo.re.
- 2026-08-15 (session Code, lot « L'atelier Solèy ») : le concepteur de niveaux
  entre au dépôt — `outils/club_maths/soley-atelier.html` et
  `outils/club_maths/soley/js/atelier.js`, DEUX fichiers nouveaux et rien d'autre
  côté jeu. Page cachée (noindex, hors sitemap, hors catalogue, aucun lien entrant :
  décision d'accès de Gwenael du 15/08). Deux écrans à bascule : Atelier (grille
  5-12 × 4-8, palette des cinq objets avec fiches de réglage, boîte à outils avec
  rotation et pièces scellées, fiche du niveau) et Jouer (le vrai moteur, la vraie
  célébration). Après victoire, un bandeau d'atelier remplace la fenêtre des petits
  soleils et enregistre `sol` (exige TOUS les fruits) et `solMin`. Brouillons
  auto-enregistrés dans `soley-atelier-v1`, export du bloc prêt à coller dans
  `levels.js` (avec refus si la solution manque et avertissements), import, et
  chargement de n'importe lequel des 69 niveaux pour les retoucher.
  **Deux trouvailles de construction, gravées §7 :** `engine.js` lit la sauvegarde
  au CHARGEMENT du module (d'où le rideau sur `Storage.prototype` posé avant les
  quatre `<script>`), et `parNiveau` lit `LV[i].sol.length` pendant la victoire —
  un brouillon doit donc toujours porter un tableau `sol`, jamais `null`.
  Preuves : batterie de l'atelier 18/18, `verifier-atelier.mjs` 21/21 (les six
  fichiers du jeu intacts à l'octet), batterie du jeu 43 contrôles verte et node
  16/16 inchangés, aller-retour « Le tour du champ » à zéro écart sur 15 champs,
  bloc exporté rejoué dans le vrai moteur. Spec : `SPEC-ATELIER-NIVEAUX.md`.
- 2026-08-15 (lot « des niveaux qui résistent », essai mené par Fable, appliqué et
  contre-audité en session Code) : **la difficulté du jeu est mesurée pour la
  première fois.** Point de départ, le verdict de Gwenael après avoir joué la canne
  en ligne — « jamais plus de trente secondes pour trouver quoi que ce soit » — et
  « les retouches du lagon sont peu visibles ». Premier livrable AVANT tout niveau :
  `tests/soley/solveur-etalon.mjs`, force brute sur l'espace éclairé, rejouant
  `simulate()` du vrai moteur. L'étalonnage a confirmé le ressenti et l'a chiffré :
  médiane de `R` = 45 sur les 8 niveaux de la canne, **sept sur huit gagnés en 1 ou
  2 pièces** ; les deux seuls qui montaient le faisaient par la LONGUEUR (`λ` = 1,8
  et 2,9), pas par la recherche. **11 niveaux redessinés** — 7 à la canne, 4 au
  lagon. Médiane des 7 niveaux de canne : `R` 45 → 1 755 (× 39), `Rtout` 424 →
  18 731 (× 44), profondeur du plan minimal 2 → 4. Dénominateurs nouveaux, tous par
  COMPOSITION de partages (décision de Gwenael du 15/08) : 1/6, 1/8, 1/9, 1/12 ;
  aucune lentille, aucune addition, et la loupe ×2 qui traînait dans la boîte du
  « Grand tri » — une notion du volcan — a été retirée. Trois décisions gravées §6 :
  la difficulté se mesure, la densité n'est pas le levier, on ne dessine plus jamais
  la solution. Le contrôle P2 est RESSERRÉ : « La chambre close » perd son exception,
  il ne reste que « Le tour du lagon ». Fruits 145 → 142 : ils ont été DÉPLACÉS sur
  des cases exigeantes, pas multipliés — un fruit rare vaut mieux que deux gratuits.
  Restés intacts sur décision : « Le letchi difficile » (découverte des fruits à
  valeur, elle doit rester douce), les 3 découvertes du lagon, « Premier rayon », et
  **« Le tour du lagon »** — l'essai sur ce dernier a été ANNULÉ par Fable lui-même,
  sa version gagnait en profondeur mais faisait régresser la couche fruits
  (`Rtout` 21 282 → 1 776 : ses 25 plans gagnants passaient par les mêmes cases,
  impossible d'y poser un fruit rare).
  **Contre-audit indépendant (les outils du lot ne jugent pas le lot) :** diff
  sémantique par clé `monde:nom` et jamais par index — 69 niveaux, mêmes noms dans
  le même ordre (aucune clé de sauvegarde ne bouge), `CALC`/`COURS`/`WORLDS`/`FRW`
  strictement intactes, exactement les 11 niveaux annoncés modifiés et rien d'autre,
  58 `sol` inchangées. Outil versé au dépôt : `verifier-lot-niveaux-durs.mjs`.
  Zéro écart entre le patch reçu et le diff produit (1197 lignes +/− identiques une
  à une, 8 en-têtes `diff --git` identiques). Preuves : node 16/16, batterie du jeu
  43 contrôles verte, batterie de l'atelier 24 contrôles verte (A10 : les 69 niveaux
  ressortent encore identiques de l'atelier). **Et les mesures se rejouent** : le
  solveur relancé ici retombe sur les chiffres du rapport (La croisée : E = 302 775,
  G = 39, dont 3 qui ramassent le letchi ½ ; La chambre close : `R` = 1 754,5 pour
  1 755 annoncé, λ = 12,3 ; Zigzag : 174,6 pour 175). Encore fallait-il qu'il se
  lance : sa garde de module principal comparait `import.meta.url` à
  `file://` + `process.argv[1]`, ce qui n'est jamais vrai sur ce poste — la commande
  documentée sortait EN SILENCE, sans une ligne. Corrigé par `pathToFileURL`, dans un
  commit à part (seul écart au patch reçu).
  **Quatre écarts relevés au passage, ni cachés ni réparés en douce** (le rapport est
  entré au dépôt tel quel, les corrections vivent dans les cahiers) :
  (1) le champ `solB` de « Les deux chemins du sixième » disparaît — le niveau a
  changé de nature, une seule des deux routes mène désormais au douzième ; la ligne
  de `SPEC-MONDE-CANNE.md` qui l'annonçait est corrigée, et le contrôle qui le
  vérifiait est écrit `if (l.solB)`, donc il se saute sans rien dire.
  (2) Le rapport donne pour deux niveaux une profondeur « avant » plus courte que le
  `solMin` du dépôt : le solveur a trouvé mieux que ce qu'on avait dessiné à la main
  — c'est un argument POUR la décision « on ne dessine plus » (§6), pas contre.
  (3) Le tableau du rapport donne 14 % d'obstacles à « Les deux chemins du sixième » :
  c'est son NOMBRE de touffes, pas son pourcentage (14 sur 63 cases = 22 %) ; la
  fourchette « 14 à 36 % » se lit donc 13 à 36 %.
  (4) Le rapport écrit deux fois qu'un niveau gagné « en 3 pièces ou moins » est
  rejeté, alors que cinq des onze niveaux livrés sont à 3 — dont « La chambre close ».
  La règle réellement appliquée, et la seule cohérente avec le défaut de départ
  (sept niveaux sur huit gagnés en 1 ou 2 pièces), est **2 pièces ou moins**.
  **Rappel de méthode confirmé une quatrième fois : un chiffre annoncé dans un
  document reçu n'est bon qu'en ordre de grandeur — toujours remesurer.**
  Ce que le lot assume comme ouvert : les consignes (`sub`) sont des premiers jets à
  polir avec Gwenael, deux espaces de recherche restent bornés par le budget de nœuds
  (leurs `R` sont des planchers), et **rien n'a été testé sur des élèves** — toutes
  ces mesures sont des mesures de machine, la seule preuve qui compte reste une classe.
  **Un défaut de rendu attrapé à la relecture des captures, et corrigé à la demande
  de Gwenael :** le douzième des « Deux chemins du sixième » est le premier fruit à
  valeur du jeu posé sur un rayon, et le rayon lui mangeait son dénominateur. Sa
  question — « comment c'est fait pour les autres ? pourquoi uniquement ici ? » — a
  été traitée comme un contrôle : sur les 142 fruits, 7 seulement portent un badge et
  31 ont un rayon sur leur case, mais l'intersection des deux était VIDE jusqu'à ce
  lot. Le défaut dormait donc depuis la création des fruits à valeur. Correctif : le
  badge sort dans sa propre passe de `redraw`, après les rayons (décision §6) ;
  `atelier.js` appelait `fruitSVG` avec l'argument `val` et a été rapproché du jeu au
  même endroit. Contrôle T11 ajouté et **vérifié dans les deux sens** (rouge sur
  l'ancien rendu, vert sur le correctif). Note : `verifier-atelier.mjs` échoue
  désormais légitimement — son invariant est « le jeu ne bouge pas d'un octet depuis
  b05205ce », et ce lot touche `levels.js` puis `render.js` ; il rejoint les archives
  datées (§6 pt 9), comme `verifier-lot1-comprendre.mjs` avant lui.
  Rapport complet : `RAPPORT-ESSAI-NIVEAUX-DURS.md`.
  **PR #369, fusionnée par Gwenael (squash `2efd8ad1`) et VÉRIFIÉE EN LIGNE :**
  Vérifications et Publication vertes, **9/9 fichiers servis identiques aux octets
  d'`origin/main`** (musée `soley-v1.html` compris, en témoin non modifié), **batterie
  complète du jeu — 44 contrôles avec le nouveau T11 — verte sur mathsgo.re**, batterie
  de l'atelier 24 contrôles verte sur mathsgo.re, `verifier-lot-niveaux-durs.mjs`
  TOUT VERT contre le `main` fusionné, node 16/16. Worktree et branches locale et
  distante nettoyés. Le jeu en ligne est à 69 niveaux et 9 mondes, inchangé — ce lot
  ne change aucun compteur public, donc rien à régénérer côté catalogue (vérifié :
  `catalogue-refonte-data.js` et `toutes-les-ressources.html` ne bougent pas, c'est
  l'oubli qui avait fait rougir la CI au lot canne).
  **La branche a dû être REBASÉE en cours de route** (`4e430b1b`) : #368 et #370 ont
  été fusionnées pendant la session. Heureux hasard — depuis #368 l'atelier dessine
  les rayons, il souffrait donc exactement du même défaut de badge, corrigé au même
  endroit. **Réflexe à garder quand une session dure : `git fetch` + `gh pr view
  --json state,mergeable` régulièrement, Gwenael fusionne en parallèle.** La preuve de
  zéro écart du premier commit a été REJOUÉE après rebase (`levels.js` est le même
  blob dans `0c276e3b` et `4e430b1b`).
- **15/08 (soir) — « le sixième au lagon » (conception Cowork).** Constat de Gwenael
  en jouant : le niveau 8 du lagon ressemble au 7. Vérifié : mêmes cibles, même ligne
  `CALC`. Constat plus grave trouvé au passage : la canne dépense 1/6, 1/8, 1/9, 1/12
  sans cours, et la forêt les « introduit » après. Lot : « Quarts en croix » retiré,
  « Les six sixièmes » (découverte + cours) et « Le tiers de la moitié » (entraînement
  taillé au solveur) ajoutés ; icône du lagon refaite ; étiquettes des rayons CENTRÉES
  SUR LEUR RAYON quelle que soit l'orientation, comme dans l'original (§6, décision 8) —
  le « 1 » avalé par le soleil disparaît du même coup, un garde-fou traitant les 4 cas
  sur 451 où l'étiquette tomberait encore dans un disque (mesuré sur les 70 solutions).
  Compteurs 69 → 70 partout (meta, catalogue, vignette, annuaire régénéré — leçon du
  lot canne). Preuves : `node --test` 16/16, 9 validateurs CI verts, batterie
  Playwright complète verte (dont T8 seuil 7 et « dont ses 4 découvertes »),
  `tests/soley/verifier-lot-sixieme.mjs` 37/37. `verifier-lot-niveaux-durs.mjs`
  échoue désormais LÉGITIMEMENT (il gardait « Quarts en croix ») : en-tête d'archive
  datée ajoutée, conformément à la décision 9 du lot canne.
  **Reste à l'œil de Gwenael** : la chaîne des six sixièmes tient sur deux lignes au
  cours (la plus longue du jeu) ; les consignes « Des cases à 1/6 ?! » / « Un
  huitième ?! » de la forêt sont à réécrire — elles sont fausses depuis la refonte
  du 15/08, PAS depuis ce lot. **Ajouts du soir** : patates de corail au lagon, et
  « Le tour du lagon » remonté en 4 (contenu intact, seule la position change), après
  mesure de tout le lagon au solveur — le monde finissait 10 fois plus facile qu'il
  ne montait.
- **15/08 (nuit) — deux finitions trouvées EN JOUANT.** (1) La perle au bout de
  chaque feston des lambrequins est retirée : à la taille d'une maison, le petit
  rond se lit comme une salissure sous l'arrondi et non comme une breloque
  (« ça fait un peu bizarre ») — les arrondis seuls disent la dentelle. (2) **Un
  progrès ne se réenregistrait pas** : Gwenael gagne « sans le fruit », reste sur
  le niveau, pose les pièces qui le cueillent — et rien n'est recompté. Cause,
  reproduite avant d'être corrigée : `redraw()` ne relançait la victoire que si
  `overlayShown` était retombé à `false`, ce qui n'arrivait qu'en RETIRANT une
  pièce (`ui.js`), à l'ouverture d'un niveau ou à la remise à zéro. **Son
  hypothèse — « j'aurais dû enlever une pièce et refaire valider » — était
  exactement la règle du code.** Sa décision sur le remède : un PROGRÈS relance la
  victoire depuis le début, « Lévé ! » compris ; une pose qui n'améliore rien ne
  relance rien. La condition compare donc le résultat courant au meilleur
  enregistré (plus de fruits, ou moins de pièces). Contrôle T12, vérifié dans les
  deux sens. **Mesure faite au passage, qui ferme un débat : aucun verrou du jeu
  n'oblige à battre un niveau au-delà de 2 383 essais** (le plus dur imposé est
  « Trois quarts », pour ouvrir le volcan ; quatre verrous sur huit restent sous
  650). La règle des ⌈5/8⌉ laisse donc toujours contourner les monstres — un élève
  ne peut pas rester bloqué, et l'idée de « mondes-école toujours ouverts » perd
  sa justification d'accès.
- **15/08 (nuit) — la lentille à moitié servie redit où l'on va.** Troisième défaut
  vu par Gwenael en jouant : dès qu'un rayon entre dans la lentille, son « + »
  s'allume et **les deux autres flèches disparaissent** — on ne sait plus par où le
  second rayon doit arriver, ni par où la somme sortira. Cause : `pieceFlow` ne
  dessine que les rayons RÉELS, et la lentille est la seule pièce qui ne produit
  rien tant qu'elle n'a pas ses deux entrées (les autres rendent toutes leurs
  sorties dès le premier rayon). Correctif : quand elle est incomplète, on
  redessine en gris d'attente les flèches des entrées vides et celle de la sortie,
  exactement celles de la pièce au repos.
- **15/08 (nuit) — la forêt devient un monde-école (lot 1).** Trois défauts, tous
  trouvés par Gwenael en jouant puis chiffrés. (1) **« Recoller les morceaux », le
  niveau qui introduit la lentille, se gagnait SANS elle** — 196 façons, en 3 pièces
  (sa capture : la maison servie par un rayon entier qui contourne les roches, 1
  fruit sur 2). Rogner la boîte ne pouvait pas le sauver : les 3 miroirs de
  l'échappatoire sont inclus dans les 6 pièces de la solution. Redessiner le plateau
  non plus : **sa case demande 1/1, et le soleil vaut 1** — voir la règle du §5
  point 16. Il reste donc l'accueil du monde, mais **cesse d'être une découverte**.
  (2) **La forêt donnait le cas DUR avant le cas SIMPLE** : « Trois quarts »
  (dénominateurs différents) était au niveau 2, « Deux tiers » (même dénominateur)
  au 3. Les deux sont échangés ; ce sont désormais les deux découvertes du monde,
  toutes deux FORCÉES (0 victoire sans lentille sur 816 et 12 778 configurations).
  (3) **La mise au même dénominateur n'était enseignée nulle part**, alors que la
  forêt l'exigeait dès son deuxième niveau. Deux points de cours nouveaux : `somme`
  et `denominateur`.
  **Scène de cours d'un genre NOUVEAU (`sceneSomme`) : partager DESCEND de l'entier
  vers les morceaux, additionner REMONTE des morceaux vers leur somme — ce n'est pas
  une répétition du cours du demi, c'est son inverse, et ça ne peut pas se lire dans
  le même sens (correction de Gwenael).** En bas, les parts bout à bout, puis la même
  longueur recoupée au dénominateur commun, puis l'entier en repère : c'est
  l'ÉGALITÉ DES DEUX PREMIÈRES LONGUEURS qui démontre. Disposition choisie par lui
  sur deux dessins ; celle « en L » a été écartée (l'œil y lit une aire, pas une
  longueur). **L'écriture 2/4 ne peut PAS se montrer avec des rayons — le moteur
  réduit tout seul, un rayon « 2/4 » n'existe pas — elle vit donc uniquement sur les
  bandes.**
  **Le CHEMIN DE L'ÉCOLE, règle de Gwenael** : réussir un monde-école ouvre le champ
  qui suit ET l'école suivante. Un monde a une ou deux portes (`portesDeMonde`), la
  seconde n'existant que si son prédécesseur est un champ ; la carte du monde fermé
  annonce les deux. Les six écoles sont marquées `ecole:true` dans `WORLDS`.
  **Ce n'est pas un déblocage de secours** : mesuré le même jour, aucun verrou
  n'oblige à battre un niveau au-delà de 2 383 essais (le plus dur imposé est
  « Trois quarts », pour ouvrir le volcan). C'est un confort de parcours.
  Consigne des « Huitièmes » réécrite (elle s'étonnait d'un 1/8 que la canne sert
  déjà). Preuves : node 16/16, batterie 46 contrôles (T13 nouveau), `notion-forcee`
  vert sur les deux découvertes. **Restent dehors, exprès** : « Les sixièmes »
  (14 essais, jumeau de « Quarts en croix ») à retirer et remplacer, les deux
  niveaux immesurables, les cours de 1/8, 1/9, 1/12, la peau du monde (kiosques et
  fougères), et la difficulté des fruits — aucun niveau de la forêt n'a de `solMin`.
- **16/08 — la forêt prend sa peau : kiosques et fougères.** Troisième re-peau d'un
  monde. **Les obstacles sont de vraies fougères ARBORESCENTES** : un stipe fibreux
  marqué des cicatrices des frondes tombées, et une couronne de neuf frondes posée à
  son sommet, dont les folioles balaient vers la pointe — c'est ce qui distingue une
  fronde d'un peigne. Premier essai rejeté par Gwenael (« ça ressemble à des
  buissons ») : il reprenait la silhouette de galet de `ROCHES`, comme le corail du
  lagon. **Leçon : la re-peau à silhouette identique ne marche que si la chose
  ressemble déjà à un galet** — le corail oui, la canne et la fougère non, elles ont
  leur port propre. **Et le fruit de la forêt devient le GOYAVIER** — « des ananas dans la forêt, ce
  n'est pas cohérent » : c'est le goyavier de Chine qu'on va cueillir dans les bois
  des Hauts. Nouveau type dans `FRUITS`, `FRW.foret` et `FRNAME`. Les cases
  deviennent des kiosques de pique-nique des Hauts : toit à quatre pentes en
  bardeaux, poteaux de bois, pas de murs, pas de lambrequins — mais la MÊME planche
  claire derrière la fraction, donc le même contraste, et la clôture des portes
  inchangée. La barre de plancher a été descendue sous la planche : à 76 elle
  coupait le dénominateur (règle : la peau ne touche jamais à ce qui se LIT).
  **Deux dettes réglées au passage : la clôture des portes sort en `porteSVG`** (elle
  est du langage, elle doit être identique quelle que soit la peau) **et le choix de
  la peau des obstacles vit désormais dans UNE table, `obstacleSVG(w)`, où le jeu ET
  l'atelier puisent** — l'éditeur dessinait les patates de corail du lagon en basalte
  depuis leur création, faute d'avoir été mis à jour en même temps. `targetSVG` prend
  un cinquième argument `monde` ; les quatre appels de `atelier.js` ont été relus un
  par un (leçon du badge de fruit : une fonction partagée se casse en silence).
- **16/08 — le vocabulaire suit la peau.** Défaut trouvé par Gwenael dès la fusion de
  la peau : « pour la forêt, ce n'est pas les roches, c'est les fougères ». Relevé
  systématique des trois mondes re-peaus : **six occurrences**, dont deux dataient du
  lot corail et n'avaient jamais été vues. Les quatre CONSIGNES sont corrigées (elles
  n'ont aucun effet sur les sauvegardes) : « roches volcaniques » → patates de corail
  au lagon, « roches » → fougères dans les trois niveaux de la forêt. **Les deux NOMS
  de niveaux — « Zigzag dans les roches » (lagon) et « Le champ de roches » (forêt) —
  sont laissés tels quels : la clé de sauvegarde est `monde:nom`, un renommage rend
  la progression de l'élève inerte (§6, décision 8). C'est un arbitrage pour Gwenael,
  pas une correction.** L'atelier suit aussi : les objets s'appellent désormais
  « Patate de corail », « Carreau de cannes », « Fougère » ou « Roche » selon le monde
  du brouillon, et la case y devient « Kiosque » à la forêt (`nomObjet`). **RÈGLE À
  GRAVER : quand on repeint un monde, on relit ses TEXTES dans la foulée — le décor
  et les mots doivent nommer la même chose, sinon le jeu se contredit tout seul.**
- **16/08 — le partage s'enseigne UNE fois, au lagon (lot A).** L'audit d'organisation
  (#385) avait montré le désordre : le lagon enseigne le sixième au 9ᵉ niveau, la canne
  le fait chercher au 18ᵉ, et la forêt le redécouvrait au 22ᵉ — « Des cases à 1/6 ?! » —
  en deux pièces et une seule pose gagnante. Et pendant ce temps 1/8, 1/9 et 1/12,
  servis dès le 16ᵉ, n'avaient **aucun cours**. Le lot ferme les deux trous d'un coup :
  **« Les sixièmes » est retiré** de la forêt (son geste 1/3 ÷ 2 reste joué au « Grand
  réseau » et à « L'entrée du cirque »), et **« La moitié du quart » ferme le lagon**
  avec le point de cours **`recouper`**. Le total reste à **70** : aucun compteur public
  à régénérer. Le niveau a été TAILLÉ puis mesuré, aucune solution dessinée d'abord —
  R = 75, profondeur 3, ingagnable sans ÷2, pas de fruit ni de `solMin` comme les quatre
  autres découvertes. **Le cours est en BANDES SEULES, sans rayons** (`scene.murs`,
  demande de Gwenael) : la cascade de rayons de `sceneCours` ne sait dessiner que deux
  étages, et surtout le rayon sert à jouer quand la bande sert à comprendre. **TROIS
  murs**, et dans chacun une ligne naît de celle qui la surplombe : l'entier coupé
  jusqu'au huitième, puis les neuvièmes sous les tiers, puis les douzièmes sous les
  quarts. **Deux défauts trouvés par Gwenael sur captures**, tous deux devenus des
  contrôles du vérificateur. (1) Un premier jet empilait 1/8, 1/9 et 1/12 dans le même
  mur, ce qui faisait naître les neuvièmes des huitièmes → **dans un mur, une ligne est
  un découpage de celle du dessus.** (2) Le panneau posait les trois murs d'affilée puis
  toutes les explications → **chaque mur est suivi de SES phrases**, sans quoi l'élève
  doit remonter chercher de quelle image parle le texte qu'il lit (`construireCours`
  alterne image et étapes ; chaque mur porte `etapes`, le nombre d'étapes qui le
  suivent, et son `alt`). **RÈGLE À GRAVER : une scène de cours porte une grammaire
  implicite — dès qu'on la découvre, on l'écrit dans le vérificateur, sinon elle se
  reperd.** Le vocabulaire mathématique est dit au passage : « le nombre du bas — le
  dénominateur ». `bandeLbl` prend une taille optionnelle — à douze cases de 25 px,
  « 12 » en 15 px touchait ses voisines.
- (à compléter à chaque session)
