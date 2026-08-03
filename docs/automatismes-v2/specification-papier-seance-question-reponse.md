# Spécification papier — séance, question et réponse

## Statut

**Architecture de données fonctionnelle version 2, révisée par Gwenaël le 20 juillet 2026.**

Ce document ne définit aucun nom de propriété définitif, aucun schéma JSON et aucun code. Il fixe les responsabilités pour éviter que le menu, le lecteur, les questions et le futur serveur se mélangent.

## Principe directeur

Les données disent **quoi** afficher et **quoi** vérifier. Le lecteur décide **comment** le présenter selon la largeur disponible et le mode choisi.

Une question ne connaît donc ni la taille du téléphone, ni la position du clavier, ni la couleur d’un bouton. Inversement, le lecteur n’invente ni la bonne réponse, ni l’aide, ni la correction.

## Les trois ensembles de données

```text
Préparation de la séance
          ↓
Questions prêtes à afficher
          ↓
Traces produites par les validations
```

1. La **séance** indique ce que l’utilisateur a demandé et où il en est.
2. La **question instanciée** contient tous les nombres déjà tirés et tout le contenu nécessaire pour afficher, aider et corriger.
3. La **trace de réponse** enregistre ce que l’élève a réellement validé.

Cette séparation permet plus tard d’envoyer les traces vers un serveur sans lui demander de régénérer ou d’interpréter l’interface.

## 1. Préparation de la séance

La page d’accueil remet au lecteur une préparation courte et stable.

| Information | Rôle | Exemple |
| --- | --- | --- |
| contexte de lancement | distinguer un parcours DNB d’un entraînement personnalisé | parcours DNB |
| sélection | liste des micro-notions maths&go demandées | `NC-01` |
| mode | choisir entre réponse individuelle et conduite collective | `entrainement` ou `classe` |
| nombre de questions | fixer la longueur et la progression | 10 |
| politique d’aide | dire si l’aide est ouverte, disponible ou indisponible | disponible |
| graine | reproduire exactement la même séance | graine choisie ou créée |

Le titre affiché n’est pas enregistré comme une longue chaîne fabriquée par le menu. Le lecteur le compose depuis la sélection : nom de la notion lorsqu’elle est seule, ou « 6 notions sélectionnées » lorsqu’elles sont nombreuses.

### Ce qui n’appartient pas à cette préparation

- largeur ou nom de l’appareil ;
- coordonnées d’écran ;
- couleurs et dimensions ;
- disposition graphique du clavier ;
- score, qui résulte des réponses ;
- chronomètre dans la première version.

Dans la version actuelle, la séance ne contient donc aucune donnée de temps. La
barre indique seulement l'avancement des questions.

## 2. État de la séance dans le lecteur

Une fois l’action « Commencer » déclenchée, le lecteur conserve :

- une référence locale de séance ;
- l’état `prête`, `en cours` ou `terminée` ;
- la liste ordonnée des questions de la séance ;
- la position courante ;
- les traces déjà produites ;
- le nombre de réussites, calculé depuis ces traces.

La progression visible est toujours calculée avec la position courante et le total. Elle n’est jamais recopiée dans chaque question.

En mode classe, le lecteur conserve la position, la sélection collective, son
éventuelle vérification et les états de révélation. Il ne produit ni trace
d'élève ni score individuel.

## 3. Question instanciée

Une question instanciée est entièrement prête à afficher : les valeurs sont tirées, la réponse est connue et la correction correspond exactement à cette instance.

### Identité et classement

La question doit permettre de retrouver :

- son identifiant d’instance ;
- son domaine maths&go ;
- sa micro-notion ;
- sa famille pédagogique ;
- la cible officielle correspondante ;
- les éventuels compléments maths&go, comme le critère par 10 ;
- la graine et la version du générateur qui l’ont produite.

Ces informations permettront le classement et le futur suivi sans afficher leurs codes à l’élève.

### Contenu visible

La question fournit :

- une consigne courte ;
- les données mathématiques à montrer ;
- les éventuels objets visuels et leurs données ;
- la définition de la réponse ;
- l’aide ;
- la correction.

Un objet visuel est décrit par son sens mathématique, jamais par des coordonnées. Par exemple, un partage contient une quantité et un nombre de parts ; le lecteur choisit la disposition compacte ou large.

### Définition de la réponse

La définition sépare trois questions :

1. **Que peut faire l’élève ?** — sélectionner ou remplir des champs.
2. **Quelles valeurs sont autorisées ?** — entier naturel, décimal, ensemble de choix, etc.
3. **Comment juge-t-on ?** — ensemble exact, valeur exacte, équivalence mathématique ou autre règle validée avec la notion.

Le clavier n’est pas décrit touche par touche dans la question. La nature des champs permet au lecteur de choisir le clavier adapté.

### Aide

L’aide appartient à la question, tandis que son droit d’ouverture appartient à la séance.

Elle contient :

- les formulations de guidage ;
- les données ou objets visuels nécessaires ;
- les éventuelles petites actions guidées ;
- aucun résultat final dévoilé.

### Correction

La correction contient :

- la réponse complète ;
- les étapes nécessaires pour comprendre ;
- les mêmes représentations que la question ou l’aide lorsque cela est utile ;
- les conclusions textuelles qui doublent les couleurs.

### Ce qu’une question ne contient jamais

- son numéro dans la séance ;
- le score courant ;
- la sélection générale du menu ;
- l’identité d’un élève ;
- du code exécutable ;
- du HTML ou des coordonnées d’écran ;
- une liste graphique des touches du clavier.

## 4. Première forme de réponse à contractualiser : NC-01 F2

La première future version du contrat n’a pas besoin de couvrir tous les exercices du collège. Elle doit répondre au besoin validé de la première famille : sélectionner tous les diviseurs proposés.

Elle doit pouvoir dire :

- choix proposés : 2, 3, 5, 9, 10 et Aucun ;
- plusieurs choix autorisés ;
- « Aucun » exclusif des cinq nombres ;
- ensemble exact attendu ;
- validation impossible sans choix ;
- aucune importance accordée à l’ordre des sélections.

Exemple pour 330 :

| Élément | Valeur fonctionnelle |
| --- | --- |
| choix validé par l’élève | 2, 3, 5 et 10 |
| ensemble attendu | 2, 3, 5 et 10 |
| résultat | juste |

Le contrat technique actuel `texte-exact` ne suffit pas. La future version devra introduire cette sélection multiple sans modifier silencieusement l’ancienne version.

## 5. Trace de réponse

À chaque validation interactive, le lecteur produit une trace minimale.

| Information | Pourquoi la conserver |
| --- | --- |
| référence de séance | regrouper les réponses d’un même entraînement |
| identifiant de la question | relier la réponse à l’instance exacte |
| position dans la séance | reconstituer l’ordre vécu |
| réponse validée | savoir ce que l’élève a réellement choisi ou saisi |
| résultat juste ou faux | calculer le nombre de réussites |
| aide consultée ou non | comprendre plus tard le degré d’autonomie |
| numéro de validation | préserver la première réponse si un nouvel essai existe un jour |

Dans la première version :

- une seule validation compte pour le score ;
- aucune durée n’est enregistrée ;
- aucune identité d’élève n’est demandée ;
- aucune transmission vers un serveur n’est réalisée ;
- la trace reste néanmoins dans un format qui pourra être envoyé plus tard.

Le score affiché est une conséquence des traces. Il n’est pas écrit dans les questions et ne modifie jamais leur contenu.

## 6. Décision enregistrée pour les fractions

Une réponse fractionnaire ne sera pas saisie sous la forme d’un texte contenant `/`.

```text
        [ numérateur ]
        ──────────────
        [ dénominateur ]
```

Comportement prévu :

- les deux cases sont de vrais champs séparés ;
- l’élève touche la case qu’il veut remplir ;
- la case active possède un contour et un libellé explicite ;
- le clavier écrit uniquement dans la case active ;
- chaque case possède sa propre nature numérique ; le signe moins n’apparaît que si la notion l’autorise ;
- la barre de fraction est construite automatiquement par le lecteur ;
- `OK` valide la fraction entière seulement lorsque les deux cases sont remplies ;
- un dénominateur nul est refusé avec un message compréhensible ;
- au clavier physique, la touche Tab permet de passer d’une case à l’autre ;
- la réponse et la correction conservent une vraie écriture fractionnaire.

Cette décision sera appliquée lorsque la carte conduira aux micro-notions de fractions. Elle n’ajoute aucun type de réponse au premier contrat de `NC-01`.

## 7. Autres formes connues, ajoutées seulement au besoin

Le lecteur commun devra un jour pouvoir accueillir :

- un nombre dans un seul champ ;
- plusieurs champs nommés ;
- une fraction à deux champs ;
- un vrai/faux ;
- une sélection de plusieurs cartes ;
- un appui sur une justification.

Cette liste guide l’architecture, mais n’autorise pas leur programmation anticipée. Chaque forme entre dans un contrat lorsqu’une famille pédagogique validée en a réellement besoin.

## 8. Enchaînement complet pour NC-01 F2

1. L’accueil prépare une séance contenant `NC-01`, le mode, dix questions, la politique d’aide et une graine.
2. L’écran « Prêt à commencer » résume cette préparation.
3. « Commencer » crée la séance ordonnée.
4. Le lecteur reçoit une première question instanciée de la famille F2.
5. L’élève sélectionne ses diviseurs puis valide.
6. Le lecteur compare l’ensemble sélectionné à l’ensemble attendu.
7. Une trace est créée et le compteur de réussites est recalculé.
8. L’aide ou la correction s’affiche sans modifier la trace.
9. « Suivant » fait avancer la séance et la barre de progression.
10. Le bilan est calculé à partir de toutes les traces.

## 9. Prochaine étape autorisée

1. donner des noms techniques stables aux trois ensembles ;
2. définir la nouvelle version du contrat de question pour la sélection multiple F2 ;
3. définir le contrat minimal de séance et de trace ;
4. écrire les tests des contrats avant le générateur pédagogique ;
5. construire ensuite la première tranche verticale de `NC-01`.
