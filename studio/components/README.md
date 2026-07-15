# Composants de représentation maths&go

Le premier pack exécutable est [`representation-pack-v1.js`](representation-pack-v1.js).
Il fournit des rendus SVG déterministes pour :

- les jetons de nombres relatifs ;
- les droites graduées simples et doubles ;
- les bandes et grilles de fractions ;
- les doubles droites et barres de pourcentages.

La page [`../preview/representations.html`](../preview/representations.html)
permet de vérifier les exemples sans ouvrir Automatismes.

## Principe

Le moteur de questions fournit une définition JSON. Le composant vérifie les
paramètres puis rend le SVG. Il n'y a pas de génération libre de dessin dans
les modules d'Automatismes.

Les quatre familles de ce premier lot restent volontairement petites et
composables. Les variantes pédagogiques plus riches — soustraction complète,
modèles inversés, écritures multiples, fractions équivalentes et cas au-delà de
100 % — seront ajoutées comme paramètres validés du même composant, pas comme
des copies de pages.
