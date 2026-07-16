# Bibliothèque visuelle des icônes maths&go

Cette collection conserve les petits dessins réutilisables de maths&go :
icônes fixes du catalogue et familles génératives.

## Sources de vérité

- Les SVG fixes utilisés par le catalogue sont dans la fonction `icon()` de
  `assets/js/catalogue-refonte.js`.
- L’icône CPS autonome est également conservée dans
  `assets/img/icons/cps.svg`.
- Les cinq familles génératives sont dans
  `assets/js/mathgo-generative-icons.js` et documentées dans
  `studio/components/generative-icons/README.md`.

## Aperçu visible

La page [`outils/bibliotheque-icones.html`](../../../outils/bibliotheque-icones.html)
montre les icônes fixes retouchées et cinq générations de chacune des familles
génératives. Elle permet aussi de vérifier leur lisibilité à 48 px.

Chaque nouvelle icône doit garder un identifiant stable, rester vectorielle,
utiliser une palette maths&go cohérente et apparaître dans cette page avant
d’être réutilisée dans un autre outil.
