# Conventions visuelles mathématiques — espace Axelle

_Mise à jour : 15 juillet 2026._

Ce fichier conserve discrètement les choix appliqués dans `axelle/assets/content.js`. Il sert de point de comparaison avec la future bibliothèque graphique commune issue du découpage d’Automatismes.

## Principe général

Les objets mathématiques ne doivent pas être redessinés librement dans chaque page. Les tracés locaux d’Axelle sont provisoires : ils doivent être croisés avec les composants canoniques d’Automatismes, puis remplacés par des imports lorsque la bibliothèque commune sera stabilisée.

## Barres et grilles

Ordre de tracé obligatoire :

1. dessiner tous les aplats de couleur, sans bordure ;
2. dessiner une seule fois le contour extérieur ;
3. dessiner chaque séparation intérieure une seule fois.

Cette règle évite les bordures doublées, épaissies ou partiellement recouvertes.

## Fractions

- L’unité complète est indiquée par une véritable accolade au-dessus de toute la barre.
- Le texte `une unité` est centré au-dessus de l’accolade.
- La fraction est composée verticalement : numérateur centré, trait horizontal, dénominateur centré.
- Le nom français est placé à côté de la fraction.
- Codes propres au parcours d’Axelle :
  - demi : jaune ;
  - tiers : violet ;
  - quarts : vert.
- Toutes les parts sélectionnées ont exactement la même couleur ; les autres restent blanches.

Fonctions locales actuelles : `memoTopBrace`, `memoFractionLabel` et `fractionMemo`.

## Multiplication et groupes égaux

Le nombre 12 est représenté deux fois :

- rectangle (4 × 3) : trois rangées de quatre ;
- le même rectangle tourné, (3 × 4) : quatre rangées de trois.

Conventions :

- un rectangle contenant le total 12 est placé au-dessus de chaque représentation ;
- les dimensions 4 et 3 sont codées sur les longueurs ;
- les légendes `3 groupes de 4` et `4 groupes de 3` sont placées sous les rectangles ;
- les deux écritures `3 × 4 = 12` et `4 × 3 = 12` restent visibles ;
- les fonds sont dessinés avant la grille, puis le contour et les séparations sont tracés une seule fois.

## Migration future

Quand les composants d’Automatismes seront extraits et stabilisés :

1. comparer les tracés canoniques avec les fonctions locales d’Axelle ;
2. conserver une seule implémentation par objet mathématique ;
3. faire importer ces composants par Axelle ;
4. supprimer les fonctions locales devenues des doublons ;
5. vérifier les rendus sur téléphone portrait et ordinateur avant publication.
