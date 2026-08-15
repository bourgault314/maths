# Diagnostic à froid des 61 niveaux — le chantier « refonte » (14/08/2026)

Constat de départ (Gwenael) : les 33 idées récoltées sur l'original n'ont jamais touché
un seul niveau de Solèy. Les niveaux datent du 11/08, la bibliothèque d'idées a été
construite APRÈS, en étudiant l'original — et elle est restée dans le cahier.
Ce document mesure l'écart, chiffres à l'appui, et pose les principes de la refonte.

## 1. Méthode

Script `diagnostic-niveaux.mjs` (à verser dans `tests/soley/` comme outil d'audit) :
chargement de `levels.js` + `engine.js` dans le vrai moteur (même patron que la
batterie), puis pour chacun des 61 niveaux : simulation de la solution de référence,
simulation de toutes les variantes « une pièce en moins », relevé du surplus de la
boîte, des fruits ramassés, des dénominateurs demandés, des tailles de grille.
Détail par niveau dans `diagnostic-niveaux.json`.

## 2. Ce que les mesures disent

**a) La boîte contient la solution, et rien d'autre.**
31 niveaux sur 61 ont ZÉRO pièce de surplus. Sur les mondes d'apprentissage c'est
quasi systématique : le lagon offre 1 seule pièce en trop sur 9 niveaux, le marché
1 sur 6. Seuls les tunnels (14) et Mafate (15) ont un vrai surplus.
Dans l'original, le surplus est SYSTÉMATIQUE dès le monde 1, pièges mathématiques
compris (un ÷3 fourni quand il faut des demis). Chez nous, la boîte à outils
donne la réponse : « pose tout ce qu'on te donne » est une stratégie gagnante
dans la moitié du jeu.

**b) Le fruit ne demande jamais un autre plan.**
Sur les 57 niveaux à fruits, la solution de référence ramasse 100 % des fruits
(135/135) — et aucun niveau n'est gagnable avec une pièce de moins. Autrement dit :
le chemin qui gagne EST le chemin qui ramasse. L'idée 11 (la règle d'or de
l'original : le fruit HORS du chemin gagnant, qui exige un AUTRE plan) n'existe
nulle part. Conséquence directe sur les petits soleils : ☀☀ (tous les fruits) est
automatique quand on gagne, et ☀☀☀ (« au plus autant de pièces que la référence »)
est automatique quand la boîte est exacte. La couche optionnelle — là où l'original
met tout son piquant (idée 32) — tourne à vide.

**c) On brûle les notions.**
Le lagon (monde 1) introduit les dénominateurs 2, 3 et 4 en 9 niveaux. La forêt
(monde 2) passe à l'ADDITION avec des dénominateurs 6, 8, 12. L'original, au
monde 3, fait encore du partage : sa difficulté monte par l'ESPACE (routage,
satellites, autoroutes cachées, chambre close, rayon sacrifié — idées 24, 27, 33)
et par la couche collectible, jamais par une notion nouvelle. Chez nous la
difficulté ne PEUT venir que de la notion : pas de surplus (a), fruits gratuits (b),
grilles petites (7×5 à 10×8, sauf tunnels/Mafate 12×8) et peu d'obstacles.
Chaque monde est donc obligé d'apporter du nouveau savoir pour être un jeu.

**d) Pourquoi c'est structurel.** Les trois défauts sont le MÊME défaut : nos
niveaux n'ont qu'une seule couche. Un niveau = une notion + une boîte exacte +
un chemin unique qui prend tout au passage. L'original a deux couches : gagner
(accessible, notion connue) et tout ramasser (l'espace, le surplus, le plan B).

## 3. Principes de la refonte (issus de la bibliothèque, à graver)

P1 — Le surplus est la règle, la boîte exacte l'exception (réservée aux
niveaux-découverte, conçus triviaux). Inclure des pièges mathématiques dosés.

P2 — Le fruit se mérite : gabarit idée 11. Un fruit au moins par niveau
d'entraînement demande un plan différent du plan gagnant minimal. Le test
« gagnable sans le fruit » devient un contrôle de la batterie (l'inverse
d'aujourd'hui).

P3 — La difficulté vit dans la couche ☀☀/☀☀☀, pas dans la notion (idée 32).
Gagner reste accessible partout ; tout ramasser peut flamber n'importe où
(3:5 était au MILIEU de son monde).

> **P3 est chiffré depuis le 15/08** (lot « niveaux qui résistent », outil
> `tests/soley/solveur-etalon.mjs`). Les grandeurs : `E` espace exploré, `G`
> gagnantes, `R` rang moyen de la 1re victoire en essais aveugles, `prof` plus
> petit nombre de pièces d'un plan gagnant, `λ` largeur du tâtonnement par pose
> (`R = λ^prof`). Étalonnage des 8 niveaux de la canne AVANT toute retouche :
> médiane `R` = 45, sept sur huit gagnés en 1 ou 2 pièces — le diagnostic ci-dessus
> décrivait juste, il ne mesurait pas. **Le levier est la profondeur du plan gagnant
> minimal**, pas la notion et pas la densité : passer de 2 à 4-5 pièces multiplie
> `R` par `λ²` ou `λ³`. Seuil de rejet adopté : un niveau qui se gagne en 2 pièces
> ou moins ne se montre pas. Et `R` ne se lit JAMAIS seul — l'ancienne « Chambre
> close » culminait à `R = 15 929` avec `λ = 2,9` : neuf poses dictées, pas de la
> recherche. Détail dans `RAPPORT-ESSAI-NIVEAUX-DURS.md`.

P4 — Étirer la progression SANS copier le rythme de l'original (décision
Gwenael : « on n'est pas obligé d'être pareil » — la somme de fractions peut
arriver tôt, c'est notre invention d'école). Ce qu'on prend, ce sont les
MÉCANIQUES : plusieurs niveaux d'entraînement par notion, difficulté spatiale
montant à notion constante (répertoire : idées 21-33 — part perdue devenue
trésor, deux routes vers 1/6, croisée des rayons, tour de plateau, rayon
sacrifié, grand tri, chambre close…). Piste concrète de Gwenael : INTERCALER
un monde entre le lagon et la forêt, consacré au partage joué à fond avec ces
mécaniques, avant la somme. (Techniquement sans risque : les clés de
sauvegarde sont `monde:nom`, ajouter un monde ne casse rien ; les seuils
d'ouverture se recalculent tout seuls.)

P5 — Un décor cohérent par monde : des maisons créoles dans le lagon ne collent
pas (remarque Gwenael) — cibles et obstacles thématiques par monde (bord de mer,
forêt…), à instruire au pilier Habiller avec l'idée histoire/habitants.

## 4. Périmètre et contraintes

- Le pilote : le LAGON (9 niveaux) — c'est le monde le plus joué, ses 3
  niveaux-découverte et ses cours viennent d'être stabilisés et ne bougent pas
  (boîte exacte assumée sur les découvertes) ; la refonte porte sur les 6 niveaux
  d'entraînement + éventuels niveaux ajoutés.
- Contrainte de sauvegarde : la clé d'un niveau est `monde:nom` — renommer ou
  supprimer un niveau casse les sauvegardes ; ajouter est sans risque. Toute
  refonte passe par un plan de migration explicite.
- Contrainte d'écran : le nombre de cases est borné par le téléphone (décision
  Gwenael : c'est un jeu pour téléphone) — la difficulté spatiale doit venir de
  la densité (satellites, chambres, bords) plus que de la taille.
  **Corrigé par la mesure le 15/08 : la densité n'est pas le levier, elle en est
  un effet de bord.** Au-delà d'environ 40 % d'obstacles le champ n'oriente plus,
  il interdit (60 champs tirés au hasard à 40 % : aucun ne laisse passer une chaîne
  de trois prismes) ; un champ dense à couloirs, à 54 %, reste jouable mais tombe à
  `λ = 2,4`, c'est-à-dire qu'il DICTE au lieu de faire choisir. Les niveaux qui
  résistent le mieux tournent entre **14 et 36 %**, avec des couloirs longs et une
  boîte riche. La densité garde un rôle, et il est indispensable : **tuer les
  victoires courtes**, empêcher le plan à 2 pièces d'exister. Preuve d'échec
  conservée au dépôt : `tests/soley/semeur-champs.mjs`.
- La batterie évolue avec : P2 en contrôle automatique, invariants habituels
  (61 sol gagnants, seuils, découvertes intactes).

## 5. Reste à faire (la spec elle-même)

1. Graver les idées 21-33 dans BIBLIOTHEQUE-IDEES.md (dette de sync, préalable).
2. Audit idée par idée : pour chacune des 33, dire où elle atterrit (monde
   intercalé ? retouche d'un niveau existant ? défi ? plus tard ?) — c'est la
   colonne vertébrale de la refonte.
3. Spec du monde intercalé (partage joué à fond, mécaniques de l'original,
   décor à choisir) + retouches du lagon (surplus, fruits déplacés) — création
   des niveaux sur Fable (décision Gwenael : « c'est le boulot de Fable »).
4. Le cours de la lentille reste nécessaire ; il suit la refonte dans la file.
