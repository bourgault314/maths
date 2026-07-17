# Studio pédagogique maths&go

Ce dossier est la bibliothèque centrale unique du futur moteur pédagogique de
maths&go.

Le but n'est pas de demander à une IA de recréer une page ou un dessin à chaque
prompt. Le Studio conserve les contenus, les représentations, les règles
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
- Les contenus passent par les états `draft`, `review`, `validated`,
  `deprecated`.
- Les identifiants stables préparés dans `/auto` sont conservés.
- Les résultats d'élèves ne sont jamais stockés dans GitHub.
- Les parents et les élèves n'obtiennent jamais un accès d'écriture au dépôt.
- Automatisme sera migré progressivement, après stabilisation de ses modules.
- Il n'existe qu'une seule bibliothèque centrale : ce dossier `studio/`.

## Documents

1. [État réel et périmètre initial](docs/00-ETAT-REEL-20260717.md)
2. [Vision et principes](docs/01-VISION-ET-PRINCIPES.md)
3. [Architecture cible](docs/02-ARCHITECTURE-CIBLE.md)
4. [Charte et contrôle visuel](docs/03-CHARTE-ET-CONTROLE-VISUEL.md)
5. [Données et résultats](docs/04-DONNEES-ET-RESULTATS.md)
6. [Feuille de route](docs/05-ROADMAP.md)
7. [Inventaire et migration](docs/06-INVENTAIRE-MIGRATION.md)

## Composants déjà documentés

- [Pythagore](components/pythagore/README.md), avec son contrat expérimental
  [JSON](schemas/pythagore-components.v1.json) et ses rendus exécutables ;
- [Représentations de pourcentage](components/percentage-table/README.md), premier
  pilote en cours d'audit.

## État actuel

Le Studio possède déjà une base documentaire et un composant Pythagore
expérimental. Le premier travail de construction porte sur l'extraction des
représentations de pourcentage existantes. Aucun moteur complet d'Automatismes ne
doit être déplacé dans ce dossier.

Les anciennes pages publiques restent les références publiées pendant la
migration. Le dépôt `mathsgo-automatismes-beta` reste une application séparée.
