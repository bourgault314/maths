# @mathsgo/moteur-exercices

Cœur des exercices de la future Automatismes V2 et du Studio.

Règles du package :

- **aucune dépendance** externe ;
- **aucun accès au navigateur** (pas de DOM, pas de `document`, pas de CSS) :
  tout est calculable et testable hors interface ;
- **déterminisme** : mêmes entrées (graine, paramètres, version) → mêmes
  sorties, toujours. Interdiction d'utiliser `Math.random()` ou l'horloge ;
- tout comportement est couvert par des tests (`node --test`).

## Contenu actuel

| Module | Rôle |
|---|---|
| `src/aleatoire.js` | Hasard reproductible : graine texte ou nombre, réels, entiers, choix, mélange. `VERSION_ALEATOIRE` protège les séries déjà partagées. |
| `src/generation.js` | Registre de générateurs et instanciation : gabarit (donnée) + graine → question conforme au contrat, validée avant d'être rendue. |

## Usage

```js
import { creerGenerateur } from "@mathsgo/moteur-exercices/aleatoire";

const g = creerGenerateur("serie-6A-2026");
g.entier(1, 100);        // même suite pour tout le monde avec cette graine
g.choix(["a", "b", "c"]);
g.melange([1, 2, 3, 4]);
```

Les tests du registre reposent sur une fixture locale sans contenu
pédagogique. Aucun générateur réel n'est ajouté avant validation de la fiche de
sa notion.
