# Storyboard NC-01 — Carte interactive commune et première famille

## Statut

**Structure fonctionnelle version 3 validée par Gwenaël le 19 juillet 2026.**

Ce document fixe les zones et les états de la question. Le lancement, l’en-tête de séance, la progression, le score et le bilan sont définis dans `storyboard-parcours-commun.md`. Il ne fixe pas encore les dimensions au pixel près, les animations finales ou les teintes exactes : ces points seront contrôlés sur le prototype réel. Il ne contient aucun code.

## Principes

- le même contenu alimente le mode interactif et le mode projection ;
- le nombre à étudier reste l’élément principal ;
- la réponse de l’élève reste visible après validation ;
- l’aide et la correction s’ouvrent sans détruire l’état de la question ;
- aucune zone ne dépend d’un glisser-déposer ;
- les commandes tactiles mesurent au moins 44 px ;
- la couleur accompagne une forme, une icône ou un texte ; elle ne porte jamais seule l’information.

## Anatomie complète de la carte interactive

La carte possède huit zones stables. Toutes ne sont pas visibles simultanément et certaines peuvent rester vides selon la question.

1. **Contexte local** : domaine et notion de la question courante. Le numéro et la progression appartiennent à l’en-tête commun.
2. **Consigne** : ce que l’élève doit faire, en une formulation courte.
3. **Contenu principal** : nombre, expression, figure, tableau ou autre objet mathématique.
4. **Représentation facultative** : schéma utile présent dans la question, distinct de l’aide.
5. **Zone de réponse** : son contenu dépend du type de réponse.
6. **Zone d’actions** : Aide, Valider ou navigation, sans commandes en double.
7. **Retour** : réponse juste, réponse à revoir ou message empêchant une validation incomplète.
8. **Panneaux temporaires** : aide et correction, qui réutilisent les mêmes objets visuels.

La zone de réponse est toujours prévue par le lecteur, mais elle ne contient pas toujours un champ de saisie :

- sélection de diviseurs : la grille de choix est elle-même la zone de réponse ;
- vrai/faux : les deux boutons constituent la zone de réponse ;
- sélection de nombres ou de justifications : la grille de cartes constitue la zone de réponse ;
- réponse numérique : un afficheur de réponse et le clavier maths&go apparaissent ;
- chiffre manquant à réponses multiples : les chiffres 0 à 9 deviennent des choix sélectionnables, sans demander de taper une liste avec des virgules.

Ainsi, aucune question ne reçoit un champ vide inutile lorsqu’une sélection suffit déjà.

## Décision sur le clavier

### Règle commune

Lorsqu’une réponse numérique doit être saisie, l’application utilise le **clavier maths&go**. Le clavier système du téléphone ou de la tablette ne s’ouvre pas.

- téléphone : clavier fixé en bas de la fenêtre ;
- tablette et TNI : même clavier, centré sous la zone de réponse ;
- ordinateur : clavier maths&go visible et utilisable à la souris, avec prise en charge supplémentaire du clavier physique ;
- clavier physique ou Bluetooth : chiffres, retour arrière et Entrée restent acceptés ;
- aucune détection fragile « mobile ou ordinateur » n’est nécessaire pour déterminer la réponse : le même composant reste disponible partout.

Le clavier n’apparaît que pour une réponse nécessitant une saisie. Il disparaît pour une sélection, un vrai/faux ou une justification.

### Disposition numérique retenue pour NC-01

```text
┌───────┬───────┬───────┐
│   7   │   8   │   9   │
├───────┼───────┼───────┤
│   4   │   5   │   6   │
├───────┼───────┼───────┤
│   1   │   2   │   3   │
├───────┼───────┼───────┤
│   0   │   ⌫   │  OK   │
└───────┴───────┴───────┘
```

- `⌫` efface le dernier chiffre ;
- `OK` valide la réponse et remplace le bouton « Valider » de la carte ;
- le bouton « Aide » reste accessible dans l’en-tête commun lorsque l’aide est disponible ;
- aucune touche décimale, négative ou opératoire n’est ajoutée à NC-01 ; les autres dispositions seront décidées seulement lorsqu’une notion en aura besoin.

Le dépôt possède déjà un objet clavier brouillon avec cette disposition. Il sera audité, testé et relié au lecteur au moment de la fabrication ; aucune seconde implémentation ne sera créée.

### Comportement de la zone de réponse numérique

- la réponse saisie est affichée en grand juste au-dessus du clavier ;
- le clavier réserve sa propre hauteur et ne recouvre jamais la question ni la réponse ;
- sur un écran très bas, la partie question peut défiler tandis que la réponse et le clavier restent accessibles ;
- `OK` est désactivé tant que la réponse est vide ;
- le contenu fixe la longueur maximale autorisée ; une touche supplémentaire est ignorée lorsque cette longueur est atteinte ;
- après validation, la saisie de l’élève reste visible ;
- aucun caractère impossible n’est accepté ;
- toutes les touches possèdent un libellé accessible et un état de focus visible.

### Adaptation aux autres notions

`NC-01` utilise uniquement les chiffres, `⌫` et `OK`. Les futurs profils ajouteront le signe moins ou la virgule seulement lorsque la réponse les autorise. Les chiffres conserveront leurs positions ; une fraction ou une expression utilisera plus tard un composant spécialisé. Le contenu décrira la nature de la réponse, jamais la disposition graphique des touches.

## Première famille — téléphone 375 px

### État 1 — Question

```text
┌─────────────────────────────────┐
│ [×]    1/10      ✓ 0    [Aide] │
│ ███░░░░░░░░░░░░░░░░░░░░░░░░░ │
├─────────────────────────────────┤
│ Nombres et calculs · Divisibilité│
│ Parmi 2, 3, 5, 9 et 10,         │
│ sélectionne tous les nombres    │
│ qui divisent :                  │
│                                 │
│               330               │
│                                 │
│       [ 2 ] [ 3 ] [ 5 ]         │
│       [ 9 ] [10 ] [Aucun]       │
│                                 │
├─────────────────────────────────┤
│                    [ Valider ]  │
└─────────────────────────────────┘
```

Décisions :

- l’en-tête ne tente pas de résumer les notions sélectionnées ;
- la notion courante apparaît comme un repère discret dans la carte ;
- la consigne est au-dessus du nombre ;
- le nombre est centré, très lisible et composé de chiffres pouvant devenir ciblables lorsque l’aide est ouverte ;
- les six réponses forment une grille de trois colonnes et deux lignes, sans défilement horizontal ;
- « Aucun » a le même poids visuel que les cinq nombres ;
- le bouton « Aide » reste en haut et ne se déplace pas lorsqu’un clavier apparaît ;
- la barre d’actions reste accessible en bas de l’écran ;
- si l’aide est `indisponible`, le bouton « Valider » occupe toute la largeur utile.

### État 2 — Aide ouverte

L’aide s’ouvre dans un panneau remontant depuis le bas. Le panneau est refermable et la réponse déjà sélectionnée reste mémorisée derrière lui.

```text
┌─────────────────────────────────┐
│ Aide                         [×] │
├─────────────────────────────────┤
│ Observe le chiffre des unités.  │
│                                 │
│             3   3  [0]          │
│                                 │
│ Additionne tous les chiffres.   │
│                                 │
│ Chiffres choisis : 3 + 3 + 0    │
│ Somme :              [   ]      │
│                                 │
│ Est-elle multiple de 3 ?        │
│ Et de 9 ?                        │
│                                 │
│ [ Revenir à la question ]       │
└─────────────────────────────────┘
```

Décisions :

- appuyer sur le chiffre des unités l’encadre ;
- chaque occurrence d’un chiffre peut être sélectionnée séparément ;
- les chiffres apparaissent dans leur ordre dans la zone somme ;
- la somme reste vide tant que l’élève ne l’a pas saisie ;
- le panneau ne confirme ni la somme ni les diviseurs ;
- le rappel « divisible par 3 ne signifie pas forcément divisible par 9 » peut apparaître sous les deux questions de guidage ;
- aucune aide n’est adaptée secrètement à la bonne réponse de l’instance.

Lorsque l’aide est `ouverte`, ce panneau est présenté dès l’arrivée sur la question. Lorsqu’elle est `disponible`, il s’ouvre seulement après appui sur « Aide ».

### État 3 — Réponse validée

La sélection de l’élève reste affichée. Un message court indique « Réponse juste » ou « Réponse à revoir » sans encore révéler les détails critère par critère.

```text
┌─────────────────────────────────┐
│ … question et nombre conservés …│
│                                 │
│       [ 2✓] [ 3✓] [ 5✓]        │
│       [ 9 ] [10✓] [Aucun]       │
│                                 │
│ Réponse juste                   │
├─────────────────────────────────┤
│ [ Voir la correction ] [Suivant]│
└─────────────────────────────────┘
```

En cas d’erreur, les choix sélectionnés restent marqués mais les bonnes réponses ne sont pas toutes dévoilées avant l’ouverture de la correction.

### État 4 — Correction

La correction utilise le même type de panneau que l’aide, avec deux blocs stables.

```text
┌─────────────────────────────────┐
│ Correction                   [×] │
├─────────────────────────────────┤
│ Chiffre des unités : 0           │
│ 2  : oui — 0 est pair            │
│ 5  : oui — le nombre finit par 0 │
│ 10 : oui — le nombre finit par 0 │
│                                  │
│ Somme : 3 + 3 + 0 = 6            │
│ 3 : oui — 6 est multiple de 3    │
│ 9 : non — 6 n’est pas multiple   │
│     de 9                          │
│                                  │
│ Réponse : 2, 3, 5 et 10           │
├─────────────────────────────────┤
│               [ Suivant ]        │
└─────────────────────────────────┘
```

Le panneau peut défiler verticalement si la hauteur disponible est faible. Aucun contenu ne déborde horizontalement.

## Exemple d’une carte avec réponse numérique

Cette carte ne fait pas partie de la première famille à coder. Elle vérifie que le lecteur commun prévoit correctement les questions futures de `NC-01`.

```text
┌─────────────────────────────────┐
│ [×]    1/10      ✓ 0    [Aide] │
│ ███░░░░░░░░░░░░░░░░░░░░░░░░░ │
├─────────────────────────────────┤
│ Nombres et calculs · Divisibilité│
│ Quel est le plus petit nombre   │
│ de bonbons à retirer pour       │
│ partager 418 bonbons dans       │
│ 3 sachets sans reste ?          │
│                                 │
│ Réponse :          [     1     ]│
│                                 │
├─────────────────────────────────┤
│           clavier 3 × 4         │
│        chiffres, ⌫ et OK         │
└─────────────────────────────────┘
```

Dans la question réelle, le champ affiche uniquement ce que l’élève a saisi ; le `1` ci-dessus illustre l’état après saisie. Le clavier reste visible jusqu’à la validation ou au changement de question.

Pour une question « trouve tous les chiffres possibles », la zone de réponse devient une grille de dix chiffres à cocher et le clavier de saisie ne s’affiche pas.

## Écran projection — format large

### État 1 — Question collective

```text
┌──────────────────────────────────────────────────────────┐
│ [Quitter]             Question 1/10          [Aide]     │
│ █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │
│                                                          │
│ Nombres et calculs · Divisibilité                        │
│ Parmi 2, 3, 5, 9 et 10, quels nombres divisent :         │
│                                                          │
│                            330                            │
│                                                          │
│             2        3        5        9        10        │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Enseignant : [Aide] [Réponse] [Correction] [Suivant]     │
└──────────────────────────────────────────────────────────┘
```

- les nombres proposés sont des repères, pas des boutons de réponse élève ;
- les commandes enseignant sont visuellement secondaires et regroupées dans une barre distincte ;
- le nombre reste visible depuis le fond de la classe.

### État 2 — Aide collective

Un panneau latéral occupe au maximum un tiers de la largeur. La question et le nombre restent visibles à gauche.

Le panneau présente :

- le chiffre des unités encadré ;
- une zone somme encore incomplète ;
- les deux questions « multiple de 3 ? » et « multiple de 9 ? » ;
- aucune conclusion.

### État 3 — Réponse révélée

Les bonnes propositions sont entourées et accompagnées d’une coche. Les autres restent lisibles mais atténuées. L’information ne repose pas uniquement sur le vert.

### État 4 — Correction collective

La moitié gauche conserve le nombre et les propositions. La moitié droite affiche les deux blocs « chiffre des unités » et « somme des chiffres », puis la conclusion. L’enseignant peut revenir à la réponse simple avant de passer à la question suivante.

## Écran du mini-cours

Le mini-cours utilise une carte à la fois, avec une navigation « Précédent / Suivant » et un repère « 1/4 ».

Pour la première carte :

```text
┌─────────────────────────────────┐
│ Partager sans reste         1/4 │
│                                 │
│              [ 12 ]             │
│              ──────             │
│           [4] [4] [4]           │
│                                 │
│            12 = 3 × 4           │
│              reste 0            │
│                                 │
│ 12 est divisible par 3.         │
├─────────────────────────────────┤
│        [Précédent] [Suivant]    │
└─────────────────────────────────┘
```

Le schéma réel est produit par l’objet en barres et non avec des caractères ou une image fixe. Les trois parts partagent le même code couleur turquoise et portent chacune la valeur 4. Le total, l’égalité et le reste sont également écrits : la couleur seule ne suffit pas.

## Représentation des problèmes de partage

La famille des situations concrètes utilisera un écran distinct : quantité source en haut, flèches, sachets ou parts égales en dessous. Cette représentation n’est pas nécessaire dans la première famille « Tous les diviseurs » ; elle sera storyboardée au moment de fabriquer les problèmes.

Le modèle devra pouvoir représenter au minimum :

- un partage exact ;
- un partage impossible avec un reste ;
- la plus petite quantité à retirer pour obtenir un partage exact ;
- de 2 à 10 parts sans rendre l’écran illisible ;
- une version compacte pour téléphone et une version large pour projection.

## Ce que le futur contenu structuré devra dire

Sans fixer encore le contrat JSON, le contenu devra seulement identifier :

- la consigne ;
- le nombre affiché ;
- les choix et la réponse attendue ;
- l’aide ;
- la correction ;
- l’éventuel objet visuel et ses données mathématiques.

Il ne contiendra aucune coordonnée d’écran. Le lecteur choisira la grille mobile, le panneau d’aide ou la disposition projection.

## Ce qui reste volontairement ouvert

- les teintes exactes, en attente de validation de la charte ;
- la typographie et les espacements finaux ;
- la durée des animations ;
- la hauteur exacte des panneaux ;
- la représentation visuelle du retour juste ou faux ;
- le contrat JSON et les noms techniques.

## Décisions validées avant les contrats techniques

Le storyboard est prêt à être contrôlé sur sept décisions visibles :

1. grille de six choix en trois colonnes sur téléphone ;
2. aide et correction dans un panneau remontant sur téléphone ;
3. aide latérale et correction en deux colonnes en projection ;
4. schéma en barres pour la première carte du cours ;
5. zone de réponse dont le contenu change selon le type de question ;
6. clavier maths&go fixe pour toute réponse numérique, sans clavier système sur téléphone ou tablette.
7. lancement, en-tête, progression, réussites et bilan portés par le storyboard commun, sans titre de séance interminable.

Ces sept points sont arrêtés. La configuration de séance, la question instanciée et la trace de réponse sont décrites séparément dans la spécification papier. Le prochain chantier peut donc créer leurs contrats techniques minimaux, avant le générateur.

