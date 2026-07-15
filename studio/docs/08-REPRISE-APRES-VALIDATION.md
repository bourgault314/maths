# Reprise du pack de représentations — 16 juillet 2026

## Où reprendre

- Branche : `agent/representation-components-four-families`
- PR brouillon : https://github.com/bourgault314/maths/pull/8
- Base publique : `main` — ne pas fusionner avant validation visuelle.

## Ce qui est déjà livré

Le pack `studio/components/representation-pack-v1.js` rend de façon déterministe :

- les jetons relatifs ;
- les droites graduées simples et doubles ;
- les bandes et grilles de fractions ;
- les doubles droites et barres de pourcentages.

Le contrat est dans `studio/schemas/representation-components.v1.json`.
L’adaptateur est dans `studio/adapters/automatismes/`.
L’aperçu est dans `studio/preview/representations.html`.
Le test est dans `studio/tests/representations/representation-pack.test.js`.

## Vérification à faire

1. Ouvrir la PR et regarder les fichiers ajoutés.
2. Ouvrir la prévisualisation sur ordinateur et téléphone.
3. Contrôler en priorité :
   - jetons verts/rouges, bordure noire et texte `+1` / `−1` ;
   - écritures placées au-dessus des groupes ;
   - paires nulles entourées et marquées `0` ;
   - graduations régulières et absence de barre verticale au bout des flèches ;
   - fraction 3/4, grille 16/20 ;
   - pourcentage 75 % sur double droite et 37,5 % sur barre.
4. Ne pas modifier encore les questions ou l’aléatoire d’Automatismes.

## Suite après validation

Raccorder un seul module réel d’Automatismes à l’adaptateur, comparer avec son rendu actuel, puis migrer famille par famille. Les graphismes ne doivent pas être recopiés dans `/auto`.
