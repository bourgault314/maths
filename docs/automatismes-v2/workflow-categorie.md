# La méthode, catégorie par catégorie

## L'unité de travail est la notion atomique

Pas le module. « Fractions » n'est pas une notion : reconnaître, simplifier,
comparer, additionner, prendre une fraction d'une quantité, multiplier,
diviser, passer à l'écriture décimale — ce sont huit notions distinctes, qui
se travaillent, se valident et se migrent séparément.

Un module n'est déclaré entièrement reconstruit que lorsque **toutes** ses
notions ont quitté le noyau hérité.

## Qui fait quoi

| | Rôle |
| --- | --- |
| **Gwenaël** | Décide. Notions, formulations, valeurs pertinentes, progressions, erreurs d'élèves, aides, représentations, couleurs, interface, publication. |
| **GPT** | Cherche et propose. Programmes, annales, familles de questions, cahiers des charges, plans de tests. Relit en lecture seule. |
| **Claude** | Construit. Implémente le validé, écrit les tests, documente, ouvre les PR, corrige. |

**Aucun contenu ne reçoit le statut `valide` sans une décision explicite de
Gwenaël.** C'est vérifié par un test automatique, pas seulement par la
bonne volonté.

## Les six lignes d'un point

Pour chaque notion atomique, on écrit six lignes — dont deux appartiennent à
Gwenaël et à personne d'autre :

1. **Ce qui existe** dans la banque héritée (inventaire des notions seulement).
2. **Ce que Gwenaël a déjà ajouté** par-dessus (aides, visuels, reformulations).
3. **Le générateur neuf** — Claude.
4. **Les énoncés neufs** — *son* vocabulaire. **Gwenaël.**
5. **Les distracteurs neufs** — *ses* erreurs d'élèves observées. **Gwenaël.**
6. **Visuel et aide** — Claude, d'après ses objets.

Les lignes 4 et 5 sont le cœur du sujet : c'est là que se joue « changer le
vocabulaire, varier, être originaux ».

## Les étapes

1. **Recherche** — GPT : programme officiel, annales, ce qui est réellement
   tombé au DNB.
2. **Inventaire** — quelles notions atomiques cette catégorie recouvre.
3. **Comparaison locale** — ce que l'existant contient déjà, en distinguant
   trois axes (algorithme / visuel / énoncé) et non un seul verdict global :
   le cas le plus fréquent est mixte — idée mathématique gardée, dessin refait,
   contexte réécrit.
4. **Proposition des familles** de questions — GPT.
5. **Validation** — Gwenaël. Rien ne se code avant.
6. **Cahier des charges** — GPT.
7. **Développement** — Claude : générateur, gabarits, notions, aides, visuels.
8. **Tests** — les six familles de [tests.md](tests.md).
9. **Audit de la PR** — GPT, en lecture seule.
10. **Validation visuelle** — Gwenaël, sur son téléphone et au vidéoprojecteur.
11. **Activation** — la notion passe `valide` ; **Gwenaël seul** pose cet état.

## La quatrième option : retirer

À chaque ouverture de catégorie, quatre issues sont possibles pour une
notion — pas trois :

- **conserver** ce qui est déjà à nous ;
- **adapter** ce qui a besoin d'un ajustement technique ;
- **reconstruire** ce qui doit l'être ;
- **retirer** — décider que cette notion ne fait pas partie de la V2.

Quarante-trois modules multipliés par plusieurs notions et onze étapes, cela
représente des années. La quatrième option n'est pas un aveu d'échec : c'est
ce qui rend le chantier finissable. **C'est une décision de Gwenaël.**

## La méthode « salle blanche »

Pour reconstruire, on **ne relit pas** la version héritée. On repart du
programme officiel et des annales.

La raison est pratique, pas juridique : relire un énoncé avant d'en écrire un
autre ancre les formulations, et on recopie sans le vouloir. Le seul usage
légitime de l'ancienne banque est l'**inventaire des notions**.

Ce qui appartient à quelqu'un : le code d'un générateur, les tracés SVG, la
structure des tableaux, les formulations rédigées, les contextes narratifs
inventés, la sélection et l'organisation. Ce qui n'appartient à personne : les
mathématiques — propriétés, méthodes, valeurs, énoncé fonctionnel nu.

Voir [`docs/provenance-et-independance.md`](../provenance-et-independance.md).

## Ce qu'on mesure

La couverture se mesure en **notions du programme validées**, jamais en
anciens énoncés reproduits. Reproduire 478 questions héritées ne serait pas un
succès : ce serait avoir refait le même outil.
