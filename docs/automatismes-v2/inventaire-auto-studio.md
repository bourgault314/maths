# Inventaire technique de `auto` et `studio` pour Automatismes V2

**Inventaire vérifié le 6 août 2026.**

Ce document empêche de refaire inutilement le travail déjà acquis. Il ne change
pas la règle de provenance : l'ancien contenu pédagogique reste une archive
consultée notion par notion, et aucun énoncé, paramètre, distracteur, valeur ou
code historique n'entre automatiquement dans V2.

## Les quatre couches à ne plus confondre

| Couche | Rôle | Statut pour V2 |
|---|---|---|
| `studio/automatismes/` | Source historique du menu vide travaillé avec Gwenaël et passerelle MG1 | Référence d'interface ; moteur legacy |
| `auto/` | Version publique V1, ses modules, ses visuels et ses interactions | Archive et banc d'essai ; aucune dépendance directe depuis V2 |
| `packages/` | Contrats, moteur seedé, charte et objets indépendants | Fondation V2 à examiner en premier |
| `automatismes-v2/` | Lanceur et lecteur neufs | Seule application élève de la V2 |

Le validateur interdit à `automatismes-v2/` et aux fondations V2 d'importer
`auto/` ou `studio/`. Lorsqu'une idée ancienne est retenue, elle est donc
réécrite ou déplacée proprement dans la fondation, avec sa provenance et ses
tests.

## Déjà repris dans V2

### Coque du menu

Sources historiques :

- `studio/automatismes/index.html` ;
- `auto/index.html` ;
- `auto/styles/setup.css`.

Éléments déjà repris dans `automatismes-v2/app.js` et
`automatismes-v2/menu.css` :

- en-tête et logo ;
- cartes numérotées ;
- contrôles segmentés ;
- domaine repliable ;
- icône « Nombres et calculs » ;
- largeur compacte de 620 px ;
- barre de résumé et de lancement fixe ;
- zones sûres des téléphones, adaptations à 650 px et 360 px ;
- cibles tactiles, focus et états accessibles ;
- calculatrice barrée comme repère permanent du contexte DNB.

Les anciens réglages Niveau, Avec/Sans aide, Diaporama/Interactif, le partage,
MG1 et les crédits ne font pas partie du lanceur V2.

### Fondations indépendantes

V2 utilise déjà la charte, les contrats, le moteur seedé, les registres et les
objets indépendants. Le lecteur actuel importe notamment
`packages/objets/src/solides.js`. Les autres objets de `packages/objets/src/`
sont disponibles selon les besoins des futures notions :

- barres, fractions et pourcentages ;
- droite graduée et représentations numériques ;
- figures, géométrie, angles, triangles et solides ;
- jetons, équations, ÉquaBarre, ÉquaSplat et plateaux Splat ;
- Pythagore et Thalès ;
- clavier, flèches, rédaction et références du programme.

Leur présence ne dispense pas de vérifier qu'ils répondent exactement à la
fiche pédagogique de la notion.

### Cas audité : NC-02, carrés et écriture des puissances

Le nom « Studio puissance objet v6 » ne correspond à aucun chemin du dépôt
actuel. Cela ne signifie pas que le prototype n'a jamais existé : ses traces
utiles sont aujourd'hui dispersées dans plusieurs sources historiques :

- `auto/scripts/shared/visuals/numbers/square-area.js` pour le carré et son
  aire ;
- `auto/scripts/modules/numbers/dnb_07.js` pour les anciennes formes de
  questions sur les carrés ;
- la règle `.squares-mode` de `auto/scripts/03-slideshow.js` pour le réglage
  typographique historique de l'exposant ;
- `outils/labo-des-regularites.html` et `outils/patterns.html` pour les carrés
  représentés par des régularités ;
- `outils/plateaux_manipulation/feuille_coupee_puissance.html` pour un travail
  sur le doublement `2^n`, utile comme trace du chantier « puissances » mais
  hors du périmètre pédagogique de `NC-02`.

L'audit a conduit à deux briques communes du candidat V2 :

- `packages/objets/src/expressions.js` reçoit une puissance structurée et rend
  un véritable élément HTML `<sup>` avec son libellé accessible ;
- `packages/objets/src/carre-quadrille.js` produit le carré de sens, l'aire
  inconnue ou le côté inconnu depuis un même objet SVG testé.

Le lecteur ajoute aussi une réponse à deux entiers indépendants pour
`49 = □ × □`. Ces briques sont neuves et déclarées dans la fondation V2 : elles
n'importent ni le mini-parseur, ni le SVG, ni les valeurs, formulations ou
distracteurs historiques. Le travail ancien fixe l'intention et les points de
comparaison ; le composant V2 constitue désormais la source commune du
candidat.

## Réservoirs techniques à examiner au besoin

### Bibliothèque de visuels

Le banc d'essai `auto/dev/visual-library.html` et le registre
`auto/scripts/shared/visuals/00-registry.js` recensent les familles suivantes :

| Famille | Dossier et exemples |
|---|---|
| Nombres | `visuals/numbers/` : droite graduée, cartes d'ordre, tableau de numération, jetons relatifs, carrés |
| Arithmétique | `visuals/arithmetic/` : partages égaux, fractions, murs et barres de relation |
| Algèbre | `visuals/algebra/` : tuiles, modèle d'aire, équation Splat, barres et relations |
| Géométrie | `visuals/geometry/` : angles, repère, Pythagore, solides, Thalès, triangle |
| Mesures | `visuals/measures/conversion-table.js` |
| Données | `visuals/data/cartesian-graph.js` |

Ce banc d'essai sert à retrouver une idée ou un comportement. Les rendus restent
des candidats : `docs/plan-extraction-visuels.md` signale que certaines
versions anciennes sont insuffisantes et que la bonne référence se trouve
parfois dans `outils/`.

### Gestes et manipulations

- `auto/scripts/shared/interactions/pointer-drag.js` documente le suivi du
  pointeur même lorsque sa capture échoue, puis son nettoyage à l'annulation ;
- `tests/automatismes-pointer-drag.test.mjs` conserve les régressions utiles ;
- `auto/scripts/shared/manipulations/contracts.js` recense les intentions de
  manipulation et leurs équivalents tactiles, souris et clavier.

Ces fichiers constituent des spécifications. Un helper V2 n'est créé que
lorsqu'une notion validée en a réellement besoin ; il n'importe jamais ces
scripts directement.

### Mobile, ordinateur et TNI

Les anciens lecteurs rappellent plusieurs cas à vérifier dans V2 :

- `100dvh` et zones sûres ;
- aucune largeur qui déborde ;
- partie mathématique visible quand un panneau est ouvert ;
- clavier interne lorsque la saisie l'exige ;
- geste tactile toujours doublé par une action souris ou clavier ;
- fermeture par Échap et restitution du focus ;
- question et commandes stables en projection.

Ils servent de liste de contrôle, pas d'implémentation à copier.

## Éléments qui restent volontairement legacy

- `studio/automatismes/catalogue.js`, `app.js`, `mg1.js` et `mg1.test.js` ;
- `auto/scripts/02-question-engine.js`, `03-slideshow.js` et `04-app.js` ;
- les modules et identifiants `dnb_*` ;
- leurs banques, générateurs, paramètres, valeurs, formulations, distracteurs
  et `formula_code` ;
- le catalogue MG1 et la logique ancienne de niveau, aide et mode ;
- le générateur d'icônes `auto/scripts/00-setup-icons.js`, qui emploie
  `Math.random()` et ne peut pas entrer tel quel dans V2.

La séparation génération / sélection / rendu présente dans quelques modules
V1 est une leçon d'architecture déjà intégrée au registre V2 ; elle ne justifie
pas de porter leur code.

## Invariant permanent d'homogénéité

Chaque notion V2 réemploie la coque, l'ordre question → réponse → validation,
les panneaux de cours, d'aide et de correction, les commandes et les profils
d'entrée déjà communs. Un même objet doit avoir le même rendu dans le cours,
la question, l'aide, la correction, « S'entraîner » et « Au tableau ».

Cet invariant vaut pour toutes les fabrications futures. Le rituel ci-dessous
doit contrôler sa stabilité sur téléphone, ordinateur et TNI, au clavier, à la
souris et au toucher ; l'homogénéité ne doit pas dépendre d'un rappel propre à
chaque micro-notion.

## Rituel obligatoire avant chaque nouvelle notion

1. Lire la cible officielle et la fiche pédagogique de la micro-notion.
2. Chercher d'abord l'objet nécessaire dans `packages/objets/src/` et les
   fondations V2.
3. Ouvrir dans `auto/` et `studio/` uniquement la partie correspondant à cette
   notion, ainsi que le banc de visuels si nécessaire.
4. Lister séparément les apports de Gwenaël, les idées d'interface, les objets
   techniques et ce qui doit rester legacy.
5. Présenter les candidats utiles à Gwenaël ; ne rien reprendre par défaut.
6. Après validation, adapter ou reconstruire la brique dans la fondation V2,
   déclarer sa provenance et écrire ses tests.
7. Vérifier téléphone, ordinateur, TNI, clavier, souris, toucher et cas limites
   avant de rendre la notion visible dans le menu.

Ainsi, le travail précédent reste exploitable sans faire de V2 une copie du
programme historique.
