# Règles de travail du dépôt maths&go

Le dépôt GitHub est la source de vérité. Avant toute tâche concernant
Automatismes V2, lire dans cet ordre :

1. `docs/automatismes-v2/pilotage.md` ;
2. `docs/automatismes-v2/etat.md` ;
3. `docs/automatismes-v2/decisions.md` ;
4. la fiche de la notion concernée, lorsqu'elle existe.

## Règles générales

- Préserver les modifications existantes et travailler sur une branche courte.
- Annoncer l'objectif et le périmètre avant toute modification.
- Une seule tâche active à la fois ; ne pas ouvrir plusieurs chantiers V2 en parallèle.
- Ne jamais fusionner une pull request sans validation explicite de Gwenaël.
- JavaScript moderne, sans dépendance externe ni compilation.
- Toute logique testable doit fonctionner avec `node --test`, sans navigateur.
- Vérifier les cas limites mathématiques et le déterminisme des générations.

## Automatismes V2

- L'ancienne banque et la bêta sont des inventaires de notions, jamais des
  sources d'énoncés, de paramètres, de valeurs, de distracteurs ou de code.
- La bêta est gelée, sauf correction critique distincte du chantier V2.
- Aucun contenu pédagogique réel n'est programmé avant validation de sa fiche
  par Gwenaël.
- Travailler catégorie par catégorie et notion par notion.
- Réutiliser les fondations indépendantes validées ; ne pas refaire les objets
  visuels acquis sans raison établie.
- Ne pas reconduire automatiquement l'interface, les couleurs ou l'organisation
  de la bêta.
- Ne pas introduire GeoGebra sans demande explicite.
- Les états d'avancement sont `a_faire`, `construit` et `valide`.
- Un contenu non `valide` ne doit jamais être exposé aux élèves.
