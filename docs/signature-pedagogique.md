# La signature pédagogique maths&go

**Statut : BROUILLON — à corriger et valider par Gwenaël.**
Rédigé le 18 juillet 2026 à partir de l'étude des 127 ressources publiées du
site. Ce document appartient au propriétaire du projet : l'assistant technique
(IA) le tient à jour, mais seul Gwenaël décide de son contenu.

## Décision déjà validée sur la forme de réponse

Dans Automatismes V2, c'est toujours l'élève qui saisit sa réponse. La seule
exception déjà décidée concerne le choix de diviseurs proposés au clic. Les
observations ci-dessous sur la manipulation décrivent la richesse du site,
mais n'autorisent pas un contrat de manipulation comme réponse sans nouvelle
décision explicite pour une notion précise.

## Règle fondatrice du projet

**La pédagogie, c'est Gwenaël.** La technique (moteur, contrats, tests,
publication) peut être déléguée ; les choix pédagogiques, jamais.

Concrètement :

1. Aucun contenu (question, aide, correction, progression, représentation
   visuelle) n'entre dans Automatismes V2 sans validation explicite de
   Gwenaël.
2. Les générateurs écrits pour tester la machine (ex. : le générateur de
   fractions du 17/07/2026) sont des **cartouches d'essai techniques** : ils
   ne préjugent d'aucun choix pédagogique et seront refaits « à la façon
   maths&go » avant toute mise devant élèves.
3. Ce document sert de cahier des charges : tout composant ou générateur de la
   V2 doit pouvoir dire à quel trait de la signature il se rattache.

## La signature observée sur le site

Ce qui distingue maths&go des exerciseurs classiques (à valider/corriger) :

### 1. On voit — des représentations visuelles structurantes

Les mêmes modèles visuels reviennent partout et forment un langage commun :

- **le schéma en barres**, colonne vertébrale du site : ÉquaBarre (équations),
  PythaBarre (Pythagore), AngleBarre (angles), Problèmes en barres, Petit
  Splat en barres, gabarits imprimables de schémas en barres ;
- **les doubles lignes graduées** (proportionnalité, pourcentages) ;
- **les tableaux structurés** (numération, conversions, proportionnalité) ;
- **Splat** (relations et inconnues cachées) ;
- **les jetons, tuiles et disques** (relatifs, calcul littéral, fractions).

→ Pour la V2 : ces modèles doivent devenir des composants officiels,
réutilisables dans les questions, les aides ET les cours — le même dessin
partout, jamais redessiné à la main.

### 2. On manipule — l'action avant l'abstraction

27 outils « manipuler » : l'élève (ou la classe au tableau) déplace, glisse,
apparie, découpe, égalise — jetons de relatifs (paires nulles animées), tuiles
algébriques (expressions puis équations), bandes/disques/mur de fractions,
bouliers (Rekenrek, Soroban, Montessori, Gerbert), glisse-nombres, engrenages,
cubes en 3D, piles de moyennes…

→ Pour la V2 : les manipulations peuvent servir de représentation, d'aide ou
d'activité séparée. Elles ne remplacent pas automatiquement la réponse saisie.
Une exception éventuelle sera décidée notion par notion, sans construire de
contrat générique par anticipation.

### 3. On fabrique — le pont entre l'écran et la classe réelle

20 générateurs produisent du matériel réel à imprimer et découper : jetons de
relatifs (4 variantes de couleurs), tuiles algébriques, bandes et disques de
fractions, rapporteurs sur calque, cartes de nombres, livrets d'automatismes
A5, gabarits d'angles…

→ Pour la V2 : chaque composant visuel doit prévoir sa sortie « impression »
(A4, noir et blanc économique) en plus de l'écran et de la projection.

### 4. On progresse par micro-étapes

La série Rekenrek montre la méthode : doubles niveau 1 → niveau 2 →
presque-doubles → pont de la dizaine → ajouter 9/8 → enlever 9/10… Chaque
outil cible UNE micro-compétence, avec des niveaux nommés et une montée en
difficulté maîtrisée. Même logique dans les variantes des relatifs (addition →
soustraction → soustraction avancée → annulation).

→ Pour la V2 : les gabarits doivent porter des niveaux explicites, et les
parcours enchaîneront ces micro-étapes.

### 5. On projette en classe

Les outils sont pensés pour la vidéoprojection : gros éléments, animations
lisibles de loin, sons discrets, interface sobre qui s'efface derrière le
contenu mathématique. L'application d'origine (DocEval) ne couvrait pas cet
usage ; c'est une différence assumée de maths&go.

→ Pour la V2 : chaque composant doit être testé en « taille projection », pas
seulement sur téléphone et ordinateur.

### 6. On accompagne — aides, cours et corrections intégrés

Direction voulue par Gwenaël (encore inégalement présente dans l'existant) :
des aides pendant l'exercice, du cours relié aux mêmes représentations, des
corrections détaillées qui reprennent le modèle visuel de l'énoncé — pas un
simple « bonne/mauvaise réponse ».

→ Pour la V2 : les contrats prévoient déjà `aide` et `correction` dans chaque
question ; les générateurs devront les remplir systématiquement, avec les
composants visuels officiels.

## Processus de validation pédagogique

1. L'assistant propose (générateur, composant, formulation) → statut
   `brouillon`.
2. Gwenaël voit l'objet en vrai (aperçu, exemple généré), corrige la
   formulation, ajuste les choix visuels.
3. Gwenaël prononce la validation → statut `valide`, daté.
4. Seuls les objets `valide` peuvent apparaître devant élèves.

## Questions ouvertes (réponses attendues de Gwenaël)

- **Fractions** : « je ne fais pas comme tout le monde » — décrire la façon
  maths&go de travailler la simplification (avec quel modèle visuel : bandes,
  disques, mur ? quelle progression ? quelles aides ?), pour refaire le
  générateur d'essai à la bonne façon.
- **Jetons de relatifs** : confirmer vert/rouge comme convention écran
  officielle (le gris = jeton neutralisé), et préciser le rôle de la variante
  « couleurs maths&go » (impression seulement ?).
- Pour chaque future famille migrée : quel modèle visuel, quelle progression,
  quelles aides.
