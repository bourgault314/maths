# Données et résultats

Le futur suivi doit être préparé dès maintenant, mais aucune collecte ne doit
être activée avant la définition du serveur, des finalités et des protections.

## Séparation fondamentale

- **contenu** : composants, questions, aides et corrections ;
- **activité** : assemblage proposé à un élève ou un groupe ;
- **tentative** : réponse produite pendant une activité ;
- **identité** : information éventuellement détenue par un service distinct.

GitHub ne stocke que le contenu public ou le code source. Il ne stocke jamais les
réponses, noms, classes ou profils des élèves.

## Identifiants à conserver

Les travaux déjà engagés dans Automatismes constituent une bonne base :

- `moduleId` ;
- `templateId` ;
- `templateVersion` ;
- `questionInstanceId` ;
- `seriesId` ;
- paramètres générés ;
- type de réponse et valeur canonique.

À terme, une tentative pourra ajouter :

- résultat juste, faux ou partiel ;
- réponse normalisée ;
- durée active plafonnée ;
- aide ou cours ouvert ;
- nombre d'essais ;
- contexte d'affichage ;
- horodatage côté serveur.

## Règles de protection

- pseudonyme technique plutôt que nom dans les événements ;
- table d'identité séparée et accès restreint si une identification devient utile ;
- durée de conservation définie ;
- suppression possible ;
- consentement et information adaptés aux mineurs ;
- aucune clé secrète dans le site GitHub Pages ;
- aucune décision sensible prise automatiquement par une IA.

## Analyse par IA

Une IA pourra plus tard :

- repérer des erreurs récurrentes ;
- proposer un prochain exercice ;
- résumer les réussites et obstacles ;
- comparer plusieurs représentations ;
- produire un bilan enseignant ou parent.

Elle devra travailler en priorité sur des données pseudonymisées et structurées.
Le moteur de règles garde la responsabilité des calculs simples et des scores ;
l'IA intervient pour l'interprétation pédagogique, avec possibilité de contrôle
humain.

## Étapes avant activation

1. stabiliser les contrats d'activité et de question ;
2. définir le contrat de tentative ;
3. réaliser une analyse juridique et de sécurité ;
4. choisir l'hébergement et la base de données ;
5. tester sans identité réelle ;
6. mettre en place information, consentement et suppression ;
7. seulement ensuite, activer une collecte limitée.
