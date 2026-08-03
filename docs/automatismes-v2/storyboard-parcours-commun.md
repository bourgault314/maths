# Storyboard commun — lancement, séance et bilan

## Statut

**Architecture fonctionnelle version 2, révisée par Gwenaël le 20 juillet 2026.**

Ce document décrit l'enveloppe commune de « S'entraîner » et « Au tableau ».
Il ne redessine pas la page d'accueil et ne contient aucun code.

## Pourquoi cette étape précède le JSON des questions

La page d’accueil choisit un contenu. Le lecteur fait vivre une séance. Une question ne doit pas porter les responsabilités de toute la séance.

Trois futurs ensembles de données seront donc distincts :

- la **configuration de séance** : contexte, sélection, nombre de questions,
  politique d'aide et graine ; aucun chronométrage dans cette version ;
- la **question instanciée** : énoncé, représentation, réponse attendue, aide et correction ;
- la **trace de réponse** : réponse réellement validée, résultat et consultation éventuelle de l’aide.

Le menu complet pourra continuer d’évoluer. Avant le JSON, il suffit de fixer la frontière entre la sélection et le lecteur.

## Parcours commun retenu

```text
Sélection sur la page d’accueil
              ↓
Résumé de la séance + Commencer
              ↓
Questions
              ↓
Bilan
```

L’action « Commencer » marque le début réel de la séance. Elle permettra plus tard de démarrer un éventuel chronomètre au bon moment.

## Écran 1 — Séance prête

Cet écran existe aussi lorsque plusieurs domaines ou plusieurs notions ont été choisis. Son titre reste volontairement générique.

```text
┌─────────────────────────────────┐
│ [Retour]                        │
│                                 │
│       Prêt à commencer ?        │
│                                 │
│ Entraînement personnalisé       │
│ 6 notions sélectionnées [Voir]  │
│ 10 questions                    │
│ Aide disponible                 │
│                                 │
│          [ Commencer ]          │
└─────────────────────────────────┘
```

Règles :

- le titre n’énumère jamais les domaines sélectionnés ;
- avec une seule notion, son nom peut apparaître dans le résumé sans remplacer le titre générique ;
- avec plusieurs notions, l’écran affiche leur nombre et un bouton « Voir la sélection » ;
- la liste détaillée s’ouvre dans un panneau refermable et ne surcharge pas l’écran principal ;
- le résumé montre seulement ce qui aide à décider de commencer : mode, volume et aide ; un éventuel temps viendra avec le futur mode concerné ;
- un seul bouton principal lance la séance ;
- en mode classe, le libellé devient « Prêt pour la classe ? » et « Commencer au tableau ».

Cet écran sert également de sas avant le plein écran, la projection ou un futur chronomètre. Il n’est donc pas supprimé lorsque la sélection devient riche.

## Écran 2 — En-tête stable pendant la séance

Le lecteur n’affiche pas une longue liste de domaines. Il montre l’état de la séance et, dans la carte, la notion de la question courante.

### Mode « S'entraîner » — téléphone

```text
┌─────────────────────────────────┐
│ [×]   Question 3/10   ✓ 2 [Aide]│
│ █████████░░░░░░░░░░░░░░░░░░░░ │
├─────────────────────────────────┤
│ Nombres et calculs · Divisibilité│
│                                 │
│ … question courante …           │
└─────────────────────────────────┘
```

L’en-tête comporte quatre informations seulement :

1. quitter ou revenir ;
2. position dans la séance ;
3. nombre de réussites en mode entraînement ;
4. aide, lorsqu’elle est autorisée.

La ligne « Nombres et calculs · Divisibilité » appartient à la question courante. Elle change naturellement dans une séance mélangée et n’essaie pas de résumer toute la sélection.

### Mode « Au tableau »

Le même en-tête conserve la sortie, « Question 3/10 » et la progression. Le
compteur de réussites disparaît, puisqu'aucune réponse individuelle n'est
enregistrée. Le professeur peut sélectionner puis vérifier une réponse
collective, ou révéler directement la réponse attendue. L'aide, la correction
et le passage à la suite restent dans une barre de commandes stable.

## Progression, réussites et temps

Ces trois informations ne sont jamais confondues.

### Progression

- affichage textuel obligatoire : « Question 3 sur 10 » ou forme compacte « 3/10 » ;
- barre fine complémentaire, jamais seule ;
- progression déterminée par le nombre de questions de la séance ;
- libellé accessible donnant la valeur courante et le total.

### Réussites

- chaque question interactive compte au maximum une réussite ;
- le compteur est mis à jour après la validation de la réponse ;
- le résultat de la première validation reste la trace de référence si une possibilité de nouvel essai est ajoutée plus tard ;
- l’en-tête montre un compteur compact, par exemple `✓ 2` ;
- le bilan final écrit la formulation complète, par exemple « 7 réponses justes sur 10 » ;
- le mode classe ne possède pas de score individuel ; sa vérification sert à la
  discussion collective et ne produit aucune trace d'élève.

### Temps futur

La première version ne possède aucun temps : la barre représente uniquement l’avancement des questions.

La manière d’afficher un futur temps restant reste volontairement ouverte. La réutilisation de la barre ou l’ajout d’un indicateur distinct seront décidés lorsque le mode chronométré sera réellement conçu. Aucune donnée de temps n’entre dans le contrat actuel.

## Position de l’aide

L’aide quitte la zone du clavier et rejoint l’en-tête, toujours au même emplacement.

- téléphone : bouton « Aide » en haut ; ouverture dans un panneau remontant ou sous l’énoncé selon la hauteur disponible ;
- tablette et ordinateur : même bouton ; panneau latéral lorsque la largeur le permet ;
- TNI et projection : commande d’aide dans la zone stable des commandes enseignant ;
- l’ouverture de l’aide conserve la réponse commencée ;
- la fermeture rend le focus au bouton « Aide » ;
- lorsque la séance interdit l’aide, notamment dans un futur mode examen, la commande n’est pas présentée.

Le clavier peut donc apparaître, disparaître ou changer de disposition sans déplacer l’aide.

## Clavier maths&go adaptable

Le clavier est piloté par la nature mathématique de la réponse. Toutes les touches possibles ne sont jamais affichées simultanément.

Profils prévus :

| Réponse | Touches utiles |
| --- | --- |
| entier naturel | chiffres, effacer, valider |
| entier relatif | chiffres, signe moins, effacer, valider |
| nombre décimal positif | chiffres, virgule, effacer, valider |
| nombre décimal relatif | chiffres, signe moins, virgule, effacer, valider |
| fraction | deux champs séparés, numérateur et dénominateur, avec la barre construite automatiquement |
| expression | futur composant spécialisé, décidé avec la notion |

Règles communes :

- les chiffres conservent toujours le même ordre et les mêmes positions ;
- les emplacements des touches facultatives sont prévus sans réorganiser les chiffres ;
- le signe moins n’apparaît que si une réponse négative est possible ;
- la virgule n’apparaît que si une réponse décimale est possible et ne peut être saisie qu’une fois ;
- effacer et valider restent toujours disponibles ;
- le clavier physique ou Bluetooth reste accepté ;
- chaque touche est un vrai bouton nommé, atteignable au clavier et d’au moins 44 px ;
- le clavier réserve sa hauteur et ne masque ni la réponse ni les éléments ayant le focus.

Le futur contenu ne donnera pas une liste graphique de touches. Il décrira une réponse comme « entier naturel » ou « décimal relatif » ; le lecteur choisira le profil de clavier correspondant.

Pour une fraction, l’élève touche le champ du numérateur ou celui du dénominateur, puis remplit le champ actif avec le clavier. Il ne saisit jamais de barre oblique : le lecteur affiche lui-même la barre de fraction entre les deux champs.

La nature de chaque champ indiquera plus tard si un signe moins est autorisé. La fraction affichée restera une écriture mathématique structurée, jamais deux textes placés manuellement autour d’un trait.

Pour `NC-01`, seul le profil « entier naturel » est nécessaire.

## Écran 3 — Bilan

```text
┌─────────────────────────────────┐
│          Séance terminée        │
│                                 │
│      7 réponses justes sur 10   │
│                                 │
│ [ Revoir les corrections ]      │
│ [ Recommencer ]                 │
│ [ Retour à l’accueil ]          │
└─────────────────────────────────┘
```

La première version reste sobre : total, réussites et trois actions maximum. Le détail par notion et l’envoi vers un serveur appartiennent à une évolution ultérieure, mais les réponses devront être conservables avec leurs identifiants dès la conception du contrat.

## Ce qui est décidé avant le JSON

- écran « Séance prête » conservé ;
- titre générique et résumé repliable pour une sélection multiple ;
- bouton explicite « Commencer » ;
- en-tête sans liste de domaines ;
- notion courante affichée discrètement dans la carte ;
- progression des questions et réussites séparées ; aucun temps dans la première version ;
- aide en haut, dans une position stable ;
- clavier adapté au type de réponse, sans déplacement des chiffres ;
- bilan simple en fin de séance ;
- configuration de séance, question instanciée et trace de réponse distinctes.

## Ce qui peut attendre le prototype

- dimensions exactes de l’en-tête et de la barre ;
- dessin précis des emplacements facultatifs du clavier ;
- animations des panneaux ;
- habillage final du compteur de réussites ;
- décision complète sur le futur chronomètre, y compris son lien éventuel avec la barre ;
- statistiques par domaine et transmission au serveur.

## Ordre de chantier

1. arrêter ce storyboard commun ;
2. décrire sur papier la configuration de séance, la question instanciée et la trace de réponse ;
3. créer la nouvelle version des contrats JSON ;
4. construire une tranche verticale avec la première famille validée de `NC-01` ;
5. contrôler réellement le téléphone 375 px et la projection avant d’étendre les familles.
