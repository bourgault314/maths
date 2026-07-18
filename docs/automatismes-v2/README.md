# Automatismes maths&go V2

Ce dossier est la **mémoire durable** du chantier V2. Il est écrit pour être
lu dans six mois, par quelqu'un qui n'était pas là — y compris par nous.

## L'objectif

Construire une nouvelle application Automatismes, indépendante de la banque
héritée, utilisable :

- sur téléphone en priorité ;
- sur ordinateur ;
- au vidéoprojecteur ou au TNI ;
- en entraînement individuel ;
- pour créer et partager une série ;
- pour rejoindre une activité avec un code ;
- à terme, de CM1 à la 3e et au DNB.

## Où en est le chantier

| Lot | Contenu | État |
| --- | --- | --- |
| **0** | Socle technique : contrats, moteur de série, thème, banc d'essai | **livré, en attente de relecture** |
| 1 | Première tranche réelle « Puissances et carrés » | à spécifier |
| 2 | Première interface V2 | à venir |
| 3 | Les quatre modes d'utilisation | à venir |
| suivants | Catégorie par catégorie | à venir |

### Ce que le lot 0 permet déjà de faire

La chaîne complète fonctionne et se vérifie :

```
définition de série → sélection déterministe → tirage des valeurs
   → série → code partageable MG2 → rejeu à l'identique ailleurs
```

Elle tourne aujourd'hui sur des **fixtures techniques**, pas sur du contenu
de classe : le lot 0 construit la mécanique, pas les questions.

### Ce que le lot 0 ne fait volontairement pas

- **Aucun contenu pédagogique nouveau.** Les questions viendront au lot 1,
  avec les formulations de Gwenaël.
- **Aucune interface.** Le banc d'essai (`studio/automatismes-v2/`) est un
  outil de mise au point interne : ni maquette, ni proposition de couleurs.
- **Aucune modification de `/auto/`.** L'application actuelle continue de
  fonctionner exactement comme avant.

## La règle qui prime sur tout

> Aucun contenu n'est visible d'un élève tant que **Gwenaël** ne l'a pas
> validé lui-même.

Trois états existent : `brouillon`, `a-valider`, `valide`. Aucun assistant ne
pose `valide` — c'est vérifié par un test automatique.

## Les autres documents

| Document | Ce qu'on y trouve |
| --- | --- |
| [architecture.md](architecture.md) | Les couches, ce que chacune a le droit de faire, et ce qui est interdit |
| [contrats.md](contrats.md) | Les formats de données et ce que chacun garantit |
| [programme-et-profils.md](programme-et-profils.md) | Niveaux, programmes, calendrier officiel, profils DNB |
| [decisions.md](decisions.md) | Journal des décisions, avec date et justification |
| [workflow-categorie.md](workflow-categorie.md) | La méthode, catégorie par catégorie |
| [tests.md](tests.md) | Ce qu'on teste, et pourquoi |
| [migration.md](migration.md) | L'état de chaque module, et ce qui reste à faire |

## Documents liés, hors de ce dossier

- [`docs/provenance-et-independance.md`](../provenance-et-independance.md) —
  la doctrine de provenance, qui explique pourquoi la banque héritée ne sert
  plus que d'inventaire de notions.
- [`docs/signature-pedagogique.md`](../signature-pedagogique.md) — la règle
  de validation pédagogique.
- [`docs/reference-matrice-automatismes/`](../reference-matrice-automatismes/) —
  les 187 automatismes officiels, vérifiés ligne à ligne contre le BO.
