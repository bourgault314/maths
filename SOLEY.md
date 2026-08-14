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
| Le lagon | 6e | découverte, partage égal — dont 3 niveaux-découverte (demi, tiers, quart) | 9 |
| La forêt | 5e | additions (lentille), équiv., 1/8, 1/12 | 9 |
| Le volcan | 4e | loupes ×, fractions > 1, 1/9 | 7 |
| Les pitons | 5e-4e | équivalences, comparaisons (passes) | 7 |
| Les soleils | 4e | soleils multiples / fractionnaires / valeur 2 | 8 |
| Le marché | 5e-3e | 0,5 ; 25 % ; 100 % (écritures) | 6 |
| Les tunnels | 6e-4e | labyrinthes denses (41-64 % de roches), esprit de l'original | 8 (dont « Le prisme scellé » et « La galerie scellée ») |
| Mafate | Expert | tout combiné, 2 soleils, grands plateaux | 7 (dont « Les verrous du cirque ») |

Total : 61 niveaux, chacun avec une solution de référence `sol` vérifiée automatiquement.
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
etoiles(i), parNiveau(i), seuilMonde(wi), mondeDeverrouille(wid), reussisMonde(wid), renderHome}`.
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
   rejeu), cascade C3 à quatre rayons terminaux, prédire à révélation, « Revoir » et
   « Revoir le cours », vieille sauvegarde sans `cours` intacte, stabilité 320/402 px.

## 6. Historique des décisions (ne pas re-débattre sans raison)

- Nom « Solèy » validé. Pièce « Lentille + » validée (PAS « Recolleur »).
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
  DÉCISION SUR MAQUETTE (14/08) : l'écriture étagée passe AUSSI sur le plateau —
  maisons (numérateur/barre/dénominateur dans la façade) et étiquettes de rayons
  (chiffres 20 px, un peu plus gros que la maquette, à la demande de Gwenael), ainsi
  que les étiquettes des scènes en cascade des cours. Restent en slash pour l'instant
  (très petits, à juger sur téléphone) : les passes étroites (≤1/2) et les badges des
  soleils spéciaux. Les écritures non fractionnaires (1, 2, 0,5, 25 %…) ne changent
  pas. Toutes les cases d'un monde gardent la même taille (pied « Revoir le cours »
  réservé sur toute la grille).

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
  (maisonTxtSVG et beamLblSVG dans render.js, cLblFrac pour les cascades des cours ;
  chiffres des rayons à 20 px « un peu plus gros ») ; slash conservé sur les passes
  étroites et les badges de soleils (à juger sur téléphone). Captures au format
  téléphone (390×844, échelle 3) fournies pour prévisualiser la taille réelle.
- (à compléter à chaque session)
