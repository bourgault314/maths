# Spécification papier — séance, question et réponse

## Statut

**Architecture de données fonctionnelle version 1, validée par Gwenaël le 19 juillet 2026 ; nomenclature et trace autonome version 2 précisées par D-043 le 9 août 2026 ; statut de réponse et omission de la trace version 3 précisés par D-045 le 11 août 2026.**

Ce document fixe les responsabilités fonctionnelles pour éviter que le
menu, le lecteur, les questions et le futur serveur se mélangent. Les noms de
propriété, schémas JSON et contrats techniques restent définis dans le code ;
les identifiants canoniques, eux, relèvent de la taxonomie D-043.

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
| sélection | liste des modules visibles demandés, par identifiant canonique | `criteres-divisibilite` |
| mode | choisir entre réponse élève et conduite collective | interactif ou diaporama |
| nombre de questions | fixer la longueur et la progression | 10 |
| politique d’aide | dire si l’aide est ouverte, disponible ou indisponible | disponible |
| graine | reproduire exactement la même séance | graine choisie ou créée |

Le titre affiché n’est pas enregistré comme une longue chaîne fabriquée par le
menu. Le lecteur le compose depuis la sélection : nom du module lorsqu’il est
seul, ou nombre de modules sélectionnés lorsqu’ils sont plusieurs. Une entrée
peut couvrir plusieurs micro-notions sans les transformer en plusieurs choix de
menu.

### Ce qui n’appartient pas à cette préparation

- largeur ou nom de l’appareil ;
- coordonnées d’écran ;
- couleurs et dimensions ;
- disposition graphique du clavier ;
- score, qui résulte des réponses ;
- chronomètre dans la première version.

Pour la V1, la séance ne contient donc aucune donnée de temps. La barre indique seulement l’avancement des questions.

## 2. État de la séance dans le lecteur

Une fois l’action « Commencer » déclenchée, le lecteur conserve :

- une référence locale de séance ;
- l’état `prête`, `en cours` ou `terminée` ;
- la liste ordonnée des questions de la séance ;
- la position courante ;
- les traces déjà produites ;
- le nombre de réussites, calculé depuis ces traces.

La progression visible est toujours calculée avec la position courante et le total. Elle n’est jamais recopiée dans chaque question.

En diaporama, le lecteur conserve la position et les états de révélation, mais ne produit ni réponse élève ni score.

Dans « S'entraîner », une réponse entièrement vide au moment où l'élève valide
ou tente d'avancer est une omission : elle compte faux, crée une seule trace et
ouvre la correction. Une réponse commencée mais incomplète, ou une valeur
syntaxiquement invalide, reste réparable et ne crée pas encore de trace. Ce
comportement ne s'applique pas à « Au tableau ».

## 3. Question instanciée

Une question instanciée est entièrement prête à afficher : les valeurs sont tirées, la réponse est connue et la correction correspond exactement à cette instance.

### Identité et classement

La question doit permettre de retrouver :

- son identifiant d’instance ;
- l'identifiant canonique de son module visible ;
- l'identifiant canonique de son domaine disciplinaire ;
- l'identifiant canonique de sa micro-notion ;
- l'identifiant canonique de sa famille pédagogique ;
- les références de programme correspondantes : au minimum la cible machine
  `dnb-2026-xx` dans le classement courant ; la puce source et les lignes des
  nouveaux programmes sont retrouvées dans le catalogue versionné ;
- les alias humains ou historiques nécessaires à la lecture des anciennes
  données, sans les émettre comme identifiants principaux ;
- les éventuels compléments maths&go, comme le critère par 10 ;
- la graine, la version du catalogue et la version du générateur qui l’ont
  produite.

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

Le rappel de la réponse ne dépend jamais de la seule couleur : une réponse
juste est accompagnée d'un état vert, une réponse fournie et fausse d'un état
rouge, et une omission d'un état neutre dont la valeur reste visuellement vide.

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
- absence totale de choix enregistrée comme omission fausse si l'élève valide
  ou tente d'avancer ;
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
| statut et réponse validée | distinguer une réponse fournie de l'absence de réponse, puis conserver ce que l'élève a réellement choisi ou saisi |
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

### Trace version 2 autonome

La trace version 2 reste analysable même si la question instanciée n'est plus
disponible. Elle porte donc au minimum :

- la version du catalogue de compétences ;
- l'identifiant canonique du module visible ;
- l'identifiant canonique de la micro-notion ;
- l'identifiant canonique de la famille ;
- la version du générateur ;
- les cibles externes nécessaires au regroupement demandé, actuellement sous
  la forme `dnb-2026-xx`.

La puce de la liste officielle et les correspondances détaillées avec les
nouveaux programmes ne sont pas dupliquées dans chaque trace : le référentiel
versionné permet de les joindre aux identifiants stables lors d'une analyse.

Les codes courts tels que `NC-03` ou l'ancien `PG-22` restent acceptés à
l'import au moyen d'une table d'alias, mais une trace version 2 émet les
identifiants descriptifs. Les traces version 1 restent lisibles grâce à leur
identifiant de question et aux alias : aucune migration destructive n'est
requise.

### Trace version 3 : réponse fournie ou omise

La version 3 conserve l'identité autonome de la version 2 et ajoute un statut
à chaque réponse :

- `fournie` accompagne la valeur structurée attendue pour le type de réponse ;
- `omise` ne porte aucune valeur et implique toujours un résultat faux.

Le statut évite de fabriquer une chaîne vide, une fraction vide ou une liste
vide présentée comme une réponse fournie. Une omission complète produit une
seule trace, comme toute autre première validation. Les traces versions 1 et 2
restent acceptées en lecture ; elles ne sont ni réécrites ni enrichies a
posteriori.

Cette préparation ne décide ni de l'identité de l'élève, ni d'un serveur, ni du
transport, ni du format du futur tableau d'export. Ces sujets restent hors du
chantier actuel et demanderont une décision séparée avant toute collecte.

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
- `OK` conserve une fraction partiellement remplie comme réponse réparable ;
  deux cases entièrement vides deviennent une omission si l'élève valide ou
  tente d'avancer ;
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

1. L’accueil prépare une séance contenant le module canonique
   `criteres-divisibilite` (alias humain `NC-01`), le mode, dix questions, la
   politique d’aide et une graine.
2. L’écran « Prêt à commencer » résume cette préparation.
3. « Commencer » crée la séance ordonnée.
4. Le lecteur reçoit une première question instanciée de la famille F2.
5. L’élève sélectionne ses diviseurs puis valide, ou tente d'avancer sans
   sélection s'il ne souhaite pas répondre.
6. Le lecteur compare l’ensemble sélectionné à l’ensemble attendu ; une
   absence totale de sélection devient une omission fausse.
7. Une trace version 3 est créée et le compteur de réussites est recalculé.
8. La correction s'ouvre immédiatement après une omission ; l'aide ou la
   correction affichée ne modifie jamais la trace.
9. « Suivant » fait avancer la séance et la barre de progression.
10. Le bilan est calculé à partir de toutes les traces.

## 9. Étape de données ultérieure

La taxonomie canonique et les contrats de séance, de question et de trace
version 3 sont construits. Le prochain chantier de données, distinct de la
fabrication des modules pédagogiques, consistera à :

1. maintenir la correspondance entre la taxonomie, les identités du code et les
   traces par des tests de cohérence ;
2. conserver la lecture des traces versions 1 et 2 par la table d'alias et les
   validateurs de compatibilité ;
3. décider séparément de l'identité, du serveur, du transport et des exports
   avec Gwenaël avant toute collecte réelle.

