# Architecture V2

## Le principe qui explique tout le reste

**Une seule couche a le droit d'être du code : les générateurs.**

Le programme, la banque, les gabarits, les questions produites — tout cela
n'est que de la donnée. C'est ce qui rend le système vérifiable : on peut
relire une banque comme on relit un tableau, sans avoir à exécuter quoi que
ce soit pour savoir ce qu'elle contient.

C'est aussi la réponse à la dette de l'ancien moteur, où des morceaux de
programme circulaient dans des chaînes de caractères (`formula_code`) et
étaient interprétés à l'exécution.

## Les couches

```
Programme          ce que dit le BO, et depuis quand
    ↓
Banque             domaines, catégories, notions, gabarits   (données pures)
    ↓
Moteur             hasard seedé, sélection, tirage, série     (le seul code)
    ↓
Question-instance  une question figée, entièrement en données
    ↓
Rendu              transforme la question en affichage
    ↓
Interface          navigation, saisie, score, partage
```

Les **objets visuels** et le **thème** alimentent le rendu de côté : ils
reçoivent des paramètres sémantiques et produisent un dessin.

## Ce que chaque couche a le droit de faire

| Couche | Peut | Ne peut pas |
| --- | --- | --- |
| Programme | dire ce qui est enseigné/automatisé, et depuis quelle année | contenir une question |
| Banque | nommer des générateurs et des objets, porter des paramètres | contenir une fonction, un SVG, du HTML, une couleur |
| Moteur | tirer, sélectionner, composer, évaluer | dépendre du navigateur, lire l'horloge, utiliser `Math.random()` |
| Objets | dessiner à partir de paramètres sémantiques | tirer des valeurs, calculer la réponse |
| Rendu | disposer, afficher, appeler les objets | recalculer la question |
| Interface | naviguer, saisir, scorer, partager | contenir de la logique pédagogique |

## Les paquets

| Paquet | Rôle | Ajouté au lot 0 |
| --- | --- | --- |
| `packages/contrats/` | Formats de données et validateurs purs | `programme`, `reponse`, `visuel`, `aide`, `serie`, `generateur` |
| `packages/moteur-exercices/` | Hasard, sélection, séries, codes | `graines`, `selection`, `serie`, `code-serie`, `registre-v2` |
| `packages/objets/` | Objets mathématiques et géométriques | — |
| `packages/banque-automatismes/` | Données pédagogiques | `fixtures/` |
| `packages/charte/` | Couleurs et typographie | `theme` (rôles sémantiques) |
| `packages/rendu-questions/` | Rendu des questions | `registre-objets` (créé au lot 0) |

`packages/rendu-questions/` ne contient pour l'instant **que le catalogue
déclaratif des objets** : quels objets existent, sous quelle version, dans
quels rôles. Le rendu proprement dit viendra avec l'interface.

## Dépendances autorisées

Les flèches vont toujours dans le même sens :

```
banque-automatismes ──┐
rendu-questions ──────┼──→ contrats
moteur-exercices ─────┘         ↑
        └──────────────────────┘
rendu-questions ──→ objets (pour lire leurs numéros de version)
charte/theme ─────→ charte
```

**Interdit, et vérifié par un test** ([tests.md](tests.md)) :

- tout import depuis `auto/` (l'ancien moteur) ;
- `eval`, `new Function`, `with` ;
- `Math.random()` et la lecture de l'horloge ;
- `document`, `window`, `localStorage` dans les paquets purs ;
- une couleur en dur ou un SVG dans la banque.

Une seule exception, documentée et datée : `packages/contrats/src/question.test.js`
lit un module de `auto/` pour vérifier que les questions de l'application
actuelle satisfont encore le contrat V1. C'est un test de non-régression de
l'existant, pas une dépendance du code V2 ; il disparaîtra avec `auto/`.

## Pourquoi le moteur estampille lui-même la traçabilité

Un générateur renvoie **ce qu'il sait produire** : un énoncé, une réponse,
des aides, des modèles d'erreurs. C'est le moteur qui ajoute ensuite le
schéma, l'identifiant et la traçabilité.

Ce n'est pas un détail de style. Si le générateur composait lui-même l'objet
final, il pourrait — par accident bien plus que par malice — déclarer une
version qui n'est pas la sienne, ou une graine qui n'a pas servi. La série
deviendrait alors irreproductible sans que rien ne le signale. Un test
vérifie explicitement qu'un générateur ne peut pas falsifier ces champs.

> **Point ouvert.** Le premier module reconstruit (`criteres-divisibilite`,
> PR 144) suit la convention inverse : son générateur produit lui-même la
> question complète, traçabilité comprise. Les deux conventions ne peuvent
> pas coexister. Voir [decisions.md](decisions.md), décision D-07.

## Reproductibilité : les flux de graines

Un seul flux de hasard partagé rendrait l'ordre des appels significatif :
ajouter une notion dans une catégorie décalerait les tirages d'une autre, et
les séries déjà partagées changeraient en silence.

Chaque usage tire donc dans **son** flux, dérivé de la graine de série :

| Flux | Sert à |
| --- | --- |
| `notions` | répartir les questions entre les notions |
| `gabarits` | choisir les gabarits dans une notion |
| `valeurs` | tirer les nombres d'une question |
| `melange` | ordonner la série |

La graine des valeurs d'une question dépend du **gabarit et de son rang**,
jamais de l'ordre dans lequel le moteur a travaillé.
