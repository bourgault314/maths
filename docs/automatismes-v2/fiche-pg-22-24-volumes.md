# PG-22 à PG-24 — Calculer des volumes

**Statut : contenu validé par Gwenaël dans l'échange du 19 juillet 2026.**

## Intention

Faire comprendre le volume comme le nombre d'unités cubes qui remplissent un
solide, puis automatiser des calculs mentaux courts. Chaque question demande
une seule décision et garde le solide visible.

Le noyau DNB est séparé des extensions du collège :

- `PG-22` : cube et pavé droit ;
- `PG-23` : prisme droit, avec aire de la base donnée ;
- `PG-24` : cylindre, sous forme exacte avec π ou avec π ≈ 3.

Les pyramides, les cônes, les conversions de volume et les correspondances
volume-capacité ne font pas partie de cette première tranche.

## Prérequis et limites REP+

- nombres entiers positifs et produits mentalement accessibles ;
- aucune calculatrice ;
- aucune question demandant d'identifier la base ou de compter des couches ;
- une seule unité par question, sans conversion ;
- quatre réponses proposées et une seule correcte ;
- le mot « environ » apparaît dans la consigne, la réponse et la correction
  dès qu'une valeur approchée de π est utilisée ;
- une expression contenant π reste présentée comme une valeur exacte.

## Sens avant formule

Le cours part d'un cube unité de côté 1 cm : son volume est 1 cm³. Un
empilement de cubes unité permet de relier le remplissage au produit de trois
dimensions. Cette représentation sert à comprendre ; elle n'est pas une tâche
d'évaluation.

L'invariant est ensuite rendu verbal :

> volume d'un prisme droit ou d'un cylindre = aire de la base × hauteur.

Le cube et le pavé sont présentés comme les premiers cas de cet invariant,
avec les écritures usuelles adaptées aux élèves.

## Familles de questions

### PG-22/F1 — Cube ou pavé droit

- dessin stable et données explicites ;
- cube : `V = côté × côté × côté` ;
- pavé : `V = longueur × largeur × hauteur` ;
- dimensions choisies dans un corpus contrôlé, résultat entier inférieur ou
  égal à 216 cm³.

### PG-23/F1 — Prisme droit

- aire de la base fournie directement ;
- hauteur fournie ;
- calcul : `V = aire de la base × hauteur` ;
- résultat entier inférieur ou égal à 120 cm³.

### PG-24/F1 — Cylindre

- rayon et hauteur fournis ;
- calcul : `V = π × rayon × rayon × hauteur` ;
- moitié des questions sous forme exacte `kπ cm³` ;
- moitié avec `π ≈ 3`, donc résultat explicitement annoncé « environ ».

## Aide progressive

1. rappeler la formule sans choisir la réponse ;
2. associer chaque donnée à sa place dans la formule ;
3. proposer de calculer d'abord un produit intermédiaire sans en donner la
   valeur.

La figure peut tourner dans l'aide et le cours. La vue de la question reste
fixe pour ne pas ajouter une action spatiale au calcul mental.

## Correction explicite

La correction suit toujours quatre lignes : formule, remplacement des lettres
par les données, calcul, puis conclusion avec unité — et avec « environ » si π
a été approché.

## Contrôles attendus

- conformité et déterminisme des trois générateurs ;
- couverture cube, pavé, prismes triangulaire et pentagonal, cylindre exact et
  cylindre approché ;
- unicité des quatre propositions ;
- justesse de chaque résultat et de chaque distracteur ;
- absence de conversion et de calculatrice ;
- aucune approximation silencieuse ;
- aide sans résultat final ;
- affichage à 375 px et en projection.
