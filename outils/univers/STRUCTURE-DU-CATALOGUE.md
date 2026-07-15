# Structure finale des univers maths&go

Ce dossier prépare les univers qui n’avaient pas encore leur propre répertoire.
Le catalogue public continue pour l’instant à afficher directement leurs outils ; ces
répertoires pourront ensuite recevoir un `index.html` illustré, sans déplacer les outils
existants ni casser leurs adresses.

Cette architecture a été consolidée le 15 juillet 2026 à partir du nouveau programme
officiel de mathématiques du cycle 4 (BO n° 10 du 5 mars 2026). Le catalogue ne
reproduit pas chaque chapitre scolaire : il organise les outils en univers assez précis
pour être utiles, sans multiplier les cases artificielles.

Référence : <https://www.education.gouv.fr/bo/2026/Hebdo10/MENE2602912A>

## Univers déjà dotés d’un index ou d’outils

- Numération : `../bouliers/index.html`
- Fractions et nombres rationnels : `../fractions/index_fractions.html`
- Nombres relatifs : `../nombres_relatifs/index.html`
- Calcul mental et automatismes : `../automatismes/index.html`
- Conversions : `../conversions/index.html`
- Calcul littéral et algèbre : `../tuiles_algebriques/index.html`
- Patterns : `../patterns.html`
- Angles : `../angles/index.html`
- Jeux de stratégie : `../club_maths/index.html`
- Explorations mathématiques : `../engrenages/index.html` et `../club_maths/index.html`

## Univers préparés dans ce dossier

- Nombres entiers et divisibilité : `divisibilite-pgcd/`
- Puissances : `puissances/`
- Racines carrées : `racines-carrees/`
- Proportionnalité et ratios : `proportionnalite-ratios/`
- Pourcentages : `pourcentages/`
- Fonctions : `fonctions/`
- Aires et périmètres : `aires-perimetres/`
- Temps et durées : `temps-durees/`
- Équations et représentations : `equations-representations/`
- Schémas en barres et problèmes : `schemas-barres/`
- Repérage : `reperage/`
- Transformations : `transformations/`
- Triangles : `triangles/`
- Parallélogrammes : `parallelogrammes/`
- Espace, solides et patrons : `espace-patrons-constructions/`
- Pythagore : `pythagore/`
- Statistiques : `statistiques-representations/`
- Moyennes : `moyennes/`
- Probabilités : `probabilites/`
- Pensée informatique : `pensee-informatique/`

## Principe de classement

Un outil ne possède qu’un seul fichier physique, mais peut apparaître dans plusieurs
univers grâce aux métadonnées du catalogue. Par exemple, PythaBarre apparaît dans
Pythagore et dans Schémas en barres. Cela évite les doublons et permet les mises à jour
sans incohérence.

La racine carrée possède son univers propre, mais les outils qui l’abordent dans le
théorème de Pythagore pourront être visibles dans les deux univers. De même, le
repérage reste rattaché à Espace et géométrie, tout en pouvant accueillir des outils
également classés dans Fonctions. Les univers CPS et Neurosciences ne sont pas créés à
ce stade.
