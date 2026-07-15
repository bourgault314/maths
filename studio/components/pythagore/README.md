# Composants Pythagore

Ce dossier décrit les composants réutilisables issus de `PythaBarre` et du
Moulin de Pythagore. Les pages historiques restent les références publiées ;
ce contrat prépare leur utilisation dans des fiches, des questions, des aides,
des corrections, des diaporamas et des jeux mobiles.

Il constitue l’unique bibliothèque Pythagore de maths&go :

- `visuals.js` contient les géométries et rendus SVG exécutables ;
- `../../schemas/pythagore-components.v1.json` décrit leur contrat de données ;
- `../../../scripts/build-pythagore-thumbnails.mjs` produit les miniatures du
  catalogue à partir de ces mêmes primitives.

Une correction du moulin, des barres, des couleurs ou de la racine carrée doit
être faite ici, puis répercutée par le générateur. Elle ne doit pas être redessinée
indépendamment dans chaque miniature.

Les variantes inventées doivent être explicitement nommées comme variantes.
Un puzzle historique ne doit être ajouté qu’après vérification de sa découpe,
de sa solution et de l’absence de chevauchement des pièces.

## Quatre composants

### `geometry.pythagore-moulin`

Représentation géométrique d’un triangle rectangle et des trois carrés construits
sur ses côtés.

- `rightAngleVertex` identifie le sommet de l’angle droit ;
- `hypotenuse` est toujours le côté opposé à cet angle ;
- les carrés portent les rôles `hypotenuse`, `leg1` et `leg2` ;
- les couleurs sont sémantiques et stables : vert pour l’hypoténuse, bleu et
  orange pour les deux côtés de l’angle droit ;
- le rendu doit pouvoir produire un moulin complet, un moulin vide, un moulin
  à compléter et un moulin annoté.

### `representation.pythagore-bar-model`

Schéma en barres proportionnel aux aires des carrés.

- une largeur de partie est proportionnelle à `length²` ;
- les cellules ont un rôle mathématique explicite, pas seulement une couleur ;
- le parcours distingue relation, remplacement des longueurs, calcul des carrés,
  regroupement ou décomposition, puis racine carrée ;
- la rédaction conserve les unités et la conclusion sur la longueur cherchée ;
- les erreurs et distracteurs sont définis par étape.

### `game.pythagore-reassembly`

Jeu de déplacement des pièces d’un découpage de Pythagore.

- chaque pièce possède un identifiant stable, des sommets, une couleur, une
  position, une rotation et un état de retournement ;
- les transformations autorisées sont déclarées par le puzzle ;
- les aimantations utilisent des ancres géométriques déclarées : sommets,
  milieux, bords et poses exactes ;
- une validation ne dépend jamais d’un simple rapprochement visuel ;
- le mode téléphone affiche un seul moulin-cible, agrandi, puis la zone des
  pièces en dessous : le second triangle source est masqué pour éviter deux
  moulins empilés ; plein écran, lettres et impression restent réservés à
  l’ordinateur ;
- les puzzles proposés doivent être de vraies découpes distinctes. Une simple
  rotation ou un miroir d’un puzzle existant ne constitue pas une variante.

### `activity.pythagore-tactile`

L’activité bêta d’Automatismes est isolée dans le module `dnb_24_tactile`, sous
le menu `Manipuler sur téléphone`. Elle propose cinq modèles paramétrés :
angle droit en A, B ou C, et triplets 3-4-5, 5-12-13, 6-8-10, 7-24-25 et
8-15-17. L’élève place les trois côtés dans la bonne égalité, puis les trois
aires correspondantes. Elle fonctionne au toucher par appui puis appui sur la
case, avec glisser-déposer en complément. Le clavier visuel est désactivé pour
garder le jeu lisible sur téléphone. Le moteur est prévu pour recevoir d’autres
modèles sans réécrire l’interaction.

## Règles communes

Les trois composants partagent le même objet triangle :

```json
{
  "letters": ["A", "B", "C"],
  "rightAngleVertex": "A",
  "sides": {
    "AB": {"role": "leg1", "length": 3},
    "AC": {"role": "leg2", "length": 4},
    "BC": {"role": "hypotenuse", "length": 5}
  },
  "unit": "cm"
}
```

Le générateur ne doit pas demander à l’IA de redessiner le moulin ou le schéma
en barres. Il lui demande un composant, des paramètres validés et un mode de
rendu. Le moteur construit ensuite la représentation à partir de ces données.

## Règles graphiques validées

### Moulin et pièces de Périgal

- le triangle et les trois carrés sont calculés à la même échelle ;
- le rapport historique de la miniature est `1:2:√5` ;
- les petit, moyen et grand carrés sont tous remplis dans le rendu résolu ;
- les cinq pièces proviennent de `perigalSourcePieces` et leur recomposition
  exacte du grand carré de `perigalSolvedPieces` ;
- aucune pièce ne doit être redessinée ou déplacée approximativement.

### Schéma en barres

- la barre `BC²` occupe toute la largeur ;
- les parties `AB²` et `AC²` sont directement jointives sous elle ;
- leur largeur est proportionnelle aux aires représentées ;
- seuls les noms des carrés apparaissent dans les rectangles ;
- chaque nom est centré horizontalement et corrigé optiquement d’un pixel vers
  le bas pour compenser l’exposant `²`.

### Racine carrée

`squareRootSvg` est la primitive commune. Elle trace la racine avec un véritable
crochet et une barre supérieure ; le radicande commence immédiatement après le
crochet, avec seulement le retrait optique défini par la fonction. Pour un rendu
graphique maths&go, ne pas la remplacer par le caractère Unicode `√` ni ajouter
manuellement de l’espace entre la racine et le nombre.

### Rédaction de Pythagore

- les signes `=` d’une résolution sont alignés et proches du membre de gauche ;
- `BC` est aligné avec les occurrences de `BC²` ;
- l’interligne reste compact et constant ;
- les couleurs sémantiques restent visibles jusqu’à la ligne de calcul des
  carrés ; les lignes `BC² = 25` et `BC = √25 = 5 cm` sont entièrement noires.

Dans une miniature du puzzle résolu, les pièces restent seules dans les carrés :
ne pas superposer `a²`, `b²` ou `c²`. L’égalité est présentée séparément à côté
du moulin.

## Modes attendus

Chaque composant doit déclarer les modes qu’il accepte :

- `course` : représentation expliquée et stable ;
- `question` : une ou plusieurs inconnues ;
- `help` : aide visuelle ciblée sans changer la question ;
- `correction` : résultat et étapes visibles ;
- `slideshow` : projection plein écran ;
- `game` : manipulation tactile ;
- `printable` : fiche ou gabarit papier.

## Intégration directe de PythaBarre

Une page élève peut fournir une situation puis lancer directement l’activité.
Le contrat minimal côté navigateur est :

```js
window.MATHSGO_PYTHABARRE_CONFIG = {
  triangle: {letters: "ABC", rightAngle: "A"},
  sides: {AB: 3, AC: 4, BC: "?"},
  unit: "cm",
  mode: "manual",
  autoStart: true
};
```

La même configuration peut être passée à `window.MathsGoPythaBarre.start(config)`
ou `launch(config)`. Pour un lien simple, les paramètres `triangle`, `right`,
`AB`, `AC`, `BC`, `unit`, `mode` et `autostart=1` sont acceptés dans l’URL.
Les identifiants de côté restent stables, même si leur ordre d’affichage change.
Le composant ne collecte aucune donnée élève : la page appelante garde la main
sur le contexte, l’aide et la validation.

Pour intégrer l'outil sans quitter la page, importer `embed.js` puis monter un
composant dans un conteneur :

```js
import {mountPythagoreComponent} from '/studio/components/pythagore/embed.js';

mountPythagoreComponent(document.querySelector('#outil'), {
  type: 'pythabarre',
  config: {triangle: {letters: 'ABC', rightAngle: 'A'}, sides: {AB: 3, AC: 4, BC: '?'}, autoStart: true}
});

mountPythagoreComponent(document.querySelector('#jeu'), {
  type: 'puzzle',
  puzzle: 'bhaskara',
  config: {mode: 'eleves', letters: false}
});
```

Le conteneur est remplaçable par un bloc de question, d'aide ou de correction.
Sur téléphone, la page appelante peut choisir uniquement `type: 'puzzle'` et
laisser une hauteur généreuse pour la manipulation tactile.

Pour le jeu, la page peut utiliser le même principe :

```js
window.MATHSGO_PYTHAGORE_PUZZLE_CONFIG = {
  puzzle: "bhaskara",
  mode: "eleves",
  letters: false
};
```

L’API correspondante est `window.MathsGoPythagorePuzzle.launch(config)` ; le
paramètre URL `puzzle=bhaskara` permet aussi un lien direct.

## Identifiants et suivi futur

Une question qui utilise Pythagore conserve au minimum :

```text
componentId
componentVersion
templateId
questionInstanceId
representationId
seed
parameters
```

Une activité de puzzle peut ensuite enregistrer, sans collecter maintenant :

```text
puzzleId
pieceSetId
moveCount
rotationCount
flipCount
helpOpened
completed
```

Ces champs préparent l’analyse future sans construire aujourd’hui de serveur ni
activer de collecte élève.

## Références visuelles à conserver

Les golden snapshots du composant devront couvrir :

1. PythaBarre sur ordinateur en plein écran ;
2. PythaBarre en portrait sur téléphone ;
3. Moulin complet sur ordinateur ;
4. Moulin mobile empilé `Cible` puis `Pièces` ;
5. un puzzle simple sans retournement ;
6. Bhaskara avec rotation et retournement ;
7. un rendu imprimable sans page blanche supplémentaire.
