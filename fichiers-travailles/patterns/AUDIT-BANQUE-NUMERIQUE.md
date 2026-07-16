# Audit de l’ancienne banque numérique

L’ancien générateur contenait 49 familles. Elles ont toutes été relues avant la construction de la nouvelle entrée « Suites de nombres ».

Le principe retenu est de conserver une famille lorsqu’elle fait travailler un geste distinct. Les variantes qui ne changent que deux constantes sont fusionnées ; une famille sans intention mathématique claire est archivée.

| Ancienne famille | Décision | Nouvelle banque ou justification |
|---|---|---|
| Motifs répétitifs | Intégrée et fusionnée | `Le motif 4, 9, 4, 7, 9` représente les blocs répétitifs variables. |
| Écart constant +k | Intégrée | `La marche de trois`. |
| Écart constant −k | Intégrée | `Le compte à rebours de quatre`. |
| Relatifs ±k | Intégrée | `La traversée de zéro`. |
| ×k constant | Intégrée | `Le double à chaque pas`. |
| Alternés +p puis ±q | Intégrée | `Deux pas qui alternent`. |
| Impairs / pairs | Intégrée | `Deux suites entremêlées`. |
| Carrés parfaits | Intégrée | `Les carrés parfaits`. |
| Nombres triangulaires | Intégrée | `Les nombres triangulaires`. |
| Cubes parfaits | Intégrée | `Les cubes parfaits`. |
| Fractions n/(n+1) | Intégrée | `Les fractions qui approchent un`, avec affichage fractionnaire. |
| × puis + alterné | Intégrée | `Multiplier puis ajouter`. |
| Écarts qui augmentent | Fusionnée | Travaillée plus lisiblement par les triangulaires, les carrés, `n² + 1` et les nombres pentagonaux. |
| Programme ×m ± b | Intégrée | `Doubler puis retirer un`. |
| Fibonacci | Intégrée | `La suite de Fibonacci`. |
| Hors maths | Archivée | Famille trop vague : elle ne garantit ni structure mathématique ni objectif transférable. |
| Bloc répété 3 à 6 | Fusionnée | Réuni avec les motifs répétitifs et les cycles. |
| Cycle mod 4 | Intégrée | `Le cycle de quatre`. |
| Cycle 1→7 | Intégrée | `La roue des sept jours`. |
| Cycle modulo variable | Fusionnée | Le cycle de quatre, la semaine et les cycles d’unités couvrent les idées utiles sans multiplier les variantes. |
| Constante | Intégrée | `Toujours sept`. |
| Décimaux à pas constant | Intégrée | `Les quarts successifs`. |
| Demi-entiers | Fusionnée | Cas particulier du pas décimal constant. |
| Division constante | Intégrée | `La moitié restante`. |
| ×1,1 | Intégrée | `Dix pour cent de plus`. |
| Alternance de signes | Intégrée | `Le balancier des signes`. |
| Impairs carrés / pairs multiples de 4 | Intégrée | `Deux règles selon la parité`. |
| Deux suites 2k / 5·2^(k−1) | Intégrée | `Deux suites entremêlées`. |
| Escalier de répétitions | Intégrée | `Les nombres en paliers`. |
| Ajouter le rang | Intégrée | `Ajouter le rang`. |
| Rectangles n(n+1) | Intégrée | `Les rectangles voisins`. |
| n² + 1 | Intégrée | `Un de plus qu’un carré`. |
| n² + 2 | Fusionnée | Variante de `n² + constante`, sans geste supplémentaire. |
| n² − 1 | Fusionnée | Variante traitable à partir de `n² + 1` et des différences de carrés. |
| Cycle des unités de a×n | Intégrée | `Les unités des multiples de sept`. |
| Puissances modulo 10 | Intégrée | `Les unités des puissances de deux`. |
| PGCD(n,12) | Intégrée | `Les rencontres avec douze`. |
| Récurrence 2u − n | Intégrée | `Doubler puis retirer le rang`. |
| Look-and-say | Intégrée | `La suite qui se raconte`. |
| Pentagonaux | Intégrée | `Les nombres pentagonaux`. |
| Carrés centrés | Intégrée | `Les carrés centrés`. |
| Nombre de diviseurs | Intégrée | `Le nombre de diviseurs`. |
| Somme des chiffres itérée | Fusionnée | La nouvelle famille `La somme des chiffres` porte l’idée essentielle sur l’écriture décimale ; l’itération pourra devenir un défi de séance. |
| Palindromes 11, 22, 33… | Intégrée | `Les doubles de onze`. |
| Même chiffre des unités | Fusionnée | Couvert par les multiples de sept et les cycles modulo 10. |
| Concaténation de 1 | Intégrée | `La tour de uns`. |
| Dernier chiffre de n² | Intégrée | `Les unités des carrés`. |
| Somme des chiffres de n | Intégrée | `La somme des chiffres`. |
| Nombres premiers | Intégrée | `Les nombres premiers`. |

## Résultat du tri

- 40 familles sont proposées dans l’application.
- 8 filtres enseignant remplacent les anciens packs et réglages imbriqués.
- 1 famille a été archivée.
- Les variantes fusionnées restent mathématiquement accessibles dans une famille plus générale ou un prolongement.
- Chaque suite dispose des six gestes : observer, continuer, prévoir loin, généraliser, remonter et analyser une erreur.

## Reprise du moteur de variation

La première intégration avait conservé les quarante familles mais figé un exemplaire de chacune. Ce défaut est corrigé : les familles qui s’y prêtent sont désormais paramétrées. Le moteur renouvelle notamment le terme initial, le pas, le rapport, le taux d’évolution, les deux pas alternés, la valeur constante, le motif périodique, les constantes d’un programme de calcul et le nombre de référence d’un PGCD.

Les tirages sont contrôlés et reproductibles dans un diaporama : chaque diapositive stocke une graine, donc la correction ne change pas lorsqu’on avance puis revient en arrière. Deux diapositives consécutives n’utilisent pas la même famille.

Les trois anciens modes ont également été repris sans créer trois interfaces supplémentaires :

- **Compléter** masque deux termes non consécutifs ;
- **Règle donnée** conserve les premiers termes et demande d’appliquer la transformation ;
- **Questions flash** alterne terme d’un rang, rang possible d’un terme et appartenance parmi un horizon annoncé de premiers termes.

Ils complètent les six gestes algébriques au lieu de les remplacer.
