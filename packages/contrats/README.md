# @mathsgo/contrats

Les **contrats de données** de l'univers maths&go : les formats standards que
le site, Automatismes V2 et le Studio s'engagent à respecter pour échanger des
contenus. Un contrat, c'est la réponse écrite et testée à la question
« à quoi ressemble exactement une question / une série / un résultat ? ».

Règles du package :

- **données pures** : jamais de code exécutable dans un contenu ;
- **aucune dépendance**, aucun accès au navigateur ;
- **versionnement strict** : un changement incompatible = nouvelle version du
  schéma (`mathsgo.question-instance/2`), jamais une modification silencieuse ;
- chaque contrat est accompagné de son validateur et de ses tests.

## Contenu actuel

| Module | Contrat | Rôle |
|---|---|---|
| `src/question.js` | `mathsgo.question-instance/1` | Une question prête à afficher : énoncé en blocs (texte/LaTeX à trous `[[reponse]]`), réponses acceptées par champ, aide et correction facultatives, traçabilité d'origine. |

La preuve de récupérabilité des contenus V1 fait partie des tests : les
questions statiques du module réel `dnb_01` sont converties et validées
contre le contrat à chaque exécution de `node --test`.

À venir : contrat de série (`SeriesDefinition`), contrat de gabarit
(`QuestionTemplate`), contrat d'essai (`AttemptEvent`) — dans cet ordre,
chacun introduit au moment où un consommateur réel en a besoin.
