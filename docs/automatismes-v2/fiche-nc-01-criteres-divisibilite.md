# Fiche pédagogique NC-01 — Critères de divisibilité par 2, 3, 5, 9 et 10

## Statut

**Questions, aides et corrections validées, fabrication technique autorisée par
Gwenaël le 19 juillet 2026. Mini-cours définitif reporté le 20 juillet 2026.**

Cette fiche fixe le contenu avant toute programmation. La validation pédagogique et l'autorisation d'ouvrir la fabrication technique sont deux décisions distinctes ; elles sont désormais toutes les deux acquises.

## Ancrage dans le parcours DNB

- Cible officielle DNB 2026 : « Appliquer les critères de divisibilité par 2, 3, 5, 9. »
- Ligne de la carte : `DNB26-09`.
- Micro-notion maths&go : `NC-01`.
- Domaine maths&go : nombres et calculs.
- Correspondance programme : automatisme `3-09`.
- Place dans l’ordre de fabrication : rang 1 sur 88.

### Cas du critère par 10

Le critère par 10 ne figure pas dans cette cible officielle, mais Gwenaël choisit de l’intégrer immédiatement pour obtenir un module cohérent et réutilisable avec ses élèves, notamment en cinquième.

- `NC-01` travaille donc **2, 3, 5, 9 et 10** dans les mêmes familles de questions.
- Le critère par 10 reste présent lorsque le module est lancé depuis le parcours **DNB** : aucun filtre supplémentaire n’est demandé à l’utilisateur.
- Dans les données de suivi, 2, 3, 5 et 9 portent le statut `dnb_officiel`, tandis que 10 porte le statut `complement_mathsgo`.
- Cette étiquette assure la transparence de la couverture sans modifier l’expérience pédagogique.

## Savoir-faire visé

À partir d’un entier positif écrit en base dix, l’élève applique sans calculatrice les critères de divisibilité par 2, 3, 5, 9 et 10, puis interprète correctement « divisible par » comme « partageable en parts égales sans reste ».

L’élève mobilise :

- le chiffre des unités pour 2, 5 et 10 ;
- la somme de tous les chiffres pour 3 et 9 ;
- le fait qu’un nombre peut vérifier plusieurs critères à la fois ;
- le fait que divisible par 9 implique divisible par 3, mais que la réciproque est fausse.
- le fait que divisible par 10 implique divisible par 2 et par 5.

## Prérequis

- reconnaître le chiffre des unités ;
- distinguer nombre et chiffre ;
- reconnaître les chiffres pairs ;
- additionner mentalement quelques chiffres ;
- connaître les multiples simples de 3 et de 9 ;
- comprendre les mots « diviseur », « divisible par » et « sans reste ».

## Découpage retenu : six familles de questions

La variété est nécessaire pour un entraînement fréquent. Elle vient de six tâches mathématiques différentes, pas de niveaux ou de paliers.

### F1 — Appliquer un critère précis

Question flash :

> 438 est-il divisible par 3 ?

Réponse simple : **Vrai / Faux** ou **Oui / Non**. Aucune justification rédigée n’est exigée. La correction rappelle toujours l’indice utilisé.

Cette famille vérifie l’application rapide d’un critère isolé. Les critères 2, 3, 5, 9 et 10 sont équilibrés sur une série.

### F2 — Trouver tous les diviseurs proposés

Question centrale :

> Parmi 2, 3, 5, 9 et 10, lesquels divisent 330 ?

Réponse par sélection multiple parmi **2**, **3**, **5**, **9**, **10** et **Aucun**.

- plusieurs choix peuvent être corrects ;
- « Aucun » est exclusif ;
- la réponse est juste si l’ensemble choisi est exactement l’ensemble attendu ;
- la correction examine les cinq critères, même si la réponse globale est correcte.

Cette famille est la première à fabriquer techniquement, car elle couvre les cinq critères et correspond à l’exception de réponse au clic déjà prévue pour le choix de diviseurs.

### F3 — Sélectionner plusieurs nombres

Question en grille :

> Sélectionne tous les nombres divisibles par 3.

L’élève choisit plusieurs nombres dans une petite grille. Il ne les déplace pas dans des catégories exclusives.

- la grille reste courte et lisible sur téléphone ;
- elle peut contenir aucune, une ou plusieurs bonnes réponses si la consigne le permet explicitement ;
- les nombres sont choisis pour obliger à appliquer le critère, sans indice graphique artificiel ;
- le glisser-déposer n’est jamais l’unique interaction.

Cette sélection tactile constitue une forme de réponse propre à `NC-01`, à consigner avant son introduction dans le contrat technique.

### F4 — Juger une affirmation : vrai ou faux

Une phrase très courte présente un raisonnement d’élève :

> Lina dit : « 372 est divisible par 9 car 3 + 7 + 2 = 12. » Vrai ou faux ?

Deux formes simples alternent dans cette même famille :

- répondre **Vrai** ou **Faux**, puis lire l’explication ;
- appuyer sur la justification qui identifie correctement l’erreur ou le raisonnement juste.

La seconde forme ne devient pas une étape obligatoire après chaque vrai/faux. Elle sert lorsqu’on veut vérifier que l’élève comprend la raison, sans lui demander une rédaction longue.

Les affirmations vraies et fausses sont équilibrées. Les erreurs travaillées proviennent de mécanismes pédagogiques explicites :

- regarder le dernier chiffre pour 3 ou 9 ;
- additionner seulement certains chiffres ;
- croire que la somme doit être exactement 3 ou 9 ;
- croire que divisible par 3 implique divisible par 9 ;
- croire que la présence d’un chiffre 3 ou 9 suffit ;
- oublier le chiffre des unités 0 pour les critères par 2, par 5 et par 10 ;
- croire qu’un nombre terminé par 5 est divisible par 10 ;
- oublier que divisible par 10 implique divisible par 2 et par 5 ;
- confondre un diviseur et un multiple.

### F5 — Trouver un chiffre manquant

Exemple :

> Sélectionne tous les chiffres qui peuvent remplacer □ pour que 7□0 soit divisible par 3.

Trois formulations seulement sont autorisées :

- « Trouve le chiffre » lorsqu’une seule réponse existe ;
- « Sélectionne tous les chiffres possibles » lorsqu’il y en a plusieurs ;
- « Trouve le plus petit chiffre possible » lorsque cette contrainte est demandée.

Le générateur calcule l’ensemble complet des solutions avant d’écrire la consigne. La question ne doit jamais être ambiguë.

### F6 — Comprendre le sens dans une situation très courte

Exemple :

> Peut-on partager 315 objets équitablement entre 3 personnes, sans reste ?

La lecture ne doit pas devenir la difficulté principale. La situation sert uniquement à relier le critère de divisibilité au sens du partage sans reste.

Deux formes restent possibles :

- réponse **Oui / Non** pour un nombre de groupes donné ;
- sélection de tous les nombres de groupes possibles parmi 2, 3, 5, 9 et 10.

Une troisième forme est validée : lorsque le partage est impossible, demander le plus petit nombre d’objets à retirer pour obtenir un partage sans reste.

> On a 418 bonbons. Peut-on les répartir équitablement dans 3 sachets ? Si non, combien faut-il en retirer au minimum ?

Réponse : non ; il faut retirer 1 bonbon. Le total 417 montré dans l’image de référence est déjà divisible par 3, puisque `4 + 1 + 7 = 12` ; il convient donc pour une réponse « Oui », tandis que 418 convient pour travailler le retrait d’un objet.

Cette famille emploiera un objet de partage égal : une quantité source, des flèches et des parts ou sachets identiques. Le concept visuel fourni par Gwenaël est retenu, mais aucun ancien dessin ni ancien code n’est repris.

## Ce qui n’est pas une famille de questions

### Reconnaître ou associer les règles

Associer « par 3 » à « somme des chiffres multiple de 3 » ne devient pas une famille notée. L’élève retrouverait directement la réponse dans le rappel de cours, et la tâche mesurerait surtout la lecture d’une carte.

Les cinq règles sont donc placées dans :

- le rappel de cours ;
- l’aide ;
- la correction.

### Calculer la somme des chiffres

« Calcule la somme des chiffres de 537 » ne devient pas non plus une famille autonome. Ce calcul est un **outil intermédiaire** pour appliquer les critères par 3 et par 9.

Il apparaît :

- dans l’aide, pour orienter l’élève ;
- dans la correction, sous la forme `5 + 3 + 7 = 15` ;
- dans les raisonnements des familles F1 à F5 lorsque le critère 3 ou 9 est travaillé.

On évalue ainsi la divisibilité, pas une addition de chiffres isolée de son but.

## Cours associé

> **Statut actuel :** ces quatre cartes sont une base pédagogique à retravailler.
> Elles ne doivent pas être affichées dans le lecteur avant une nouvelle
> validation explicite de Gwenaël.

Le mini-cours commun à `NC-01` comporte quatre cartes :

1. le sens de « divisible par » et du partage sans reste ;
2. les critères par 2, 5 et 10 à partir du chiffre des unités ;
3. les critères par 3 et 9 à partir de la somme de tous les chiffres ;
4. les liens « divisible par 9 implique divisible par 3 » et « divisible par 10 implique divisible par 2 et par 5 ».

Le cours peut montrer complètement la méthode. Les aides, elles, se contentent de guider. Le même langage visuel est repris dans le cours, l’aide et la correction : chiffre des unités encadré, chiffres sélectionnables et zone somme.

La première carte utilise un schéma en barres piloté par des données : une barre entière de 12 puis la même longueur découpée en trois parts de 4, avec `12 = 3 × 4` et un reste nul. La famille des situations concrètes utilise, elle, un plateau de partage égal avec des sachets ou des parts. Même pour un cours fixe, aucun de ces visuels n’est dessiné manuellement ou stocké comme une image figée.

Les couleurs ont un rôle pédagogique : bleu foncé pour la structure, turquoise pour l’élément observé ou les parts égales, orange pour le reste ou l’attention, vert pour une conclusion valide et rouge pour une erreur. La couleur est toujours doublée par une forme, un contour ou un texte.

Le contenu détaillé du cours et les cas de référence de la première famille sont préparés dans [`contenu-nc-01-cours-et-f2.md`](contenu-nc-01-cours-et-f2.md).

## Aide : trois états, sans niveau

Le contenu mathématique de l’aide est le même ; seul son état d’affichage change.

- `ouverte` : l’indice est affiché avec la question ;
- `disponible` : l’indice est caché derrière un bouton « Aide » que l’élève ou l’enseignant peut ouvrir ; c’est l’état normal de l’entraînement ;
- `indisponible` : aucune aide n’est accessible ; cet état servira plus tard au mode examen.

Ces états ne sont ni des paliers ni des niveaux. Une même famille et une même difficulté mathématique peuvent être proposées avec une aide ouverte ou simplement disponible.

### Contenu des aides

L’aide donne une orientation sans donner la réponse :

- « Observe le chiffre des unités. » ;
- « Additionne tous les chiffres. » ;
- « La somme obtenue est-elle un multiple de 3 ? » ;
- « La somme obtenue est-elle un multiple de 9 ? » ;
- « Attention : être divisible par 3 ne signifie pas forcément être divisible par 9. » ;
- « Plusieurs réponses sont peut-être possibles. ».

Quand l’aide porte sur 3 ou 9, elle peut mettre en évidence tous les chiffres et préparer leur addition. Quand elle porte sur 2, 5 ou 10, elle met en évidence uniquement le chiffre des unités.

Deux manipulations d’aide sont retenues :

- l’élève peut appuyer sur le chiffre des unités pour l’identifier ;
- il peut sélectionner tous les chiffres pour construire une écriture comme `5 + 3 + 7 = □`, puis saisir lui-même la somme.

La zone somme ne calcule pas à la place de l’élève et ne conclut jamais sur la divisibilité. Ces manipulations restent facultatives : elles sont accessibles lorsque l’aide est ouverte ou disponible, et absentes lorsque l’aide est indisponible.

## Correction commune

La correction ne se limite jamais à « juste » ou « faux ».

- pour 2, 5 et 10, elle montre le chiffre des unités et rappelle le critère concerné ;
- pour 3 et 9, elle calcule une seule fois la somme de tous les chiffres puis la compare aux multiples utiles ;
- pour une sélection multiple, elle explique chaque choix séparément ;
- pour une affirmation, elle nomme précisément le raisonnement correct ou l’erreur ;
- pour un chiffre manquant, elle montre toutes les solutions demandées par la consigne ;
- pour une situation de partage, elle relie la conclusion à « sans reste ».

La correction n’utilise pas de division posée : elle renforce le critère travaillé.

## Périmètre des valeurs

### Inclus

- entiers positifs d’au moins deux chiffres ;
- zéros internes et chiffre des unités égal à 0 ;
- nombres vérifiant aucun, un ou plusieurs critères ;
- cas divisible par 3 mais pas par 9 ;
- cas divisible par 9, donc aussi par 3 ;
- cas divisible par 10, donc aussi par 2 et par 5 ;
- nombres assez courts pour que la somme des chiffres reste accessible mentalement ;
- pour F5, cas à solution unique, solutions multiples ou recherche du plus petit chiffre, avec une consigne correspondante.

### Exclus de la première tranche

- zéro comme nombre étudié ;
- entiers négatifs, décimaux et fractions ;
- zéros initiaux ;
- critères par 4, 6, 11 ou d’autres nombres ;
- division posée et calculatrice ;
- décomposition en facteurs premiers, PGCD et PPCM ;
- justification longue rédigée par l’élève ;
- problèmes dont la lecture ou le contexte masque l’automatisme.

## Variété sans paliers

Il n’existe ni palier 1, ni palier 2, ni palier 3 dans le parcours DNB actuel. Les séries mélangent les six familles validées selon les choix de l’activité.

La variété vient de :

- la famille de question ;
- le critère travaillé ;
- la longueur et les chiffres du nombre ;
- le nombre de réponses correctes ;
- la présence de zéros ;
- les liens 9 → 3 et non 3 → 9 ;
- le lien 10 → 2 et 5 ;
- l’erreur pédagogique ciblée ;
- l’état de l’aide.

Les proportions seront fixées dans le futur contrat du générateur. Elles empêcheront une stratégie superficielle, par exemple répondre toujours « Faux » dans F4 ou attendre toujours deux bonnes réponses dans une sélection multiple.

## Deux présentations d’un même contenu

### Mode « Au tableau »

- question lisible de loin ;
- aucune réponse élève cliquable ;
- l’enseignant peut révéler l’aide, la réponse puis la correction ;
- les grilles, phrases et choix conservent la même structure mathématique qu'en entraînement ;
- le professeur peut saisir et vérifier une réponse collective ou révéler
  directement la réponse attendue.

### Mode « S'entraîner »

- téléphone, tablette, ordinateur ou TNI ;
- avant la première question, écran générique « Prêt à commencer » résumant le nombre de notions, le nombre de questions et la disponibilité de l’aide ;
- pendant la séance, en-tête sans liste de domaines : sortie, progression, réussites et bouton « Aide » ;
- nom de la notion courante présenté discrètement dans la carte et non comme titre de toute la séance ;
- grandes cibles d’au moins 44 px ;
- utilisation au doigt, au stylet ou à la souris ;
- sélection, vrai/faux, appui sur une justification ou saisie numérique selon la famille ;
- zone de réponse stable dont le contenu s’adapte au type de question : choix, vrai/faux, grille, justification ou afficheur numérique ;
- pour toute saisie numérique, clavier maths&go affiché dans l’application ; le clavier système du téléphone ou de la tablette ne s’ouvre pas ;
- clavier adapté à la nature de la réponse : NC-01 utilise le profil « entier naturel » ; le signe moins ou la virgule n’apparaîtront que pour les notions qui les autorisent, sans déplacer les chiffres ;
- le même clavier reste utilisable à la souris sur ordinateur et au toucher sur TNI, tandis que le clavier physique est également accepté ;
- état sélectionné perceptible autrement que par la seule couleur ;
- appui sur le chiffre des unités ou sélection des chiffres dans l’aide lorsque cela est utile ;
- aucun glisser-déposer obligatoire : toute action est réalisable par appui ;
- fonctionnement vérifié à 375 px sans débordement horizontal.

La progression des questions, le nombre de réussites et un futur temps restant sont trois données distinctes. La barre fine représente uniquement la progression ; un éventuel chronomètre aura son propre affichage et démarrera après l’action « Commencer ».

## Ordre de fabrication à l’intérieur de NC-01

Cet ordre est technique ; il n’impose aucune progression à l’élève.

1. **F2 — Tous les diviseurs proposés** : première tranche verticale complète avec aide, correction, entraînement et mode classe.
2. **F1 — Critère précis** : ajout du vrai/faux ou oui/non simple.
3. **F3 — Plusieurs nombres** : ajout de la sélection dans une grille.
4. **F4 — Affirmation et justification** : ajout des raisonnements, du vrai/faux et de l’appui sur une justification.
5. **F5 — Chiffre manquant** : ajout de la saisie ou sélection de chiffres et gestion de plusieurs solutions.
6. **F6 — Situation de partage** : ajout du transfert de sens très court.

Chaque famille est montrée à Gwenaël avec des exemples réels avant de passer à la suivante. La fiche peut être validée en une fois, mais la fabrication reste progressive et contrôlable.

## Préparation du suivi futur, sans collecte actuelle

Chaque question devra pouvoir être classée par :

- domaine maths&go ;
- cible officielle ;
- micro-notion ;
- famille F1 à F6 ;
- critère ou critères travaillés ;
- erreur pédagogique ciblée, lorsqu’il y en a une ;
- statut `dnb_officiel` ou, plus tard, `complement_mathsgo` ;
- version du générateur ;
- graine et paramètres de l’instance ;
- type de réponse et réponse attendue canonique ;
- état de l’aide.

Le mode classe ne crée aucune tentative élève. Le mode entraînement pourra plus
tard transmettre une tentative structurée à un serveur distinct, sans changer
le contenu mathématique. Aucun serveur ni stockage de réponses n'est construit
dans cette phase.

## Critères de validation pédagogique

La fiche pourra devenir la référence de `NC-01` si Gwenaël valide explicitement :

1. l’intégration de 2, 3, 5, 9 et 10 dans le même module, y compris depuis le parcours DNB, avec 10 identifié comme complément maths&go dans les données seulement ;
2. les six familles F1 à F6 ;
3. le retrait des deux fausses familles « reconnaître les règles » et « calculer la somme des chiffres » ;
4. les questions vrai/faux courtes et l’appui sur une justification pour discuter les raisonnements et erreurs ;
5. les états d’aide `ouverte`, `disponible` et `indisponible` ;
6. l’absence totale de niveaux et de paliers ;
7. l’ordre de fabrication commençant par F2.

La validation pédagogique et l'autorisation de fabrication étant acquises, le
chantier technique ouvre la première tranche verticale F2. Elle comprend le
générateur seedé, les tests, le contenu structuré, l'entraînement, le mode
classe, l'aide, la correction et les aperçus, mais aucune autre famille avant
présentation de la précédente.

## Provenance et indépendance

- source normative pour 2, 3, 5 et 9 : liste officielle indicative des automatismes du DNB 2026 ;
- ajout du critère par 10 : choix pédagogique original de Gwenaël, validé le 19 juillet 2026 ;
- contenu et formulations reconstruits pour maths&go ;
- aucune formulation, valeur, liste de distracteurs, organisation, donnée ou code de l’ancienne banque ou de la bêta n’est repris ;
- les erreurs d’élèves sont des mécanismes pédagogiques à valider, jamais une copie de distracteurs historiques.
