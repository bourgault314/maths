# Identité de marque maths&go

Ce dossier décrit l'identité de marque utilisée par les applications et les
outils. Il ne contient pas les composants mathématiques.

## Logo canonique

Le fichier actuellement canonique dans le dépôt est :

`assets/img/mathsgo-logo.png`

Il reste à cet emplacement pour ne pas casser les pages publiques existantes.
Studio le référence ; il ne doit pas en fabriquer une copie différente.

Le logo peut être utilisé dans les accueils, les catalogues, les écrans de
navigation et les applications. Il ne doit pas être injecté automatiquement
dans un schéma mathématique, une fiche imprimable ou un outil lorsqu'il n'a pas
été demandé.

## Règle de modification

Une modification du logo est une décision de marque, pas une retouche
d'interface. Elle doit :

1. partir du fichier source validé ;
2. être contrôlée sur fond clair, fond transparent, téléphone et ordinateur ;
3. recevoir un nouvel identifiant ou une validation explicite ;
4. conserver un seul logo canonique pour les usages généraux.

Les composants de `studio/components/` ne doivent pas importer leur propre copie
du logo.
