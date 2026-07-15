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

## État actuel

Le dossier contient uniquement les contrats de départ et la feuille de route.
Aucun moteur d'Automatismes n'a encore été déplacé. Les premiers composants ne
seront créés qu'après validation de leurs paramètres et de leurs références
visuelles.

À terme, la partie source pourra être déplacée dans un dépôt privé
`mathsgo-studio`, tandis que le dépôt public `maths` restera le site publié.
