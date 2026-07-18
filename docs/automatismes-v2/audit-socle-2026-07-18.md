# Audit du socle minimal d'Automatismes V2

**Date : 18 juillet 2026 — audit en lecture seule du code.**

## Décision exécutive

Le socle générique est suffisamment simple et indépendant pour être conservé.
Il ne faut pas recommencer le PRNG, les validateurs ou le registre depuis une
page blanche. En revanche, leur démonstration actuelle dépend encore de
contenus V1 : cette dépendance doit être retirée avant toute première notion.

Cette conservation est une décision d'ingénierie, pas une obligation de
compatibilité : ces quatre briques sont gardées parce que leur correction est
plus simple, plus sûre et mieux testable qu'une réécriture sans bénéfice
fonctionnel. Elles pourront être remplacées plus tard si un besoin maths&go le
justifie.

| Élément | Décision | Motif |
| --- | --- | --- |
| Contrat de question | Conserver et corriger | Structure générique utile, limitée à une réponse saisie, mais validation et exemples incomplets. |
| Contrat de gabarit | Conserver et corriger | Séparation saine entre données et code, mais exemples de fractions à neutraliser. |
| PRNG seedé | Conserver et renforcer | Indépendant de DocTools, déjà reproductible et utilisé par le Studio. |
| Registre de générateurs | Conserver et renforcer | Bonne séparation et traçabilité estampillée par le moteur, mais tests dépendants du générateur V1. |
| Générateur `fractions.js` | Retirer | Listes, bornes et logique explicitement issues de V1, sans fiche validée par Gwenaël. |

## 1. Indépendance des noms et dossiers

Les noms de source V2 seront construits à partir de la taxonomie maths&go et du
programme officiel. Exemple de direction, à confirmer lors de la création du
premier paquet de notions :

```text
packages/automatismes/
└── src/
    └── notions/
        └── nombres-et-calculs/
            └── <notion-mathsgo>/
```

Il n'existera aucun dossier `dnb_XX`, aucune numérotation héritée et aucune
obligation de faire correspondre une notion à l'un des 43 modules. Les tables
de correspondance historiques restent dans `docs/reference-automatismes-beta/`
et `packages/objets/src/provenance.js` uniquement pour suivre la dette de
l'application actuelle.

## 2. Contrat de question

Fichier : `packages/contrats/src/question.js`.

### Ce qui est sain

- une question instanciée ne transporte que des données ;
- l'énoncé, l'aide et la correction sont séparés ;
- la version 1 impose une réponse saisie, conforme à la règle actuelle ;
- le schéma est versionné, ce qui évite les changements incompatibles
  silencieux.

### Ce qui doit être corrigé

- le commentaire donne `dnb_01#3` comme identifiant d'exemple ;
- `question.test.js` charge et exécute réellement
  `auto/scripts/modules/numbers/dnb_01.js` avec `vm` : le contrat V2 dépend donc
  encore d'un module historique ;
- le validateur ne vérifie pas lui-même que toute la question, notamment
  `origine`, est une donnée JSON pure ;
- une valeur acceptée composée uniquement d'espaces est actuellement valide ;
- la documentation réserve `[[reponse]]` aux blocs LaTeX alors que le code le
  compte dans tous les blocs ;
- le format de l'identifiant d'instance n'est pas contraint.

### Décision

Conserver la version 1 et la renforcer sans lui ajouter par anticipation de
nouveaux types de réponse. Les besoins d'équivalence mathématique, d'unités ou
de normalisation seront introduits seulement lorsqu'une première fiche de
notion les rendra nécessaires.

## 3. Contrat de gabarit

Fichier : `packages/contrats/src/gabarit.js`.

### Ce qui est sain

- les paramètres sont des données et ne peuvent pas contenir de fonction ;
- le générateur est référencé par un nom et une version ;
- les identifiants suivent déjà un format stable indépendant ;
- une modification incompatible impose une nouvelle version.

Le mot « gabarit » et les dossiers `contrats/` et `moteur-exercices/` ont été
créés pour la fondation maths&go ; ils ne proviennent pas du découpage DocTools.

### Ce qui doit être corrigé

- tous les exemples utilisent `fractions.simplifier`, le générateur contaminé ;
- le commentaire se définit encore par rapport au `formula_code` historique au
  lieu de décrire le contrat pour lui-même ;
- `estDonneePure` ne protège pas contre une structure cyclique et peut déborder
  la pile ;
- le nom du générateur est moins strictement contrôlé à l'enregistrement que
  dans le gabarit.

### Décision

Conserver le contrat, remplacer tous les exemples par une fixture technique
neutre et renforcer les validations sans créer de champs pédagogiques nouveaux.

## 4. Générateur pseudo-aléatoire seedé

Fichier : `packages/moteur-exercices/src/aleatoire.js`.

### Ce qui est sain

- aucune utilisation de `Math.random()` ou de l'horloge ;
- valeurs témoins précises qui figent la reproductibilité ;
- version explicite de l'algorithme ;
- choix et mélange sans mutation de la liste d'origine ;
- déjà utilisé par plusieurs outils maths&go indépendants de la banque.

Les algorithmes 32 bits employés sont génériques et ne viennent pas de
DocTools. Le fichier est une brique maths&go acquise.

### Ce qui doit être corrigé

- `undefined`, `null`, `NaN`, un nombre décimal ou infini sont silencieusement
  convertis en graine numérique ;
- `entier(min, max)` ne borne pas la largeur de l'intervalle et accepte des
  entiers non sûrs ;
- `melange` ne vérifie pas explicitement qu'il reçoit un tableau.

### Décision

Conserver l'algorithme et sa version afin de ne pas casser les séries déjà
reproductibles. Ajouter uniquement les validations d'entrée ; elles ne doivent
pas changer les suites produites pour les entrées actuellement valides.

## 5. Registre et instanciation

Fichier : `packages/moteur-exercices/src/generation.js`.

### Ce qui est sain

- le registre n'exécute que des générateurs explicitement enregistrés ;
- il valide le gabarit avant l'exécution et la question après ;
- le moteur estampille lui-même le schéma, l'identité et la traçabilité après
  le générateur, qui ne peut donc pas les falsifier ;
- gabarit et graine déterminent la suite pseudo-aléatoire.

### Ce qui doit être corrigé

- `generation.test.js` enregistre le véritable générateur de fractions V1 et
  fige même l'énoncé et les réponses qu'il produit ;
- le registre accepte un nom de générateur non vide sans appliquer le format
  du contrat de gabarit ;
- la graine n'est pas validée avant sa conversion en texte ;
- le générateur reçoit directement l'objet `parametres` et peut le modifier,
  ce qui fragilise la promesse de déterminisme ;
- aucune vérification statique n'empêche encore un futur générateur d'appeler
  `Math.random()`, `eval` ou de réintroduire un nom `dnb_*`.

### Décision

Conserver le registre. Remplacer le générateur réel des tests par une fixture
locale sans contenu pédagogique, valider ses entrées et protéger les paramètres
contre la mutation.

## 6. Contenu à retirer avant la première notion

Les éléments suivants n'ont aucune valeur à conserver dans V2 :

- `packages/moteur-exercices/src/generateurs/fractions.js` ;
- son export dans `packages/moteur-exercices/package.json` ;
- les tests de fractions et les valeurs témoins correspondantes dans
  `generation.test.js` ;
- le chargement de `dnb_01` dans `question.test.js` ;
- les identifiants `dnb_*` et `fractions.simplifier` utilisés comme exemples
  dans le code générique.

Le fichier historique `auto/` et les inventaires ne sont pas supprimés : ils
continuent de faire fonctionner la version actuelle et de documenter ce qui
reste à remplacer. Ils ne sont jamais importés par V2.

## 7. Prochain lot technique autorisé

Le prochain lot sera limité aux actions suivantes :

1. retirer le générateur de fractions hérité et son export ;
2. retirer le test qui exécute `dnb_01` ;
3. remplacer les exemples pédagogiques par des fixtures techniques neutres ;
4. ajouter les validations d'entrée recensées ci-dessus, sans changer les
   sorties valides du PRNG ;
5. protéger les paramètres transmis aux générateurs ;
6. ajouter un garde-fou automatique contre les identifiants historiques et le
   code dynamique dans le futur périmètre V2 ;
7. exécuter toute la suite `npm run verifier`.

Ce lot ne crée ni paquet de notions, ni question réelle, ni aide, ni visuel, ni
interface. Une fois ce nettoyage fusionné, le chef de projet choisira la
première catégorie et préparera avec Gwenaël la première fiche pédagogique.
