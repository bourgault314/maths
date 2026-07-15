# Architecture cible

## Vue d'ensemble

La cible comporte neuf couches indépendantes.

1. **Schémas** : contrats JSON et règles de validation.
2. **Système graphique** : couleurs, typographies, mesures et conventions.
3. **Composants de représentation** : fraction, barre, Splat, figure, jetons…
4. **Gabarits pédagogiques** : énoncé, paramètres, réponse, aides et erreurs.
5. **Modes d'activité** : cours, diaporama, apprentissage guidé, QCM, jeu, fiche.
6. **Catalogue** : contenus validés, compétences, prérequis et licences.
7. **Compositeur** : transforme une intention en définition d'activité.
8. **Lecteur** : affiche la définition sur téléphone, écran ou papier.
9. **Adaptateurs** : Automatismes, export PDF, API/MCP et futurs services.

## Arborescence cible

```text
mathsgo-studio/
├── schemas/
├── design-system/
├── components/
│   ├── fraction-strip/
│   ├── bead-groups/
│   ├── bar-model/
│   ├── splat/
│   └── geometry/
├── templates/
├── modes/
│   ├── course/
│   ├── slideshow/
│   ├── guided-learning/
│   ├── quiz/
│   ├── game/
│   └── printable/
├── catalogue/
├── composer/
├── player/
├── adapters/
│   ├── automatismes/
│   ├── pdf/
│   └── mcp/
└── tests/
    ├── contracts/
    ├── pedagogy/
    └── visual/
```

Cette arborescence est une cible. Elle ne doit pas provoquer une migration massive
des outils existants.

## Contrat minimal d'un composant

Chaque composant possédera au minimum :

```json
{
  "componentId": "representation.bead-groups",
  "version": 1,
  "status": "draft",
  "renderer": "bead-groups",
  "supportedModes": ["course", "quiz", "slideshow", "printable"],
  "parameters": {},
  "pedagogy": {},
  "sources": [],
  "license": null
}
```

Le schéma définitif ne sera figé qu'après les trois composants pilotes.

## Contrat minimal d'une activité

Une activité est un assemblage, pas une nouvelle page codée à la main.

```json
{
  "activityId": "axelle-2026-07-groups",
  "status": "draft",
  "audience": {"level": "CM1"},
  "theme": "mathsgo-default",
  "blocks": [
    {
      "mode": "course",
      "templateId": "multiplication.equal-groups",
      "parameters": {"total": 12, "groups": [3, 4]}
    }
  ]
}
```

## Le rôle de l'IA

L'IA doit disposer de peu d'outils, stables et contrôlés :

- `searchCatalogue` : trouver des contenus adaptés ;
- `inspectItem` : lire un contrat et ses exemples ;
- `createDraft` : produire une activité structurée ;
- `renderPreview` : obtenir un lien de prévisualisation ;
- `requestPublication` : demander une validation humaine.

Le serveur, et non l'IA, vérifie les paramètres et refuse les combinaisons
invalides. Un compte parent ne possède jamais l'outil de publication.

## Site public et source privée

- `maths` : site public, lecteurs et ressources publiées ;
- `mathsgo-studio` : source privée, brouillons, catalogue, tests et moteurs ;
- serveur futur : authentification, activités temporaires, résultats et API/MCP.

GitHub Pages reste adapté aux pages statiques et aux prototypes. Le futur service
de résultats ou de génération à la demande sera hébergé séparément.

## Cours, LaTeX et PDF

La source canonique d'un cours contient du texte structuré, des expressions
LaTeX et des appels de composants. Des adaptateurs produisent ensuite :

- HTML interactif ;
- diaporama ;
- PDF ou document imprimable ;
- éventuellement une source LaTeX complète.

Les PDF déjà publiés peuvent rester des ressources liées. Les PDF temporaires
ne sont pas tous archivés dans Git.
