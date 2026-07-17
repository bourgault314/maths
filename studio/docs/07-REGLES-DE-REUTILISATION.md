# Règles de réutilisation — Studio maths&go

Statut : `draft`

Ce document définit la barrière entre l'IA, les données et les rendus. Il
devra être validé avant de considérer Studio comme un moteur de production.

## Règle centrale

L'IA ne redessine pas un objet validé. Elle sélectionne un identifiant de
composant, remplit son contrat et laisse le moteur produire le rendu.

Le flux cible est :

`demande → définition JSON → validation du contrat → composant enregistré → rendu → contrôle visuel`

Une fiche, un exercice ou un parcours ne doit pas contenir un SVG recopié à la
main pour remplacer un composant existant.

## Ce que l'IA peut produire

- une sélection de composant ;
- des paramètres mathématiques ;
- le rôle pédagogique : cours, question, aide ou correction ;
- un gabarit de fiche ou de diaporama ;
- une graine aléatoire lorsque le contrat l'autorise.

## Ce que le moteur doit produire

- les coordonnées ;
- les traits, couleurs, espacements et proportions ;
- les variantes téléphone, ordinateur, projection et impression ;
- le rendu SVG ou HTML ;
- les contrôles d'accessibilité et de débordement.

Un composant en statut `draft` ou `review` ne doit pas être utilisé comme
composant officiel dans une fiche publiée.

## Typographie mathématique

La préférence « x arrondi » ne doit pas rester une consigne répétée dans les
prompts. Elle doit être portée par un composant de typographie mathématique :

- l'identifiant canonique du x arrondi doit pointer vers le glyphe validé ;
- les équations doivent être construites à partir de tokens ou d'une structure
  mathématique, pas d'une chaîne libre que l'IA dessine ;
- les lettres A, B et C dans les figures restent une règle distincte à valider ;
- une carte de référence visuelle doit empêcher le remplacement silencieux du
  glyphe par un X typographique.

## Repères

Un repère sera un composant paramétrique, par exemple avec :

- bornes et pas des axes ;
- quadrillage et graduations ;
- labels des axes ;
- points, vecteurs, droites ou courbes ;
- mode question, aide et correction ;
- format de sortie.

L'IA fournira ces paramètres. Elle ne calculera pas elle-même les pixels du
repère dans chaque fiche.

## Icônes et logo

Les icônes ont des identifiants stables et une galerie visible. Le logo est un
asset de marque et non une icône mathématique : il possède son propre manifeste
et ne doit pas être dupliqué dans chaque composant.
