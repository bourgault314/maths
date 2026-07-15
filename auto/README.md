# Automatismes maths&go — application publique 1.15

Application d'automatismes pour le cycle 4 et le DNB, publiée à l'adresse
`https://mathsgo.re/auto/`.

## Organisation réellement publiée

| Chemin | Rôle |
|---|---|
| `index.html` | interface de sélection et de partage |
| `styles/setup.css` | styles de l'écran de préparation |
| `scripts/data/` | banque de modules par domaine |
| `scripts/01-modules.js` | assemblage et configuration des modules |
| `scripts/02-question-engine.js` | génération, réponses et visuels |
| `scripts/core/01-series-contracts.js` | identifiants, versions et codes MG1 |
| `scripts/03-slideshow.js` | diaporama, cours, interactions et tentatives |
| `scripts/04-app.js` | tirage équilibré et lancement |
| `scripts/core/02-share-ui.js` | lien, QR code et ouverture directe |
| `scripts/vendor/` | générateur de QR code embarqué |

La page publique utilise ces fichiers découpés. L'ancien gros fichier autonome
n'est plus la source canonique du site.

## Garanties actuelles

- 42 modules enregistrés avec des codes permanents ;
- mêmes paramètres et même seed : mêmes séries ;
- modes interactif et diaporama ;
- plateaux de nombres relatifs manipulables (addition et soustraction), ciblés 5e/cycle 4 ;
- partage par lien, code MG1 et QR code ;
- aucun nom ni résultat d'élève dans le lien ;
- `AttemptRecorder` préparé mais désactivé ;
- outil utilisable sans serveur applicatif pour les fonctions pédagogiques.

## Identifiants et versions

Les identifiants du registre dans `scripts/core/01-series-contracts.js` ne doivent
jamais être réutilisés ou réordonnés. Un nouveau module reçoit un nouveau code.

Le numéro `n` d'un modèle de question reste stable. Une modification de son sens,
de ses paramètres ou de sa correction augmente `options.template_version`. Une
retouche purement visuelle ne crée pas une nouvelle question.

## Évolution vers le moteur pédagogique

Automatismes ne doit pas être découpé davantage au hasard. La stratégie de
migration est documentée dans
[`../studio/docs/06-INVENTAIRE-MIGRATION.md`](../studio/docs/06-INVENTAIRE-MIGRATION.md).

Les futurs composants seront extraits un module à la fois, après stabilisation
pédagogique, comparaison des rendus et tests de non-régression.
