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
| Les champs de canne | 6e | partage JOUÉ à fond : surplus, pièges, fruits à valeur, portes orientées (refonte 08/2026) — **aucune découverte** (le monde reste contournable), mais 2 points de cours `cours` (neuvième, douzième) et 1 explication d'entrée `intro` (les portes) | 9 |
| Les pitons | 6e-5e | équivalences, comparaisons — la 1re passe du jeu s'explique ici (« Quel rayon passe ? ») ; 3 points de cours `cours` : équivalence, écritures, comparaison ; étoffé au lot pitons-1 (« Le sentier des écritures », « La crête des passes », fruits qui se méritent) ; **en monde 3 depuis le lot pitons-2** (17/08) | 7 |
| La forêt | 5e | additions (lentille), équivalences — dont 2 niveaux-découverte (somme, même dénominateur) ; depuis le lot pitons-2 elle accueille « La passe étroite » (le 1er niveau du jeu où la lentille est OBLIGATOIRE) et finit sur « Le tamis », son plus dur | 10 |
| Le volcan | 4e | loupes ×, fractions > 1, 1/9 | 7 |
| Les soleils | 4e | soleils multiples / fractionnaires / valeur 2 | 8 |
| Le marché | 5e-3e | 0,5 ; 25 % ; 100 % (écritures) | 6 |
| Les tunnels | 6e-4e | labyrinthes denses (41-64 % de roches), esprit de l'original | 8 (dont « Le prisme scellé » et « La galerie scellée ») |
| Mafate | Expert | tout combiné, 2 soleils, grands plateaux | 7 (dont « Les verrous du cirque ») |

Total : 73 niveaux, chacun avec une solution de référence `sol` vérifiée automatiquement.
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
- **Une règle de PLATEAU s'explique AVANT de jouer, une notion de MATHS s'enseigne
  après la victoire** (16/08). Trois champs, trois métiers : `dec` enseigne ET jalonne
  (il verrouille le monde suivant) ; `cours` enseigne seulement, après la victoire ;
  `intro` explique **à l'arrivée sur le niveau**, avant la première pièce. Demande de
  Gwenael sur les portes : « ce ne serait pas vraiment un cours, ce serait une
  explication au début » — et c'est juste : un élève qui découvre une contrainte de
  plateau APRÈS avoir gagné a passé son temps à ne pas comprendre pourquoi son rayon
  mourait. Le bandeau du panneau le dit : « Avant de jouer », pas « Point de cours ».
- **Le mot juste d'abord, la formule d'enfant entre parenthèses** (16/08, règle de
  Gwenael : « il faut rester propre mathématiquement »). On écrit **le dénominateur
  (le nombre du bas)**, jamais l'inverse : mettre l'approximation devant reléguerait
  le mot que l'élève doit finir par employer. Vaut pour tous les cours, présents et à
  venir.
- **Les deux gestes coexistent : un clic sélectionne, un glissement pose** (16/08).
  Observation d'élèves, la première du projet : les petits cousins de Gwenael, sur
  téléphone, ont tous voulu TIRER la pièce. C'est le MOUVEMENT qui départage les deux
  gestes — sous le seuil, l'ancien parcours est intact à la ligne près.
- **Une consigne décrit le PLATEAU, pas l'intention** (17/08, lot H). Un texte de
  niveau n'a le droit d'annoncer que ce qu'un contrôle peut vérifier dans ses données :
  le compte réel des cases et leurs valeurs, le contenu réel de la boîte (pas celui de
  la solution), ce qui est **scellé** contre ce qui est **à poser**. Six consignes et
  un indice s'étaient décalés de leur plateau sans qu'une seule ligne de code change —
  c'est le niveau qui avait bougé sous le texte. **Corollaire : le mot « Nouveau » est
  une promesse datée.** Il devient faux dès qu'un monde s'intercale (« Nouveau : DEUX
  soleils » au 45 a été démenti par la canne, qui en montre deux au 16). Tout lot qui
  déplace des niveaux doit relire les « Nouveau » qui suivent.
- **Un vérificateur de lot est une ARCHIVE : on le laisse mourir, on ne le répare
  pas** (17/08, lot H). Les `tests/soley/verifier-*.mjs` comparent le dépôt à une
  référence git datée ; ils échouent légitimement dès que la suite avance, et aucun
  n'est en CI. Les corriger pour qu'ils repassent au vert leur ferait raconter un lot
  qui n'a pas eu lieu. **On leur ajoute une bannière `ARCHIVE DATÉE` disant depuis
  quand et pourquoi ils échouent — mesuré, pas supposé.** Ce qui doit rester vrai
  vit dans un vrai test (`*.test.mjs`, ramassé par `node --test`), pas dans un
  vérificateur. Même famille que « une bible qui ment est pire qu'une bible
  incomplète » (#408).
- **Un geste neuf réutilise le discriminateur qui existe déjà** (17/08). Quand un
  geste nouveau entre en concurrence avec un geste installé sur la même cible, ne pas
  inventer un troisième vocabulaire : chercher ce qui tranche DÉJÀ dans le code. Sur
  le plateau, le clic voulait dire « enlève-la » ; déplacer une pièce posée n'a donc
  rien inventé, c'est **le même seuil de 10 px** que boîte→plateau. Un seul seuil pour
  tous les gestes du jeu, donc rien de neuf à apprendre pour l'élève. Corollaire de
  sûreté : **un glissement raté ne détruit jamais** — la pièce revient d'où elle vient,
  puisque le retrait a déjà son propre geste.
- **Un module partagé se vérifie page par page** (17/08). `ui.js`, `engine.js` et
  `render.js` servent le jeu ET l'atelier. Pour tout ajout, lister les PAGES qui
  chargent le module, puis se demander **quels ID de la nouveauté manquent à
  chacune** : le lot G avait posé son `<div id="cible">` dans `soley.html` seulement,
  et l'atelier a glissé pendant un lot sans jamais allumer sa case — sans erreur, sans
  test rouge, sans le moindre symptôme. C'est la variante « élément absent » du piège
  d'ID déjà connu (le dégradé `sungrad` dupliqué).
- **Une image qui démontre se MESURE, et le contrôle vit en CI** (17/08). La règle du
  lot E était juste mais son outil ne la tenait pas : il recalculait la formule des
  données au lieu d'appeler le dessinateur, et il était daté donc jamais lancé. Le
  test « les cours en bandes démontrent vraiment ce qu'ils affirment »
  (`tests/soley-public.test.mjs`) appelle `construireCours` et mesure les rectangles
  émis ; il couvre **tout** cours à scène `parts`, présent et à venir. Vérifié dans
  les deux sens : fausser une bande le fait échouer.
- **Une notion s'enseigne UNE fois, avant qu'on s'en serve** (16/08). Un monde ne
  redécouvre pas ce qu'un monde précédent a enseigné : c'est ce qui a coûté sa place à
  « Quarts en croix » (15/08) puis à « Les sixièmes » (16/08). Corollaire : une notion
  servie sans cours est une dette, pas un choix — 1/8, 1/9 et 1/12 l'ont été deux jours.
- **Le support d'un point de cours est la bande de fractions ; le rayon reste le support
  du jeu.** Un cours peut donc se passer entièrement de rayons (`scene.murs`, cours
  `recouper`, 16/08) — et il le doit dès que la cascade dépasse deux coupes.
- **UN COURS, UNE PART, LÀ OÙ ELLE ARRIVE** (16/08). Un panneau qui empile plusieurs
  notions ne se lit pas : « beaucoup de choses dans le même truc » (Gwenael, sur
  capture). On coupe donc par notion, et chaque morceau se pose au niveau où sa part
  apparaît POUR LA PREMIÈRE FOIS — première apparition mesurée sur les cases, jamais
  supposée. Le corollaire coûte un champ de code : **enseigner et jalonner sont deux
  métiers.** `dec` fait les deux (il ouvre le cours ET compte dans `decouvertesMonde`) ;
  `cours` ne fait que le premier. Sans cette séparation, poser un cours dans un CHAMP
  le rendrait obligatoire — or la canne doit rester contournable par le chemin de
  l'école, « c'est des cours qui expliquent ce qu'ils viennent faire, pas obligatoires
  pour passer à la suite ». **Ne jamais renommer l'identifiant d'un cours existant** :
  `save.cours` est indexé dessus, et le renommer rejoue le panneau à qui l'a déjà vu.
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
12. **Une promesse de consigne se prouve au solveur, à la couche où elle est vraie**
   (17/08, lot vérité). Trois mensonges mesurés le même soir : « Recoller les
   morceaux » promettait la lentille pour gagner alors que seule la couche FRUITS la
   force (sans elle, Gtout = 0 sur l'espace éclairé complet — la consigne déplace la
   promesse sur les goyaviers au lieu de la supprimer) ; « L'addition du marché » se
   gagnait sans addition (rangée du soleil libre, et le ×3 « piège » offrait
   1/3 × 3 = 1) — cible redessinée : mur + passes 2/3, l'addition devient
   obligatoire, prouvé par espaces épuisés sans lentille/×2/÷3 ; et le ÷3 piège des
   boîtes 4-5 du lagon montrait la « nouvelle couleur » avant sa découverte —
   remplacé par des ÷2 d'orientation trompeuse, mesurés pour que la résistance
   survive (518→371, 1 907→1 091). Corollaire gravé en test permanent : **le ÷3
   n'apparaît dans aucune boîte avant `dec:'tiers'`**. Cas connu laissé ouvert : le
   ÷2 de « Zigzag dans le corail » (renommé au lot H) précède aussi sa découverte,
   mais sa consigne ne promet rien — décision à prendre (le retirer ferait R 175 → 74).
13. **Les pitons passent devant la forêt, et rendent leurs niveaux à lentille**
   (17/08, lot pitons-2 — décision de Gwenael du 16/08, « sinon les pitons passent,
   oui, je suis d'accord » ; « la comparaison en sixième, c'est plus facile que
   l'addition »). Mesuré avant de bouger : cinq des sept niveaux du monde n'ont
   jamais eu besoin de la lentille ; les deux autres (« La passe étroite »,
   « Le tamis ») déménagent en forêt, où la lentille est chez elle. « La passe
   étroite » devient le premier niveau du jeu où elle est OBLIGATOIRE pour gagner —
   placée APRÈS « Deux tiers » (doctrine du 18/08 : on ne force jamais une
   addition avant de l'avoir apprise ; forcer APRÈS, c'est un puzzle).
   L'équivalence s'enseigne désormais AVANT que la forêt exige les doubles
   écritures. Le verrou reste doux : la forêt s'ouvre par 5 réussites aux pitons,
   dont le plus dur exigé est très sous le plafond « personne n'est bloqué ».
   COÛT ANNONCÉ ET ACCEPTÉ : deux clés de sauvegarde changent (pitons:→foret:),
   les joueurs actuels y perdent deux petits soleils, rejouables en une minute
   (« aujourd'hui les seules sauvegardes au monde sont celles de Gwenael et de ses
   cousins »). Le « Nouveau : la passe ! » suit la première passe du jeu sur
   « Quel rayon passe ? » — l'avertissement du lot H est réglé le jour même du
   déménagement, pas oublié.
14. **La doctrine des additions, et le cours à la cueillette** (18/08, décision de
   Gwenael). Une addition ne se FORCE jamais avant d'avoir été apprise : la
   découverte la force naturellement par sa cible (« Deux tiers » : 2/3 ne s'obtient
   pas d'un seul rayon — règle §5.16, inchangée), et un puzzle peut l'exiger APRÈS
   (« La passe étroite », « Le tamis », « L'addition du marché »). Mais AVANT
   l'apprentissage, on ne force pas : sur « Recoller les morceaux », gagner reste
   libre — et quand l'élève cueille les DEUX goyaviers (qui, eux, exigent la
   lentille, mesuré Gtout = 0 sans elle), il vient de faire sa première addition
   de lui-même : le cours « Recoller deux moitiés » apparaît à CE moment. C'est le
   QUATRIÈME déclencheur, `coursFruits:` — après une victoire qui ramasse tout,
   une seule fois, même registre save.cours ; le bouton « Revoir » de la carte ne
   l'offre qu'une fois mérité (le mode classe ouvre tout). Quatre métiers
   désormais : `dec` enseigne et jalonne · `cours` enseigne après la victoire ·
   `intro` explique avant de jouer · `coursFruits` célèbre le geste accompli.

- **Un compteur se recale sur la vérité mesurée, il ne s'incrémente pas** (18/08).
  Le lot pitons-1 faisait passer la carte du catalogue de « 70 casse-têtes » à
  « 72 » pendant que la méta, la description, l'annuaire et la vignette passaient
  à 73 : il avait ajouté +2 au lieu de rejoindre le compte réel, et le compteur
  mentait déjà d'une unité avant lui (70 pour 71 niveaux). Le test avait été mis à
  jour au même compte — `tests/soley-public.test.mjs` exigeait « 73 niveaux » et
  « 72 casse-têtes » dans **deux lignes consécutives, pour la même ressource**.
  **Un test aligné sur l'erreur la scelle au lieu de la révéler :** l'écart se
  recopiait de lot en lot, invisible à toute batterie. Les cinq compteurs publics
  de Solèy se vérifient ENSEMBLE, jamais un par un : méta de `soley.html`,
  `description` ET `cardDescription` du catalogue, annuaire
  `toutes-les-ressources.html`, vignette `soley.svg`.
- **Un vérificateur de lot et une batterie Playwright lisent l'ARBRE DE TRAVAIL,
  pas le commit qu'on croit tester** (18/08, erreur commise deux fois dans la même
  session). Lancer `verifier-lot-pitons-demenagement.mjs` depuis la pointe d'une
  chaîne où le lot suivant est déjà appliqué sort des ÉCHECS qui décrivent
  exactement le contenu du lot suivant ; lancer `test_soley.py` **sans `--root`**
  depuis la branche d'un lot non fusionné compare les attentes de ce lot au site
  qui porte le précédent. Les deux fois, la remesure au bon endroit est sortie
  TOUT VERT. **Avant toute batterie : quel arbre est sorti, et contre quoi je
  mesure ? Pour le rituel d'après-fusion, `git checkout origin/main` d'abord.**
- **Un paquet reçu d'une autre session décrit le monde du jour où il a été écrit**
  (18/08). Trois commandes avant de croire son mode d'emploi : `git fetch` ;
  contrôler l'existence dans `main` d'un fichier neuf du lot (le lot 1 des quatre
  lots y était DÉJÀ) ; comparer les `index <blob>` du patch aux
  `git rev-parse origin/main:<chemin>` (la base annoncée était périmée de sept
  commits, deux fichiers du catalogue avaient dérivé). **Quand les récits
  divergent, GitHub tranche** — et `git am -3` absorbe une dérive sans conflit,
  mais cela se VÉRIFIE après coup : diffstat conforme à la liste attendue, et le
  contenu des commits intercalés recompté avant/après.

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
  pas une correction.** — *arbitrage rendu au lot H (17/08) : renommés « Zigzag dans
  le corail » et « Le champ de fougères », voir plus bas.* L'atelier suit aussi : les objets s'appellent désormais
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
- **16/08 — chaque part, son cours, là où elle arrive (lot B).** Le cours `recouper` du
  lot A tenait trois murs et cinq phrases dans un seul panneau : les huitièmes, les
  neuvièmes et les douzièmes d'un coup. Verdict de Gwenael sur capture : « ça fait un
  peu beaucoup de choses dans le même truc et ce n'est pas agréable à lire ». La mesure
  a dit où couper — première apparition de chaque dénominateur, lue sur les cases :
  **1/8 au 11ᵉ niveau** (« La moitié du quart », lagon), **1/9 au 18ᵉ** (« La chambre
  close », canne), **1/12 au 19ᵉ** (« Les deux chemins du sixième », canne). `recouper`
  garde donc les huitièmes et la règle générale ; `neuvieme` et `douzieme` naissent, un
  mur et deux phrases chacun, posés sur leur niveau. **Le champ `cours` est né de là** :
  poser un `dec` sur un niveau de la canne aurait fait de ce monde un passage obligé —
  exactement ce que le chemin de l'école a été inventé pour éviter. `cours` ouvre le
  panneau à la première victoire et n'entre PAS dans `decouvertesMonde` ; le badge
  « niveau-découverte » reste réservé à `dec`, seul le bouton « Revoir le cours » est
  partagé. Le vérificateur rejoue `decouvertesMonde` des deux côtés pour les 9 mondes et
  prouve qu'elle est identique : **aucun verrou n'a bougé.** Le blurb de la canne a été
  réécrit dans la foulée — « Rien de neuf à apprendre » devenait faux le jour où deux
  cours sont entrés dans le monde (règle du 15/08 : quand le contenu d'un monde change,
  on relit ses TEXTES). La canne garde ses **0 ligne `CALC`** : le cours explique la
  part, le niveau continue de faire chercher. **RÈGLE À GRAVER : ne jamais renommer
  l'identifiant d'un cours** — `save.cours` est indexé dessus. Preuves : node 1554/1554,
  les 8 validateurs, Playwright tout vert, `verifier-lot-cours-repartis.mjs` 52
  contrôles verts (68 niveaux intacts à l'octet, les 2 hôtes au champ `cours` près,
  `CALC` et `FRW` strictement intacts, les deux hôtes mesurés ingagnables sans ÷3).
- **16/08 — le lagon ne finit plus en marche arrière (lot C).** « La moitié du quart »
  fermait le monde en **R = 75** juste après « Le tiers de la moitié », qui en demande
  **5 534** : une chute d'un facteur 74 au dernier niveau. Verdict de Gwenael sur
  capture : « il est quand même beaucoup trop facile par rapport à tout ce qu'il y a pu
  avoir avant, c'est vraiment bidon ». **Exactement le défaut qui avait déjà coûté sa
  place au « Tour du lagon » le 15/08** — et le lot A ne l'avait pas vu parce qu'il
  s'était comparé aux quatre autres découvertes (5, 5, 19, 51) : mauvaise classe de
  comparaison, celles-là sont INTERCALÉES entre des niveaux durs quand celle-ci FERME
  le monde. **RÈGLE À GRAVER : un niveau se compare à ses VOISINS DE JEU, pas à ses
  cousins de catégorie.** Le recuit de `tailleur-champs` a été essayé puis **écarté**
  (il converge vers prof 6 et R = 58 970 — plus dur que tout le jeu, et son propre
  garde-fou dit qu'un plan minimal de six pièces est un autre défaut). Le levier retenu
  est **géométrique** : les trois prismes étant entièrement consommés par la chaîne
  1/4 · 1/8 · 1/8, tout virage supplémentaire exige un miroir — il a suffi de
  **désaligner une case**. R = 75 → **1 383**, prof 3 → **4**, boîte 4 → 7, champ
  9×6 → 9×7. **Et une découverte porte un fruit pour la première fois**, à la demande
  de Gwenael (« mettre des fruits difficiles à obtenir »). Vérifié avant de le faire :
  le déverrouillage ne lit que `save.done`, donc un fruit n'ôte rien à « une découverte
  se gagne, elle ne se mérite pas » — il n'ajoute qu'une couche d'étoiles. Le fruit a
  été placé par `carte-fruits` sur une case que **5 plans gagnants sur 19** traversent :
  **Rtout = 4 616, soit 3,3 × R** — le fruit n'est pas sur le chemin, c'est précisément
  le défaut « Rtout ≤ R » que la spec range au lot C. Cadeau du champ : la demi-part qui
  « se perdait en chemin », tableau du cours, est exactement celle qu'il faut rattraper
  pour cueillir le letchi. **Deux vérificateurs deviennent des archives** :
  `verifier-lot-recouper.mjs` (il affirmait « aucun fruit, aucun solMin » pour ce niveau)
  et `verifier-lot-cours-repartis.mjs`, qui échoue désormais sur son seul contrôle
  « les 68 autres niveaux sont intacts à l'octet » — précisément parce que ce lot-ci
  retaille celui-là. C'est le fonctionnement prévu des vérificateurs datés (§6,
  décision 9). **Piège appris au passage : les PR de ce dépôt sont fusionnées en SQUASH,
  donc un vérificateur daté doit référencer un commit de `main`, jamais un commit de
  branche — celui-ci disparaît de l'historique.** Preuves : node
  1554/1554, les 8 validateurs, Playwright tout vert,
  `verifier-lot-moitie-du-quart.mjs` 28 contrôles verts (69 niveaux intacts à l'octet,
  COURS/CALC/WORLDS/FRW strictement intacts, tout remesuré dans le vrai moteur).
- **16/08 — la porte s'apprend avant de se subir (lot D).** Trou constaté à l'audit :
  la première case clôturée du jeu était « La croisée des rayons », **un défi à 6 841
  essais**. L'élève SUBISSAIT la règle. « La case qui tourne le dos » entre aux champs
  de canne **juste avant** : une palissade sur trois côtés, le rayon direct meurt sur le
  bois, il faut faire le tour — quatre miroirs, rien d'autre. **Aucune fraction neuve,
  aucune ligne CALC : la canne reste le seul monde sans aide au calcul.** Le contrôle du
  lot n'est pas une pièce mais une contrainte : **avec la porte, profondeur 4 ; sans le
  champ `porte`, profondeur 0** — le rayon du soleil sert la case tout seul. Le niveau
  n'enseigne donc QUE la porte, et il ne se gagne pas sans elle. R = 26, un niveau
  d'école. **Trois nouveautés de moteur** : le champ `intro:`, qui ouvre le panneau à
  l'ARRIVÉE sur le niveau (voir §6) ; la scène `plateau`, **première scène de cours qui
  ne parle pas de fractions** — ni la bande ni la cascade de rayons ne savent dessiner
  une palissade, il fallait montrer le plateau vu de dessus ; et le bandeau « Avant de
  jouer ». **La palissade de la vignette reprend le dessin du jeu au détail près** —
  les barres débordent de leur côté et se recouvrent aux angles, si bien que la
  clôture fait un contour continu ; un premier jet les arrêtait au ras du carré et
  laissait les coins vides (œil de Gwenael sur capture). Le soleil de la vignette est
  agrandi : sans rayon épais pour donner l'échelle, il doit porter seul. La canne passe de 8 à 9 niveaux, son seuil de 5 à 6, et **le jeu de 70 à 71 —
  les compteurs publics et l'annuaire ont été régénérés** (§5 point 12).
- **16/08 — la palissade redessinée, un seul dessin pour le jeu et pour le cours
  (lot P).** Le point de cours des portes montre la case EN GRAND ; c'est là que
  Gwenael a zoomé et vu ce que personne n'avait vu en quarante pixels : la clôture
  était **trois barres qui débordaient et se recouvraient dans les angles** — le
  côté ouvert n'était pas dessiné, d'où trois et non quatre. Mesuré sur l'ancien
  code, pour les quatre orientations : 2 couples de barres superposées,
  32 unités² de bois en double, et le bois sortait de la case.
  **Elle est maintenant construite comme une vraie clôture** — un poteau à chaque
  angle et à chaque bout, les piquets répartis ENTRE les poteaux, le fil du bois
  suivant exactement le chemin de la planche. `palissadeSVG(porte)` vit dans
  `engine.js`, dans le repère de 100 unités du plateau : `render.js` l'appelle pour
  le jeu, `scenePlateau` pour le cours. **Un seul dessin, deux endroits** — demande
  de Gwenael : « mieux dessinée dans le jeu et mieux dessinée aussi dans le cours ».
  **RÈGLE À GRAVER : ce qui est dessiné petit doit être regardé en grand.** Trois
  jets ont raté parce que je rustinais sans regarder ; le défaut est sorti dès que
  j'ai zoomé ×4 sur un angle. Et il a fallu nommer la STRUCTURE (des poteaux, des
  traverses entre) pour que le dessin tombe juste du premier coup.
- **16/08 — les pitons enseignent enfin ce qu'ils font (lot E).** Le monde s'appelle
  « Équivalences et comparaisons » depuis le premier jour et n'avait **aucun point de
  cours** : l'élève lisait 2/4 sur une case sans qu'on lui ait jamais dit pourquoi
  c'est un demi, et il choisissait une passe sans qu'on lui ait jamais dit que 1/4 est
  plus petit que 1/3. Deux cours entrent, **en `cours:` et non en `dec:`** — ces deux
  niveaux ont des roches et des fruits, ils ne sont pas des découvertes « pures », et
  ils n'ont pas à verrouiller le monde suivant. **Aucun niveau n'est ajouté, retiré ni
  déplacé** : les deux blocs touchés ne gagnent qu'un champ. **Scène `parts`** : des
  bandes de même longueur, découpées différemment, dont on peint le début — le support
  historique du projet employé pour ce qu'il montre le mieux, une comparaison de
  LONGUEURS. Les deux cours partagent l'image et disent l'inverse l'un de l'autre :
  à longueur peinte égale l'écriture change (1/2, 2/4, 3/6), à une seule part peinte
  la longueur diminue (1/2, 1/3, 1/4). **RÈGLE À GRAVER : quand une image porte une
  démonstration, le vérificateur doit mesurer L'IMAGE, pas seulement les textes** —
  ici il calcule les longueurs peintes et exige qu'elles soient égales dans un cas,
  strictement décroissantes dans l'autre. Une image qui montrerait l'inverse de ce que
  la phrase dit serait pire que pas d'image du tout.
- **16/08 — le mot juste d'abord (lot F).** Les cours écrits jusque-là disaient
  « le nombre du bas — le dénominateur — » : l'approximation devant, le mot juste
  relégué entre tirets. Règle de Gwenael : **« il faut rester propre
  mathématiquement »**. Les quatre phrases concernées (cours du demi, du recoupage, du
  neuvième, et la carte de la comparaison) disent maintenant **le dénominateur (le
  nombre du bas)**. Lot de TEXTE seul : aucune donnée de jeu ne bouge, et le
  vérificateur le prouve — titres, scènes, écritures `eq` et prédires intacts, seules
  des chaînes `t` changent. Il vérifie aussi que le compte de ces phrases n'a pas
  **baissé** : corriger une phrase ne doit pas revenir à la supprimer.
- **16/08 — la pièce se tire, autant qu'elle se clique (lot G).** Première
  observation d'ÉLÈVES du projet, rapportée par Gwenael : ses petits cousins, sur
  téléphone, ont tous eu le même réflexe — prendre la pièce et la **tirer** sur le
  plateau — alors que le jeu attendait deux clics. Les deux gestes coexistent
  désormais et c'est le **mouvement** qui les départage : sous 10 px, rien ne change
  et le `click` d'origine fait son travail ; au-delà, c'est un glissement, et le clic
  qui suivrait est étouffé par un **drapeau consommé par le premier gestionnaire qui
  le voit** — pas par une minuterie, qui finirait un jour par avaler un vrai clic.
  Pointer Events : souris, doigt et stylet passent par le même chemin. Un fantôme suit
  le doigt, la case visée s'allume en or si la pièce peut s'y poser, en rouge sinon —
  l'élève sait AVANT de lâcher. `touch-action:none` est posé sur la PIÈCE seulement :
  le reste de l'écran garde son défilement. La géométrie écran → case est **sortie en
  fonction** (`caseSous`) et partagée par le clic et le glissement : deux façons
  d'entrer, une seule vérité sur où l'on pose. **T14** entre à la batterie et contrôle
  les quatre choses qui comptent : le glissement pose et gagne, une case occupée
  refuse, **le clic-clic marche exactement comme avant**, et rien ne traîne après le
  geste. Au passage, les **quatre faux rouges du poste Windows** tombent — mais pas
  pour la raison que ce lot annonçait, et la correction vaut d'être lue :
  - la dette du **CRLF est réelle** : `.gitattributes` impose LF partout et retire
    **trois** des quatre rouges. Attention, il ne réécrit PAS les fichiers déjà
    sortis : il faut ré-extraire l'arbre (`git rm --cached -r . && git reset --hard`).
    Effet de bord heureux, `generate-seo --check` devient vert en local — ses « 105
    fichiers désynchronisés » étaient la même dérive ;
  - la dette **`python3` reposait sur un diagnostic FAUX**. Le lot croyait à l'alias
    du Microsoft Store ; mesuré sur le poste le 17/08, `python3` et `python` y sont
    **le même Python 3.14.0** et démarrent tous les deux. Deux vraies causes,
    empilées : (1) **`.pathname` d'une URL `file:` rend `/C:/Users/…`**, forme POSIX
    que `spawnSync` refuse sous Windows — ENOENT, donc `status: null` quel que soit
    le binaire ; il faut **`fileURLToPath`** ; (2) une fois Python lancé, il écrit
    dans la page de code Windows (« d?fis in?dits ») alors qu'on relit en UTF-8 ; il
    faut **`PYTHONIOENCODING: 'utf-8'`** dans l'`env` du spawn. Le repli
    `python3` puis `python` est conservé — il sert sur une machine où l'alias est
    vraiment en tête du PATH — mais il n'a jamais rien réparé ici.

  **RÈGLE À GRAVER : `.pathname` d'une URL `file:` est un piège Windows silencieux —
  dans tout le dépôt, `fileURLToPath` ou rien. Et un « faux rouge » annoncé se
  REMESURE avant d'être cru : trois couches se cachaient sous une seule explication.**
- **17/08 — la case s'allume aussi dans l'atelier (#404).** `ui.js` est chargé par
  **deux** pages, le jeu et l'atelier dont le mode « Jouer » rejoue le vrai moteur ;
  le lot G n'avait posé son `<div id="cible">` que dans `soley.html`. Dans l'atelier
  le glissement marchait donc — fantôme, pièce posée, zéro erreur — mais **la case ne
  s'allumait jamais**, `surlignerCase` sortant sur son `if(!el)return;`. Rien de
  cassé, aucun test rouge, aucun symptôme : **seule la fonctionnalité manquait, en
  silence.** Cinq lignes dans une seule page, aucune CSS ni aucun script à toucher.
  **RÈGLE : pour tout ajout dans un module partagé, lister les PAGES qui chargent le
  module, puis se demander quels ID de la nouveauté manquent à chacune.** C'est la
  variante « élément absent » du piège d'ID déjà connu (le dégradé `sungrad` dupliqué).
- **17/08 — une pièce posée se déplace (#407).** Demande de Gwenael, qui a posé
  lui-même la vraie difficulté : sur le plateau, le clic veut **déjà** dire « enlève-la ».
  **Réponse : ne pas inventer un troisième vocabulaire, réutiliser le discriminateur
  DÉJÀ présent — le mouvement.** Clic net (< 10 px) sur une pièce posée → elle
  s'enlève comme depuis toujours ; la tirer (> 10 px) → elle se décolle et se repose
  ailleurs. Un seul seuil pour les deux gestes (boîte→plateau et case→case), donc rien
  de neuf à apprendre. Elle se **décolle** dès l'activation (sinon un fantôme flotte
  au-dessus de la pièce restée en place et le rayon la traverse encore), avec
  `overlayShown=false` pour réarmer la victoire (T12). Et **elle ne se perd jamais** :
  roche, autre pièce ou hors plateau la remettent d'où elle vient — le retrait a déjà
  son geste, un glissement raté ne doit pas effacer le travail de l'élève.
  `touch-action:none` passe sur `#board` : **mesuré avant d'être posé**, la page du
  jeu ne défile pas d'un pixel en 390×844, 320×700 ni 768×1024, la règle ne retire
  donc rien. **T15** (6 contrôles) entre à la batterie **et a été VU ÉCHOUER dans le
  bon sens : sur `main`, ses 2 contrôles du geste neuf sont rouges et les 4 de
  l'ancien geste verts** — ce qui prouve d'un coup qu'il mesure la nouveauté et que le
  retrait au clic n'a pas bougé. **Patron à refaire pour toute évolution d'une
  interaction existante.** Piège rencontré : « Premier rayon » se gagne en UNE pièce,
  donc la poser lance la célébration et `boardClick` refuse alors TOUT clic — un
  premier test entièrement faux en est sorti. Prendre un niveau à plusieurs pièces.
- **17/08 — lot H : les textes rattrapent les plateaux, et deux niveaux cessent de
  mentir sur leur décor.** Audit des 71 niveaux, mesuré et non deviné. **Ce qui est
  sain :** aucun doublon de clé `monde:nom`, aucun doublon de nom toutes mondes
  confondus (ce qui casserait `CALC`, indexée par le **nom seul** — 53 entrées),
  aucune clé `CALC` orpheline. **Ce qui ne l'était pas :** neuf textes.
  - **Le tutoriel du niveau 1** apprenait le mauvais geste d'abord. Depuis le lot G,
    le glisser est ce que les enfants tentent spontanément ; il passe devant, le
    toucher-toucher devient le repli. Un seul vocabulaire dans tout le jeu — « touche »
    et « tire », **jamais « clique »**, la cible est le téléphone en portrait — et la
    dernière phrase est désormais la seule du jeu qui dise qu'une pièce **posée** se
    déplace (#407).
  - **Le « Nouveau » du 45 mentait** depuis que la canne s'est intercalée : « La
    croisée des rayons » (16) montre déjà deux soleils. Mesure faite avant d'écrire :
    « un soleil qui ne vaut pas 1 » aurait menti à son tour, car « Un soleil qui vaut
    2 » (43) en montre un. Le vrai neuf est un soleil qui vaut **moins** que 1 — c'est
    ce que la consigne dit maintenant. **Ce piège reviendra au déménagement des pitons
    en position 3 : « Nouveau : la passe ! » (38) est juste aujourd'hui, il faudra le
    re-vérifier après.**
  - **Six consignes et un indice décrivaient un autre plateau que le leur** : 24 (les
    quatre cases valent 1/2, 1/8, 1/8, 1/4 — « un huitième par case » était faux),
    59 (huit miroirs en boîte, six dans la solution : le titre comptait la solution),
    32 (quatrième case 1/3 jamais nommée), 26 (un **seul** douzième, et la case 1/2
    passée sous silence), 19 (deux cases, une seule annoncée — vérifié sur la grille :
    la 1/3 est dehors, la 1/9 dedans), 62 (la lentille est **dans la boîte**, or trois
    niveaux du monde ont des pièces scellées — « à poser » lève l'ambiguïté), 12
    (l'indice disait « une seule pièce coupe » alors que la boîte tient un ÷2 **et**
    un ÷3 ; la réécriture ne s'arrête pas à moitié, car « les autres ne font que le
    faire tourner » était faux du même coup).
  - **Les deux derniers noms qui nommaient un décor absent sont renommés** :
    « Zigzag dans les roches » → **« Zigzag dans le corail »**, « Le champ de roches »
    → **« Le champ de fougères »**. `obstacleSVG(w)` (render.js) dessine corail au
    lagon et fougères en forêt ; le 27 contredisait même sa propre consigne. Arbitrage
    laissé ouvert par SPEC-ORDRE-DES-NOTIONS.md §6.3 « à trancher dans le lot G » et
    passé au travers du lot G — tranché ici, en application de la règle du 16/08
    (« quand on repeint un monde, on relit ses TEXTES dans la foulée »). Coût mesuré :
    **aucun des deux n'a de ligne `CALC`**, trois batteries vivantes suivies, et deux
    niveaux perdent leurs petits soleils chez les joueurs actuels (2ᵉ du lagon, 7ᵉ de
    la forêt, rejouables en une minute). **Le coût ne fera que grossir : aujourd'hui
    les seules sauvegardes au monde sont celles de Gwenael et de ses cousins.**
  - **Les deux `verifier-*.mjs` qui citent les anciens noms n'ont PAS été corrigés** —
    voir la règle §6 : ce sont des archives datées, mesurées mortes **avant** ce lot
    (`verifier-lot-canne` sort déjà 71 échecs contre un `origin/main` intact,
    `verifier-lot-niveaux-durs` plante). `verifier-lot-canne` reçoit la bannière
    `ARCHIVE DATÉE` que son aîné portait déjà. Le musée `soley-v1.html` reste intact.
  - **Ce qui a été examiné et volontairement laissé** : le 60 (« ni la déplacer ni la
    reprendre » **dit vrai depuis #407**, et devient un vrai contraste) ; le 68 « Les
    trois cheminées » pour 2 cases (le nom peut désigner le décor, et **ce niveau a
    une ligne `CALC`** — le renommer tuerait son coup de pouce en silence) ; le 6
    (« Regarde la nouvelle couleur ! » alors que le ÷3 traîne déjà dans les boîtes 4
    et 5 — ça se corrige en retirant le ÷3 de ces boîtes, donc lot de **niveaux**) ;
    les 21 et 55, où **le texte ne peut rien** : tous deux ont soleil = 1 et case = 1/1,
    exactement le cas que le §6 interdit d'espérer (« une case qui demande 1/1 quand le
    soleil vaut 1 ne forcera JAMAIS la lentille ») — ce sont deux **cibles à
    redessiner**, et le 21 est le niveau qui *introduit* la lentille ; enfin les 36
    niveaux qui ont des pièces en trop sans le dire (5 seulement l'annoncent : 12, 22,
    27, 33, 69) — ce n'est pas un mensonge mais une règle du jeu que le texte
    n'énonce jamais, **à décider une fois pour toutes, pas niveau par niveau**.
  - **Non vérifié, pour que la prochaine session sache où on n'a pas regardé** : le jeu
    n'a pas été joué à la main, tout vient des données ; les affirmations du type « un
    seul chemin » (57) ou « les deux brèches » (indice du 33) demanderaient un solveur ;
    les 21 et 55 n'ont pas été re-mesurés (chiffres repris : 196 et 275 victoires sans
    la lentille) ; le 68 n'a pas été regardé à l'écran, d'où le refus de trancher.
  - Preuves : `node --test` **1588/1588**, **8/8** validateurs, batterie du jeu **TOUT
    VERT** (T14 et T15 compris), batterie de l'atelier **TOUT VERT**, et diff sémantique
    champ par champ des 71 niveaux : **seuls 9 textes et 2 noms changent, aucune donnée
    de jeu, `CALC` identique à l'octet**.
- **17/08 — le lot vérité : quatre niveaux cessent de mentir.** Gwenael a arbitré au
  vu de l'audit du soir : les cibles se redessinent, les textes ne maquillent pas.
  **« L'addition du marché »** : l'ancien plateau laissait la rangée du soleil libre
  jusqu'à la case 100 % (R = 42, prof 2) et le ×3 « piège » offrait 1/3 × 3 = 1 sans
  lentille. Redessinée au solveur : un mur et deux **passes 2/3** coupent le plateau —
  couper en tiers, doubler, franchir, recoller. Sans lentille, sans ×2 ou sans ÷3 :
  aucune victoire (espaces épuisés, zéro débordement). R = 4 250 entre ses voisins
  6 647 et 225 ; Rtout = 113 886, les mangues exigent le grand détour sud — la couche
  ☀☀☀ flambe, c'est la doctrine (idée 32). Le ×3 sort de la boîte, la première
  `solMin` hors lagon/canne entre, la clé de sauvegarde ne bouge pas.
  **« Recoller les morceaux »** : mesuré dans l'espace éclairé COMPLET (E = 11 056),
  sans lentille AUCUNE victoire ne ramasse les deux goyaviers — la promesse de la
  consigne n'était fausse qu'à la mauvaise couche. Une phrase la déplace sur les
  fruits, le plateau ne bouge pas d'un octet : « Pour gagner, contourne les fougères.
  Mais pour cueillir les deux goyaviers… ». Rtout/R = 130, le vrai travail était là.
  **« Le tour du lagon » et « La part perdue »** : leurs ÷3 pièges montraient le bleu
  du tiers avant « Regarde la nouvelle couleur ! » (et la consigne de « La part
  perdue » jure que « le prisme coupe toujours en deux »). Deux ÷2 d'orientation
  trompeuse les remplacent, compensation MESURÉE avant d'être choisie (R 518 → 371 et
  1 907 → 1 091 ; l'option s2(0,1,3) sur « La part perdue » grimpait à 8 552 —
  écartée, le 5ᵉ niveau d'une école n'a pas à dépasser le sommet du monde). La règle
  entre en **test permanent** : « la couleur neuve est vraiment neuve ». Garde-fous
  mis à jour (15 solMin), `verifier-lot-verite.mjs` 32 contrôles verts. Nuance sur
  le 21, découverte APRÈS l'audit du lot H (qui le rangeait en « cible à
  redessiner ») : le texte ne peut rien pour la VICTOIRE, mais la mesure Gtout = 0
  montre qu'il peut dire vrai sur les FRUITS — c'est l'option retenue, l'autre reste
  ouverte (une passe le forcerait, possible après le déménagement des pitons).
- **17/08 — lot pitons-1 : le monde s'étoffe avant de déménager.** Demande de
  Gwenael : « des niveaux gagnés assez vite sans les fruits, mais avec les fruits ça
  devient plus piquant » — et le monde était le plus plat du jeu (médiane R = 100,
  6 fruits cadeaux sur 7 niveaux, mesure du 17/08). **Deux niveaux neufs**, taillés
  au solveur AVANT d'être posés : « Le sentier des écritures » (3/6 et 2/8 déguisent
  une moitié et un quart ; la passe du bas REFUSE la moitié plausible — règle du
  16/08 ; la part écartée file au fruit puis meurt, la collecte n'exige que la
  traversée ; R = 289, Rtout = 970) et « La crête des passes » (2/12 et 3/9 ; sans ÷3
  aucune victoire, espace épuisé ; L'ENDROIT DE LA COUPE décide du fruit — Gtout 3
  sur G 60 ; R = 513, Rtout = 7 036). **Deux retouches fruits** : le col (l'ananas du
  grand tour nord, 4 miroirs, Rtout = 10 774, ratio 29) et « Égal ou pas ? » (la
  roche (7,4) s'ouvre, branche est coûteuse, R = 3 979 — nouveau sommet avant « Le
  tamis »). Un ananas facile est GARDÉ sur chaque niveau retouché, c'est la demande
  explicite (« il faut des fruits faciles »). « Le tamis » passe en dernier, position
  seule, clé intacte. L'escalier du monde : 5 · 10 · 100 · 43 · 289 · 368 · 513 ·
  3 979 · 30 188. **Et une règle de Gwenael, en relisant le lot : un cours ne montre
  QUE ce que SON niveau affiche.** Le cours `equivalence` (niveau 1) glissait un 3/6
  que « C'est pareil ! » n'affiche nulle part — il se resserre sur 1/2 = 2/4, et le
  cours `ecritures` entre sur « Trois écritures », le niveau qui affiche 3/6 et 2/8
  (deux paires de bandes : 3/6 rejoint le demi, 2/8 rejoint le quart — le test
  permanent des bandes le mesure, paire par paire). La vignette publique disait
  encore « 70 NIVEAUX » depuis le lot D — elle passe à 73, cache `?v=3`. Total 73
  niveaux, 145 fruits — compteurs publics et annuaire régénérés (leçon du lot
  canne), seuil des soleils 5 → 6 (⌈5×9/8⌉), garde-fous 19 solMin. Étape 1 du
  chantier : le déménagement en position 3 est le lot suivant.
- **17/08-18/08 — lot pitons-2 : le monde déménage en position 3.** La décision du
  16/08 exécutée, mesures à l'appui (décision §6.13). L'ordre du jeu devient lagon ·
  canne · **pitons** · forêt · volcan · soleils · marché · tunnels · Mafate. « La
  passe étroite » entre en forêt APRÈS « Deux tiers » — séquence arbitrée par
  Gwenael (18/08, doctrine des additions) : le 21 fait DÉCOUVRIR la lentille (ses
  goyaviers la forcent, lot vérité), « Deux tiers » (dec:somme) l'ENSEIGNE, et la
  passe étroite seulement ensuite l'EXIGE — **on ne force jamais une addition avant
  de l'avoir apprise ; forcer après, c'est un puzzle, plus une leçon sautée.** « Le
  tamis » (R = 30 188) ferme la forêt, qui finit enfin sur son plus dur. Le
  « Nouveau : la passe ! » passe sur « Quel rayon passe ? » (première passe du jeu,
  monde 3) et la consigne de « La passe étroite » annonce désormais la lentille.
  Palier des pitons 5e-4e → 6e-5e. Seuils recalculés [0·7·6·5·7·5·5·4·5] ; le
  chemin de l'école re-testé sur le nouvel ordre (le lagon fini ouvre canne ET
  pitons ; la forêt attend les pitons, ⌈5×7/8⌉ = 5). DEUX clés de sauvegarde
  changent — c'est tout le coût, gravé au §6.13. Batteries : node 1 589/1 589,
  8 validateurs, Playwright jeu + atelier TOUT VERT,
  `verifier-lot-pitons-demenagement.mjs` 16 contrôles.
- **18/08 — lot cueillette : le cours qui célèbre le geste accompli.** Décision de
  Gwenael (§6.14) : ne pas forcer la première addition, l'HONORER. Nouveau
  déclencheur `coursFruits:` dans engine.js — à une victoire qui ramasse TOUS les
  fruits, le cours s'affiche, une seule fois (même registre save.cours). Premier
  porteur : « Recoller les morceaux » → cours `moities` (« Recoller deux
  moitiés », scène somme 1/2 + 1/2). Le bouton « Revoir » de la carte ne l'offre
  qu'une fois mérité — un cours-récompense ne se feuillette pas d'avance (le mode
  classe ouvre tout). Garde-fous : la chaîne des déclencheurs vérifiée au source,
  un seul `coursFruits` pour l'instant, et **T16** à la batterie navigateur — la
  sol de référence (qui cueille tout) fait bien apparaître « Recoller deux
  moitiés », mémorisé dans save.cours. Le panneau du cours existe dans les DEUX
  pages qui chargent le module (règle du §6 : un module partagé se vérifie page
  par page — `courssur` est dans soley.html ET soley-atelier.html, vérifié).
  Retour de Gwenael sur capture, appliqué : **la bande de l'ENTIER se pose
  AU-DESSUS des deux moitiés** (« ça paraît logique ») — option `unite:true` de
  sceneSomme, opt-in : `somme` et `denominateur` gardent leurs deux lignes au
  plus (règle du 15/08), rien ne bouge chez eux. La grammaire des murs s'applique
  aussi ici : le dessous se lit par rapport au dessus.
- **18/08 — les quatre lots posés en quatre PR, et ce que l'exécution a corrigé du
  paquet.** Séance d'application du zip `soley-4-lots-18-08_1.zip` : #417 (pitons-1,
  squash `3b3512f0`), #419 (pitons-2, `b02eb7f5`), #421 (cueillette, `b71e907d`) —
  le lot vérité était **déjà en ligne** à l'ouverture de la séance (#410,
  `ea2406c8`), constaté par le CONTENU de `main` et non par un statut. Aucune PR
  empilée, chacune ouverte seulement après vérification que la précédente était
  entrée. **La base annoncée par le paquet (`02f56216`) était périmée de sept
  commits** : sur les huit fichiers du lot pitons-1, six intacts à l'octet et deux
  dérivés (`catalogue-refonte-data.js` et `toutes-les-ressources.html`, retouchés
  par les PR du jeu du chat) ; `git am -3` a absorbé la dérive **sans conflit sur
  les trois patchs**, contenu des PR intercalées vérifié survivant par comptage
  d'occurrences, diffstats conformes aux listes annoncées. Les trois vérificateurs
  livrés se sont montrés honnêtes : **25, 16 et 13 contrôles, tous vus verts**
  contre le vrai `main`. **Un seul défaut réel dans le paquet, corrigé en second
  commit de #417 : le compteur de la carte du catalogue** (règle passée au §6).
  Rituel fait après CHAQUE fusion : Publication verte, batterie du jeu **TOUT VERT
  sur mathsgo.re** (dont **T16 en production** : le cours « Recoller deux moitiés »
  s'affiche vraiment à la cueillette complète), et **10/10 fichiers servis
  identiques aux octets** d'`origin/main` — les sept de Solèy plus la vignette, le
  catalogue et l'annuaire, comparés au `git show origin/main:<chemin>` et jamais au
  disque (dérive CRLF). Branches locales et distantes supprimées, worktree retiré,
  clone principal jamais touché (il servait une session parallèle).
  **Deux repères pour la prochaine session.** (1) Le compte de référence de
  `node --test` est **1 590** depuis #415 (mode noir et blanc des bandes) : les
  entrées ci-dessus annoncent 1 589, c'est le compte d'avant, pas une régression.
  (2) `levels.js` commence par `"use strict"`, donc ses `const` (`WORLDS`, `LV`,
  `COURS`, `CALC`) **ne sont pas des propriétés du contexte vm** — les relire par
  `vm.runInContext('WORLDS', ctx)`, jamais par `ctx.WORLDS`, qui rend `undefined`.
  **État du jeu en ligne à la fin du 18/08, mesuré sur le `levels.js` SERVI :**
  mondes lagon · canne · pitons · forêt · volcan · soleils · marché · tunnels ·
  Mafate, **73 niveaux, 73 clés de sauvegarde, 145 fruits, 14 points de cours**
  (`moities` est le dernier), un cours à la cueillette. Les cinq compteurs publics
  disent 73. `main` a bougé deux fois pendant la séance (#418 et #420, jeu du
  chat) : zéro fichier en commun avec les lots, donc aucun rebase — le contrôle se
  fait en comparant les deux `git diff --name-only`.
- (à compléter à chaque session)
