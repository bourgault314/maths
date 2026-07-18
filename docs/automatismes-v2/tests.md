# Stratégie de tests

Tout le cœur se teste avec `node --test`, **sans navigateur**. C'est une
contrainte d'architecture autant qu'une commodité : un moteur qui a besoin
d'un écran pour être vérifié finit par n'être vérifié qu'à la main.

```bash
node --test                 # toute la suite
npm run verifier            # la suite + les contrôles de publication
```

## Les six familles

### 1. Contrats — le format tient-il ?

Champs obligatoires, identifiants, versions, statuts, références. Et surtout :
**ce qui doit être refusé l'est**. Un validateur qui n'a jamais dit non n'a
jamais été testé.

Exemples réellement couverts : un visuel de rôle `donnee` marqué facultatif ;
une aide `erreur` sans modèle d'erreur ; une suite d'aides qui remonte le
cheminement ; un niveau hors du programme cité.

### 2. Déterminisme — la même graine donne-t-elle la même chose ?

- même graine, même flux, même contexte → même résultat ;
- deux flux différents ne partagent pas leur suite ;
- la graine d'une question tient à son **gabarit et à son rang**, jamais à
  l'ordre de travail du moteur ;
- rejouer une série depuis sa seule définition redonne la **même empreinte**.

C'est la famille la plus importante : c'est elle qui rend le partage par code
honnête.

### 3. Génération — la question produite est-elle correcte ?

Invariants respectés **à chaque tirage** (et pas seulement sur un exemple) ;
bornes ; boucle de rejet bornée ; repli déterministe ; échec clair quand rien
n'est possible ; question toujours conforme au contrat avant d'être rendue.

Un test vérifie qu'un générateur **ne peut pas falsifier** le schéma,
l'identifiant ou la traçabilité — le moteur les estampille après lui.

### 4. Réponses — l'élève est-il jugé correctement ?

Virgule et point ; espaces, y compris insécable et insécable fine ; signe
moins typographique ; `-0` qui devient `0` ; fractions équivalentes selon la
politique ; arrondis ; saisies invalides refusées avec un **motif**.

Et le test qui compte le plus : **aucune saisie n'est exécutée comme du code**.
Une liste de chaînes qui seraient dangereuses avec `eval` est vérifiée comme
refusée par la grammaire.

Un test montre aussi que `0,07` produit une mantisse de `7` tout rond — la
preuve qu'aucun flottant n'est passé par là.

### 5. Modèles d'erreurs — le diagnostic est-il honnête ?

Jamais égal à la bonne réponse ; jamais en doublon ; un diagnostic **ambigu**
(deux modèles donnant la même valeur) est signalé comme incertain plutôt que
tranché au hasard.

### 6. Dépendances — la dette est-elle tenue à distance ?

Ces tests ne vérifient pas que le code marche, mais qu'il n'a pas contracté
de dette. Ils vivent dans
[`tests/independance-v2.test.js`](../../tests/independance-v2.test.js) :

| Interdiction | Portée |
| --- | --- |
| import depuis `auto/` | tous les paquets |
| `eval`, `new Function`, `with` | fichiers source |
| `Math.random()` | fichiers source |
| `Date.now()`, `new Date()` | fichiers source |
| `document`, `window`, `localStorage` | fichiers source |
| couleur en dur, SVG, HTML, `formula_code`, fonction | la banque |
| état `valide` posé par un assistant | la banque |

Deux précisions sur la méthode :

- On cherche les **formes** de dépendance (`from "…auto/…"`, `require`,
  `new URL`) et non le mot `auto/`, car plusieurs fichiers le mentionnent
  légitimement dans un commentaire.
- Les fichiers de test sont exclus des interdictions de mots-clés : ils citent
  volontairement `eval(` ou `Math.random` dans des chaînes, pour en vérifier
  l'absence ailleurs.

**Une seule exception**, en liste blanche explicite :
`packages/contrats/src/question.test.js` lit un module de `auto/` pour vérifier
que les questions de l'application actuelle satisfont encore le contrat V1. Un
test vérifie que cette liste ne contient que des fichiers existants — une
entrée obsolète affaiblirait le garde-fou en silence.

## Ce qui n'est pas couvert automatiquement

Les vérifications visuelles restent manuelles, et le resteront tant qu'il n'y
aura pas d'interface :

- 375 px, cibles tactiles d'au moins 44 px ;
- ordinateur, projection ;
- contraste, navigation au clavier, lecteurs d'écran ;
- aucune information portée uniquement par la couleur.

Le banc d'essai du lot 0 a été vérifié à 1280 px et à 375 px : aucun
débordement horizontal, aucune cible sous 44 px, aucune erreur en console.

## Repères chiffrés

| Moment | Tests |
| --- | --- |
| Avant le lot 0 | 742 |
| Après le lot 0 | 926 |

Les 184 tests ajoutés se répartissent ainsi :

| Périmètre | Tests |
| --- | --- |
| Contrats (programme, réponse, visuel, aide, série, générateur) | 86 |
| Moteur (graines, sélection, registre, série, code MG2) | 68 |
| Thème et registre d'objets | 17 |
| Garde-fous d'indépendance | 13 |
