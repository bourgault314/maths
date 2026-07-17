# Représentations de pourcentage — composant pilote

Statut : `prototype`

Ce dossier contient la première brique réellement réutilisable extraite des
sources existantes de maths&go. Le moteur reçoit des données mathématiques et
retourne un SVG déterministe ; il ne connaît ni les exercices, ni les
diapositives, ni le téléphone.

## Ce qui existe maintenant

- `renderer.js` : rendu autonome des barres de fractions et de pourcentages ;
- `percentageTablePresets` : jeux de données de démonstration ;
- `preview.html` : prévisualisation des modes aide, question et correction ;
- `contract.v1.draft.json` : contrat de données de travail.

Le premier périmètre est volontairement limité aux barres de parts égales,
dont la grille de 100 parts. Les barres d'évolution, les doubles lignes
graduées, les sorties imprimables et les références visuelles restent à auditer
avant d'être déclarées officielles.

## Sources comparées

- `outils/pourcentages_exerciceur.html`
  - `drawSVGBar`
  - `draw100Parts`
  - `drawEvolutionBar`
  - `drawBrace`
  - les configurations de `viewBox`
- `outils/_gabarits_pourcentages.tex`
- `outils/_gabarit_pourcentages_double_ligne_graduee.tex`
- `auto/scripts/shared/visuals/arithmetic/fraction-percent-bar.js`
- `auto/dev/visual-library.html`

## Règle d'architecture

Les données, la pédagogie, la géométrie, le SVG et l'adaptation aux formats
doivent rester séparés. Une fiche ou une question appellera ce composant avec
un contrat ; elle ne recopiera pas son code de dessin.

## Définition de terminé

Le composant sera considéré comme validé lorsque :

- ses paramètres invalides sont refusés ;
- toutes ses variantes sont identifiées ;
- son rendu correspond aux références visuelles validées ;
- il est contrôlé en 390×844 et 1440×900 ;
- son mode correction ne déplace pas la représentation principale ;
- un premier outil peut l'appeler sans recopier son code ;
- son contrat et ses captures de référence sont documentés.
