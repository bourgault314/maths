# Représentations de pourcentage — composant pilote

Statut : `draft`

Ce dossier prépare l'extraction des représentations de pourcentage déjà présentes
dans maths&go. Il ne doit pas contenir une nouvelle interprétation graphique avant
comparaison avec les sources existantes.

## Sources à comparer

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

## Objectif

Créer un composant officiel capable de recevoir des données et de produire les
représentations validées sans recopier le dessin dans chaque question.

Le composant devra séparer :

1. les données mathématiques ;
2. les rôles pédagogiques ;
3. la géométrie calculée ;
4. le rendu SVG web ;
5. les adaptations de taille ;
6. les futures sorties imprimables.

## Variantes à confirmer pendant l'audit

- barre graduée ou colorée ;
- grille de 100 parts ;
- barre d'évolution ;
- affichage avec ou sans accolades ;
- énoncé, aide et correction ;
- rendu compact téléphone et rendu projection.

Cette liste n'est pas encore un contrat final. Une variante ne sera déclarée
officielle qu'après comparaison avec une référence visuelle validée.

## Définition de terminé

Le composant sera considéré comme validé lorsque :

- ses paramètres invalides sont refusés ;
- ses variantes sont identifiées ;
- son rendu correspond aux références existantes ;
- il fonctionne dans une page de prévisualisation ;
- il est contrôlé en 390×844 et 1440×900 ;
- son mode correction ne déplace pas la représentation principale ;
- un premier outil peut l'appeler sans recopier son code ;
- son contrat et ses captures de référence sont documentés.
