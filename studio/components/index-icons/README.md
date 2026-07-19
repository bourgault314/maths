# Bibliothèque visuelle des icônes maths&go

Cette collection regroupe les petits dessins réutilisables de l’index
maths&go/Matégo : métronome/automatismes, Thalès, Pythagore, puissances,
géométrie, fractions, statistiques, bouliers et autres représentations.

## Source centrale

Les SVG fixes utilisés par le site sont conservés dans
`assets/js/mathsgo-icon-library.js`. Le catalogue charge cette bibliothèque
pour ses cartes de domaines et de notions ; la page d’accueil réutilise les
mêmes dessins dans sa composition visuelle.

## Aperçu visible

La page publique [Bibliothèque des icônes](../../../outils/bibliotheque-icones.html)
présente les dessins dans une boîte lisible, avec un rappel des cinq icônes
réunies sur l’accueil. Elle inclut notamment les icônes modifiées le 16 juillet 2026 : puissances,
espace/géométrie et les deux compositions fixes du pavage de Truchet.

Chaque nouvelle icône doit conserver un identifiant stable, un SVG vectoriel,
une palette maths&go cohérente et une entrée dans cette bibliothèque avant
d’être réutilisée dans un autre outil.


## Pavages de Truchet

Trois versions sont conservées sous un nom distinct, sans remplacer l’icône
« Espace et géométrie » :

- `truchet-chemin` : composition fixe « Chemin dansant » ;
- `truchet-rosace` : composition fixe « Rosace » ;
- `generative:truchet` : pavage 4 × 4 renouvelé par le moteur aléatoire.

Toutes les tuiles utilisent de vrais quarts de cercle : le rayon vaut exactement
la moitié du côté de la tuile et les raccords se font aux milieux des côtés.
La version générative tire l’orientation de chaque tuile au hasard et met en
évidence un chemin connecté.


## Icônes de fonctions et de grandeurs

L’identifiant public `function` réutilise l’icône `equal-volume-vase` :
le vase accompagné de sa courbe de remplissage. Le catalogue remplace ce
dessin de repli par l’un des six profils calculés dans
`assets/js/daily-vase-curves.js`. Chaque profil définit son rayon intérieur
en fonction de la hauteur ; le volume cumulé, les six couches de même volume,
les points et la courbe `h=f(V)` proviennent tous de ce même modèle. La variante
change avec la date locale et recommence après six jours. L’ancienne machine (x²)
reste conservée sous `function-machine`. Le dessin distinct des deux vases
de même volume porte l’identifiant `equal-volume-vases`.

Ces identifiants doivent rester uniques : deux propriétés homonymes dans la
bibliothèque JavaScript conduiraient la dernière à masquer la première.
