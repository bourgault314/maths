# Studio pédagogique maths&go

Ce dossier pose les fondations du futur moteur pédagogique de maths&go.

Le but n'est pas de demander à une IA de recréer une page ou un dessin à chaque
prompt. Le moteur doit conserver les contenus, les représentations, les règles
pédagogiques et les gabarits validés. Une IA sert ensuite d'orchestrateur : elle
cherche les bonnes briques, produit une définition structurée et demande au
moteur de la rendre.

## Décisions déjà prises

- La bibliothèque est la source de vérité ; la mémoire d'un agent ne l'est pas.
- Les rendus validés doivent être déterministes : mêmes paramètres, même résultat.
- Le contenu sémantique est séparé du dessin, du mode d'activité et de l'interface.
- Les outils interactifs exposent un contrat de lancement réutilisable : une page
  élève peut fournir des paramètres validés et ouvrir directement le bon exemple.
- Un contenu peut produire plusieurs sorties : web, téléphone, diaporama, impression
  et PDF.
- Les contenus passent par les états `draft`, `review`, `validated`, `deprecated`.
- Les identifiants stables préparés dans `/auto` sont conservés.
- Les résultats d'élèves ne sont jamais stockés dans GitHub.
- Les parents et les élèves n'obtiennent jamais un accès d'écriture au dépôt.
- Automatismes sera migré progressivement, après stabilisation de ses modules.

## Documents

1. [Vision et principes](docs/01-VISION-ET-PRINCIPES.md)
2. [Architecture cible](docs/02-ARCHITECTURE-CIBLE.md)
3. [Charte et contrôle visuel](docs/03-CHARTE-ET-CONTROLE-VISUEL.md)
4. [Données et résultats](docs/04-DONNEES-ET-RESULTATS.md)
5. [Feuille de route](docs/05-ROADMAP.md)
6. [Inventaire et migration](docs/06-INVENTAIRE-MIGRATION.md)

Premier composant pédagogique documenté : [Pythagore](components/pythagore/README.md),
avec son contrat expérimental [JSON](schemas/pythagore-components.v1.json).

## Premier pack exécutable

Le [pack de représentations v1](components/representation-pack-v1.js) fournit
des rendus SVG déterministes pour :

- les jetons de nombres relatifs ;
- les droites graduées simples et doubles ;
- les bandes et grilles de fractions ;
- les doubles droites et barres de pourcentages.

La [prévisualisation](preview/representations.html) permet de tester ces quatre
familles sans modifier les questions d'Automatismes. L'[adaptateur
Automatismes](adapters/automatismes/representation-pack-adapter.js) sépare le
rendu graphique du moteur de questions.

Le contrat de données est décrit dans
[representation-components.v1.json](schemas/representation-components.v1.json).
Les tests peuvent être lancés avec :

```bash
node studio/tests/representations/representation-pack.test.js
```

## État actuel

Le dossier contient maintenant les contrats de départ, le premier pack exécutable
et son adaptateur. Aucun moteur de questions d'Automatismes n'a été déplacé :
`/auto` reste responsable des modules, des banques, de l'aléatoire, des réponses,
des corrections et des identifiants stables.

À terme, la partie source pourra être déplacée dans un dépôt privé
`mathsgo-studio`, tandis que le dépôt public `maths` restera le site publié.
