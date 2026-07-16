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

## Trois composants

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
- le mode manipulable affiche un seul moulin, sur ordinateur comme sur
  téléphone : il porte déjà les pièces sur `a²` et `b²` ainsi que le carré
  `c²` à remplir. La seconde copie n'existe que dans la version imprimable ;
- les puzzles proposés doivent être de vraies découpes distinctes. Une simple
  rotation ou un miroir d’un puzzle existant ne constitue pas une variante.

Les identifiants actuellement publiés sont `perigal`, `bhaskara`, `leitzmann`,
`quatreIdentiques` et `mosaiqueOblique`. `mosaiqueOblique` est une construction
Math&Go en six pièces : quatre pièces viennent du grand carré et deux du petit.
Elle remplace l’ancienne recoupe `perigalSix`, qui ne doit plus être proposée.

## Emplacements et publications

- la page publique du jeu reste
  `outils/plateaux_manipulation/moulin_pythagore.html` dans le dépôt du site
  `bourgault314/maths` ;
- les géométries et contrats réutilisables restent dans
  `studio/components/pythagore` du même dépôt ;
- une question tactile qui réutilise ces composants dans Automatismes doit être
  intégrée uniquement dans le dépôt bêta `bourgault314/mathsgo-automatismes-beta` ;
- le jeu public du Moulin et le module tactile d’Automatismes sont deux usages
  différents d’une même bibliothèque : l’un ne doit pas être déplacé dans
  l’autre dépôt ;
- la branche historique `beta/automatisme-pythagore` du dépôt du site est un
  espace de préparation temporaire, pas le déploiement officiel d’Automatismes.

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

## Règles d’interface à vérifier à chaque modification

- le plein écran est réservé à l’ordinateur et reste masqué sur téléphone ;
- un jeu mobile n’affiche qu’un seul plateau utile, agrandi, sans copie blanche
  ou second moulin empilé ;
- le Moulin interactif n'affiche qu'une seule figure sur tous les écrans ; la
  fiche imprimée affiche deux copies identiques avec les pièces dans `a²` et
  `b²`, afin de découper la première et de conserver la seconde comme support ;
- les commandes mobiles restent réduites au choix de l’activité et aux actions
  nécessaires pour jouer ; les commandes de projection y sont masquées ;
- le retour au menu existe sans ajouter de logo ou de signature répétitive ;
- une consigne qui change conserve une zone de hauteur stable afin que le
  triangle, le moulin ou le tableau ne saute pas pendant l’activité ;
- l’équation de PythaBarre reste visible et se construit sous le tableau sur
  téléphone ; l’œil et le changement rapide d’exemple sont réservés à
  l’ordinateur ;
- après chaque association case/étiquette réussie, les deux sélections sont
  annulées : l’élève recommence volontairement le geste suivant ;
- l’ordre des deux carrés des côtés de l’angle droit est libre dans la relation
  de Pythagore ;
- les énoncés imprimables ne portent ni adresse du site, ni logo ajouté, ni
  bouton de navigation ;
- avant publication, contrôler au minimum ordinateur, plein écran ordinateur,
  téléphone portrait, solution, retournement et recommencement.

## Règles graphiques validées

### Moulin et pièces de Périgal

- le triangle et les trois carrés sont calculés à la même échelle ;
- le rapport historique de la miniature est `1:2:√5` ;
- les petit, moyen et grand carrés sont tous remplis dans le rendu résolu ;
- la vignette publique d'accès garde les pièces dans les deux carrés de départ
  et laisse le carré final vide, afin de ne pas révéler la solution ;
- le rendu résolu historique est conservé dans
  `assets/img/thumbnails/moulin-pythagore-solution.svg`, mais n'est pas proposé
  comme commande dans l'interface élève ;
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

Exemple avec la nouvelle découpe :

```js
window.MathsGoPythagorePuzzle.launch({
  puzzle: "mosaiqueOblique",
  mode: "eleves",
  letters: false
});
```

Le snap de finition utilise les poses exactes mais respecte toujours l’état de
retournement choisi par l’élève : il ne retourne jamais une pièce tout seul.

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
4. Moulin mobile unique avec pièces sur `a²` et `b²`, et `c²` vide ;
5. un puzzle simple sans retournement ;
6. Bhaskara avec rotation et retournement ;
7. un rendu imprimable sans page blanche supplémentaire.
