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
| `src/question-v2.js` | `mathsgo.question-instance/2` | Question interactive V2 : blocs texte, entier, rationnel, puissance ou solide ; choix, entier, décimal exact et fraction équivalente. |
| `src/gabarit.js` | `mathsgo.gabarit-question/1` | Une famille de questions à valeurs variables : référence un générateur du moteur par nom et version, avec des paramètres en données pures. |
| `src/seance.js` | `mathsgo.seance/1` | La sélection et l'état d'une séance, sans score recopié, identité, durée ni donnée d'écran. |
| `src/trace-reponse.js` | `mathsgo.trace-reponse/1` et `/2` | La première validation interactive. La version 2 ajoute le classement canonique et les versions du contenu pour rendre un futur export interprétable sans la question complète ; la version 1 reste lisible. |

Les tests utilisent uniquement des fixtures techniques neutres. Un nouveau
contrat n'est ajouté que lorsqu'un consommateur réel et validé en a besoin.
