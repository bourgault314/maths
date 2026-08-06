# NC-01 — Mini-cours et spécimens de la famille « Tous les diviseurs »

## Statut

**Contenu validé par Gwenaël le 19 juillet 2026, puis simplifié avec lui le 6 août 2026.**

Ce document ne contient ni JSON, ni générateur, ni code d’interface. Il fixe les formulations, les réponses, les aides, les corrections et les états d’écran qui serviront ensuite de références reproductibles. La représentation du cours est arrêtée ci-dessous à partir de la validation et des indications visuelles de Gwenaël.

## Partie A — Mini-cours « Critères de divisibilité »

Le cours est court. Il ne crée ni niveau ni palier. Il sert de référence commune aux questions, aux aides et aux corrections.

### Page 1 — Que signifie « divisible par » ?

**Titre :** Divisible : le reste est égal à 0

**Texte élève :**

> Un nombre est divisible par un autre lorsque le reste de la division est nul, c’est-à-dire égal à 0.

> On peut alors partager en parts égales sans qu’il reste d’objet.

**Exemple principal :**

> On peut partager 12 objets en 3 parts égales : chaque part contient 4 objets et il ne reste rien. Donc 12 est divisible par 3.

**Représentation principale retenue : un schéma en barres.**

- première ligne : une barre entière portant la valeur 12 ;
- deuxième ligne : la même longueur partagée en trois segments égaux portant chacun la valeur 4 ;
- sous le schéma : `12 = 3 × 4` et « reste : 0 » ;
- conclusion écrite : « 12 est divisible par 3. »

Ce schéma montre le tout, les trois parts égales et l’absence de reste dans un seul objet compact, lisible sur téléphone comme en projection.

Toutes les pièces mathématiques du schéma sont rectangulaires : barre entière, parts et reste. Aucun coin arrondi ne modifie la lecture des longueurs.

**Action facultative :** appuyer sur « Partager en 3 » pour faire apparaître successivement les trois séparations et les valeurs 4. Aucun glisser-déposer n’est demandé.

### Page 2 — Observer le chiffre des unités

**Titre :** Pour 2, 5 et 10, je regarde le chiffre des unités

**Règles :**

- divisible par 2 : le chiffre des unités est 0, 2, 4, 6 ou 8 ;
- divisible par 5 : le chiffre des unités est 0 ou 5 ;
- divisible par 10 : le chiffre des unités est 0.

**Exemple commun :**

> 230 se termine par 0. Il est donc divisible par 2, par 5 et par 10.

**Représentation :** `23[0]`, où le chiffre des unités est entouré et porte aussi une marque visuelle autre que la couleur.

Le chiffre des unités est encadré dès l'affichage. Les trois règles et la
conclusion complète sont directement lisibles ; aucun clic décoratif n'est
demandé.

### Page 3 — Additionner tous les chiffres

**Titre :** Pour 3 et 9, j’additionne tous les chiffres

**Règles :**

- divisible par 3 : la somme de tous les chiffres est un multiple de 3 ;
- divisible par 9 : la somme de tous les chiffres est un multiple de 9.

**Premier exemple :**

> Pour 372 : `3 + 7 + 2 = 12`. Comme 12 est un multiple de 3 mais pas de 9, 372 est divisible par 3 mais pas par 9.

**Deuxième exemple bref :**

> Pour 729 : `7 + 2 + 9 = 18`. Comme 18 est un multiple de 3 et de 9, 729 est divisible par 3 et par 9.

**Représentation :** chaque chiffre sélectionné apparaît une fois, dans son ordre d’écriture, dans une zone somme.

**Action facultative :** l’élève appuie successivement sur tous les chiffres. La zone conserve les emplacements vides, puis affiche `3 + 7 + 2 = 12` seulement lorsque les trois chiffres ont été sélectionnés. Elle ne conclut pas à la place de l’élève sur la divisibilité.

## Langage visuel commun

Le cours, l’aide et la correction utilisent les mêmes trois objets :

1. **le nombre affiché**, dont chaque chiffre peut être ciblé séparément ;
2. **le repère des unités**, qui encadre le dernier chiffre ;
3. **la zone somme**, qui assemble tous les chiffres dans leur ordre et révèle le total seulement quand ils ont tous été sélectionnés.

Les différences d’état sont visibles par un contour, une icône ou un libellé, jamais par la couleur seule. Toutes les actions restent possibles par appui au doigt, au stylet ou à la souris.

## Décision sur les représentations

Deux objets complémentaires sont retenus, avec des rôles différents.

### Dans le cours : le schéma en barres

Le cours utilise le schéma en barres pour installer le sens mathématique : un tout, découpé en parts égales, avec un éventuel reste. Le dépôt contient déjà un objet `barres.js`, original maths&go et piloté par des données. Il constitue la base à auditer et à adapter lorsque la fabrication visuelle commencera ; son statut actuel reste brouillon tant que Gwenaël n’a pas vu l’aperçu final.

Même si l’exemple du cours est fixe, il ne sera pas enregistré comme une image dessinée à la main. Des données décriront le total 12, trois parts égales de 4 et un reste nul ; l’objet officiel produira le rendu de manière stable.

### Dans les problèmes de partage : le plateau de partage égal

La représentation montrée par Gwenaël — une quantité source, des flèches et plusieurs sachets ou parts identiques — est retenue pour la famille des situations concrètes. Elle permet de donner du sens aux questions « Peut-on partager sans reste ? » et « Combien faut-il retirer au minimum ? ».

Le visuel aperçu dans l’ancienne application sert uniquement de référence pédagogique fournie et validée par Gwenaël. Son ancien code ne sera pas importé dans V2. Un objet indépendant sera reconstruit, lui aussi à partir de données structurées, au moment de fabriquer cette famille.

### Couleurs pédagogiques

Le cours doit employer des couleurs, mais chaque couleur porte une fonction stable :

- bleu foncé : structure, contours et texte principal ;
- turquoise : élément observé ou part égale mise en évidence ;
- orange : reste ou point d’attention ;
- vert : conclusion valide ;
- rouge : erreur ou impossibilité, seulement lorsque nécessaire.

Les teintes exactes viendront de la charte maths&go. Un contour, un motif ou un libellé accompagne toujours la couleur.

## Partie B — Définition de la première famille

### Consigne commune

**Mode interactif :**

> Parmi 2, 3, 5, 9 et 10, sélectionne tous les nombres qui divisent **N**.

**Mode projection :**

> Parmi 2, 3, 5, 9 et 10, quels nombres divisent **N** ?

### Réponse interactive

- six grandes cibles : `2`, `3`, `5`, `9`, `10`, `Aucun` ;
- les cinq nombres peuvent être sélectionnés ensemble ;
- « Aucun » est exclusif ;
- le bouton « Valider » est séparé des choix ;
- aucune validation n’est possible sans choix explicite ;
- le score global est juste seulement si l’ensemble sélectionné est exactement l’ensemble attendu ;
- la correction analyse néanmoins chaque critère séparément ;
- l’aide n’est jamais obligatoire pour répondre.

### Aide commune à la famille

L’aide ne varie pas selon la réponse correcte de l’instance : elle ne révèle donc pas indirectement le résultat.

**Étape 1 — Regarde le chiffre des unités :**

> Observe le chiffre des unités.

Le chiffre des unités est désormais encadré dès l'ouverture. L'aide rappelle
explicitement les trois critères : pour 2, l'unité est 0, 2, 4, 6 ou 8 ; pour
5, elle est 0 ou 5 ; pour 10, elle est 0.

**Étape 2 — Additionne tous les chiffres :**

> Additionne tous les chiffres.

L’élève peut sélectionner chaque chiffre. La zone somme conserve les cases vides, puis calcule le total quand tous les chiffres ont été sélectionnés.

**Rappels de guidage :**

> Pour 3, la somme de tous les chiffres doit être un multiple de 3. Pour 9,
> elle doit être un multiple de 9.

> Plusieurs réponses sont peut-être possibles.

Ces phrases sont des rappels généraux. Elles ne sont pas activées seulement quand elles correspondent à la réponse, afin de ne fournir aucun indice caché.

### Structure commune de la correction

La correction s’affiche en trois temps :

1. **Chiffre des unités** : affichage du dernier chiffre, puis verdict séparé pour 2, 5 et 10.
2. **Somme des chiffres** : affichage du calcul complet, puis verdict séparé pour 3 et 9.
3. **Conclusion** : affichage de l’ensemble exact des diviseurs proposés, ou de « Aucun ».

La correction n’emploie aucune division posée.

## Sept spécimens de référence

Ces nombres servent à valider le contenu et les cas limites. Ils ne constituent pas une liste à recopier dans le futur générateur.

### Spécimen 1 — Aucun diviseur proposé

**Question :**

> Parmi 2, 3, 5, 9 et 10, sélectionne tous les nombres qui divisent 77.

**Réponse attendue :** `Aucun`.

**Aide ouverte :** l’élève peut encadrer 7 comme chiffre des unités et construire `7 + 7 = 14` en sélectionnant les deux chiffres. L’aide ne conclut pas.

**Correction :**

- le chiffre des unités est 7 : 77 n’est divisible ni par 2, ni par 5, ni par 10 ;
- `7 + 7 = 14` : 14 n’est un multiple ni de 3, ni de 9 ;
- conclusion : aucun des nombres proposés ne divise 77.

**Rôle du spécimen :** vérifier le choix volontaire « Aucun ».

### Spécimen 2 — Un seul diviseur : 2

**Question :**

> Parmi 2, 3, 5, 9 et 10, sélectionne tous les nombres qui divisent 124.

**Réponse attendue :** `2`.

**Aide ouverte :** l’élève peut encadrer 4 et construire `1 + 2 + 4 = 7` en sélectionnant les trois chiffres.

**Correction :**

- le chiffre des unités est 4 : 124 est divisible par 2, mais pas par 5 ni par 10 ;
- `1 + 2 + 4 = 7` : 7 n’est un multiple ni de 3, ni de 9 ;
- conclusion : parmi les nombres proposés, seul 2 divise 124.

**Rôle du spécimen :** vérifier une réponse unique fondée sur la parité.

### Spécimen 3 — Un seul diviseur : 5

**Question :**

> Parmi 2, 3, 5, 9 et 10, sélectionne tous les nombres qui divisent 145.

**Réponse attendue :** `5`.

**Aide ouverte :** l’élève peut encadrer 5 et construire `1 + 4 + 5 = 10` en sélectionnant les trois chiffres.

**Correction :**

- le chiffre des unités est 5 : 145 est divisible par 5, mais pas par 2 ni par 10 ;
- `1 + 4 + 5 = 10` : 10 n’est un multiple ni de 3, ni de 9 ;
- conclusion : parmi les nombres proposés, seul 5 divise 145.

**Rôle du spécimen :** distinguer le critère par 5 du critère par 10.

### Spécimen 4 — Un seul diviseur : 3

**Question :**

> Parmi 2, 3, 5, 9 et 10, sélectionne tous les nombres qui divisent 123.

**Réponse attendue :** `3`.

**Aide ouverte :** l’élève peut encadrer 3 et construire `1 + 2 + 3 = 6` en sélectionnant les trois chiffres.

**Correction :**

- le chiffre des unités est 3 : 123 n’est divisible ni par 2, ni par 5, ni par 10 ;
- `1 + 2 + 3 = 6` : 6 est un multiple de 3, mais pas de 9 ;
- conclusion : parmi les nombres proposés, seul 3 divise 123.

**Rôle du spécimen :** distinguer « divisible par 3 » de « divisible par 9 ».

### Spécimen 5 — Les diviseurs 3 et 9

**Question :**

> Parmi 2, 3, 5, 9 et 10, sélectionne tous les nombres qui divisent 117.

**Réponse attendue :** `3` et `9`.

**Aide ouverte :** l’élève peut encadrer 7 et construire `1 + 1 + 7 = 9` en sélectionnant les trois chiffres.

**Correction :**

- le chiffre des unités est 7 : 117 n’est divisible ni par 2, ni par 5, ni par 10 ;
- `1 + 1 + 7 = 9` : 9 est un multiple de 3 et de 9 ;
- conclusion : 3 et 9 divisent 117.

**Rôle du spécimen :** vérifier les réponses simultanées 3 et 9.

### Spécimen 6 — Plusieurs diviseurs, mais pas 9

**Question :**

> Parmi 2, 3, 5, 9 et 10, sélectionne tous les nombres qui divisent 330.

**Réponse attendue :** `2`, `3`, `5` et `10`.

**Aide ouverte :** l’élève peut encadrer 0 et construire `3 + 3 + 0 = 6` en sélectionnant les trois chiffres. Chaque occurrence du chiffre 3 est sélectionnable séparément et le zéro reste visible dans la somme.

**Correction :**

- le chiffre des unités est 0 : 330 est divisible par 2, par 5 et par 10 ;
- `3 + 3 + 0 = 6` : 6 est un multiple de 3, mais pas de 9 ;
- conclusion : 2, 3, 5 et 10 divisent 330 ; 9 ne le divise pas.

**Rôle du spécimen :** vérifier plusieurs bonnes réponses, la présence du zéro et la distinction entre 3 et 9.

### Spécimen 7 — Tous les diviseurs proposés

**Question :**

> Parmi 2, 3, 5, 9 et 10, sélectionne tous les nombres qui divisent 90.

**Réponse attendue :** `2`, `3`, `5`, `9` et `10`.

**Aide ouverte :** l’élève peut encadrer 0 et construire `9 + 0 = 9` en sélectionnant les deux chiffres.

**Correction :**

- le chiffre des unités est 0 : 90 est divisible par 2, par 5 et par 10 ;
- `9 + 0 = 9` : 9 est un multiple de 3 et de 9 ;
- conclusion : les cinq nombres proposés divisent 90.

**Rôle du spécimen :** vérifier le cas « toutes les réponses » sans rendre ce cas fréquent.

## Invariants mathématiques à respecter plus tard

- une réponse contenant 9 contient toujours 3 ;
- une réponse contenant 10 contient toujours 2 et 5 ;
- une réponse contenant à la fois 2 et 5 contient donc toujours 10 ;
- « seulement 9 » et « seulement 10 » sont impossibles ;
- le chiffre 0 participe à la somme des chiffres, même s’il ne change pas sa valeur ;
- « Aucun » n’est correct que si aucun des cinq critères ne convient ;
- la somme des chiffres est calculée une seule fois puis utilisée pour 3 et 9.

## Déroulé des écrans

### Mode interactif

1. La question, le nombre et les six choix sont visibles.
2. Si l’aide est `disponible`, le bouton « Aide » ouvre les deux blocs « unités » et « somme ».
3. L’élève sélectionne sa réponse finale puis appuie sur « Valider ».
4. Le résultat global apparaît sans masquer sa sélection.
5. La correction détaillée peut être ouverte et reprend le même encadrement des unités et la même zone somme.

L’aide ouverte ne déplace pas définitivement la réponse hors de l’écran. Sur un téléphone étroit, elle peut s’ouvrir dans un panneau refermable ; la disposition exacte sera décidée dans le futur storyboard.

### Mode projection

1. **Question** : nombre et liste des cinq diviseurs proposés, sans commande de réponse élève.
2. **Aide facultative** : l’enseignant révèle le repère des unités et la zone somme, sans conclusion.
3. **Réponse** : les diviseurs corrects sont mis en évidence.
4. **Correction** : les cinq critères sont expliqués, puis la conclusion est reformulée.

La révélation de la réponse ne dépend pas d’un clic sur les diviseurs : les commandes appartiennent à l’enseignant.

## Validation enregistrée

Gwenaël valide :

1. les trois pages du mini-cours, avec le schéma en barres rectangulaire comme représentation principale de la première page ;
2. les formulations communes de la question ;
3. les sept spécimens et leurs corrections ;
4. la zone somme qui affiche le résultat après sélection de tous les chiffres, sans conclure sur la divisibilité ;
5. l’absence complète de glisser-déposer ;
6. les quatre états successifs de la projection ;
7. la règle selon laquelle les aides restent générales et ne changent pas en fonction de la bonne réponse ;
8. l’usage de couleurs pédagogiques et de représentations stables produites par des objets pilotés par des données.

Les storyboards de la carte et du parcours commun sont désormais arrêtés. L'étape suivante est la définition des contrats techniques minimaux, avant le générateur et le lecteur.

