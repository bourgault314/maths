# Icônes génératives maths&go

Ces cinq systèmes originaux appliquent un **hasard contrôlé** : la règle,
la palette et les bornes restent stables ; seule la graine change. Une même
graine redonne exactement la même géométrie.

| Identifiant | Nom | Invariants principaux | Variables bornées |
| --- | --- | --- | --- |
| `petals` | Rosace indocile | centre commun, couronne de pétales | 8 à 11 pétales, longueur, petit écart angulaire |
| `weave` | Tissage affine | 5 fils horizontaux, 4 verticaux, bords opposés | correspondances, courbure, épaisseur |
| `mosaic` | Mosaïque vivante | grille 4 × 4, bord fixe, sommets partagés | points intérieurs à ±6,5 unités, couleurs |
| `orbits` | Orbites modulaires | centre commun, ellipses et cycles | 4 ou 5 orbites, inclinaison, nœuds |
| `bloom` | Éclosion discrète | spirale en racine carrée | 30 à 38 formes, angle, taille progressive |

## Règle de la Mosaïque vivante

Le carré de 134 unités est partagé en 4 × 4 cases : le côté théorique d’une
case mesure donc 33,5 unités. Les 16 points du bord restent fixes. Chacun des
9 points intérieurs peut se déplacer horizontalement et verticalement d’au
plus 6,5 unités, soit environ 19 % du côté d’une case. Les points voisins sont
ensuite reliés et chaque case devient un quadrilatère.

Cette borne est volontairement bien inférieure à la moitié d’une case : elle
préserve l’ordre des lignes et empêche les cellules de se retourner. Pour une
construction sur papier, on peut retenir la règle plus simple « déplacement
maximal : un cinquième du côté d’une case ».

La géométrie est assez lisible pour être retrouvée par des élèves. La règle de
couleur est plus difficile : un décalage de palette suit les lignes et les
colonnes, puis reçoit une petite variation aléatoire. Cela permet deux niveaux
de questions : retrouver la construction, puis proposer une loi de coloriage.

## API

Charger le composant :

```html
<script src="/assets/js/mathgo-generative-icons.js"></script>
```

Créer une génération déterministe :

```js
const svg = MathsGoGenerativeIcons.createSvg("mosaic", {
  seed: "classe-5e2|2026-07-16"
});
document.querySelector(".emplacement").appendChild(svg);
```

Créer la même famille pour une personne pendant toute une journée :

```js
const svg = MathsGoGenerativeIcons.createPersonalDailySvg("mosaic");
```

Choisir aussi automatiquement la famille du jour :

```js
const family = MathsGoGenerativeIcons.personalDailyFamily();
const svg = MathsGoGenerativeIcons.createPersonalDailyIcon();
```

L’identifiant aléatoire utilisé pour cette personnalisation reste dans le
`localStorage` du navigateur. Il n’est ni transmis ni associé à un compte.

## Emplacements recommandés

1. Une carte « Votre figure du jour » dans un second menu ou un espace de
   découverte : c’est l’usage le plus naturel.
2. Une amorce de cours projetée, avec la question de l’invariant ou de la
   règle cachée.
3. Un badge quotidien dans le profil local d’un élève, sans classement ni
   valeur de réussite.
4. Une activité de reproduction sur papier, surtout pour la mosaïque.

Éviter de remplacer toutes les icônes de navigation : les repères fixes sont
plus efficaces pour s’orienter. Une seule icône quotidienne coûte quelques
dizaines d’éléments SVG et ne demande ni image, ni requête réseau, ni calcul
serveur. La galerie en affiche volontairement 25 pour les tests ; ce volume ne
doit pas être chargé sur toutes les pages du site.
