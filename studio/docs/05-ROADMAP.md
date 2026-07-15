# Feuille de route

## Phase 0 — Fondations et rangement

État : **en cours**

- inventorier les outils et les doublons ;
- conserver les anciennes URL importantes par redirection ;
- documenter vision, architecture, graphisme et données ;
- ne rien extraire massivement d'Automatismes.

## Phase 1 — Contrats et système graphique

- choisir les identifiants et statuts communs ;
- créer les premiers schémas JSON en version expérimentale ;
- définir les jetons graphiques maths&go ;
- installer les contrôles téléphone, ordinateur et impression ;
- définir le contrat tactile commun : déplacer, sélectionner, annuler, zoomer et
  dessiner ne doivent pas se faire concurrence ;
- prévoir un zoom navigateur autorisé et, lorsque le geste devient ambigu, des
  commandes explicites `+` / `−` plutôt qu'un zoom tactile imposé ;
- définir des cibles tactiles suffisamment grandes, un retour visuel après chaque
  action et un bouton de réinitialisation facilement retrouvable ;
- fixer la procédure `draft → review → validated`.

## Phase 2 — Composants pilotes

Composants proposés :

1. groupes de billes et multiplication ;
2. bandes et murs de fractions ;
3. Splat ou schéma partie-tout ;
4. jetons de nombres relatifs et paires nulles.

Chaque pilote doit fonctionner en cours, question, diaporama et impression avant
de généraliser le contrat.

Pour les jetons de nombres relatifs, le premier plateau choisi sera terminé et
validé avant de fabriquer les variantes simplifiées ou de l'intégrer à
Automatismes. La version de référence restera le plateau complet ; les versions
simplifiées seront des modes du même composant, pas cinq nouveaux outils
indépendants.

## Chantier prioritaire — plateaux manipulables réutilisables

Ce chantier prépare les plateaux de nombres relatifs, puis les autres
représentations manipulables de maths&go.

- construire une brique de jetons manipulables utilisable sur ordinateur et
  téléphone ;
- prévoir un mode `complet` et un mode `simplifié`, avec le même moteur de
  déplacement et les mêmes règles mathématiques ;
- créer une **station d'accueil** intégrable dans une page : elle reçoit un
  calcul, une représentation et des options d'affichage, puis rend le plateau
  manipulable sans recopier son code dans chaque activité ;
- permettre à une activité de fournir un calcul ou une configuration de départ
  au plateau, puis de récupérer un état de manipulation pour la correction ;
- préparer une insertion légère dans les questions d'Automatismes, d'abord sur
  un seul module finalisé ;
- conserver les recettes de dessin, paramètres, identifiants et règles
  pédagogiques dans la bibliothèque réutilisable, séparés du gros moteur
  actuel.

Ordre de réalisation :

1. choisir un plateau de nombres relatifs et le finaliser ;
2. valider son ergonomie sur téléphone, ordinateur et projection ;
3. extraire le composant et sa station d'accueil ;
4. produire le mode simplifié et un premier exemple ALF ;
5. brancher un seul calcul dans Automatismes ;
6. généraliser seulement après comparaison avec le plateau validé.

## Phase 3 — Parcours d'Axelle piloté par JSON

- reconstruire un petit parcours avec les composants pilotes ;
- vérifier qu'aucun SVG spécifique n'est recodé dans la page ;
- créer une prévisualisation distincte de la publication ;
- mesurer le temps et les tokens nécessaires à une nouvelle activité.

## Phase 4 — Adaptateur Automatismes

Début uniquement lorsque les modules concernés sont pédagogiquement stables.

- conserver `/auto` en fonctionnement ;
- commencer par un seul module finalisé ;
- extraire données, générateur, représentation et correction ;
- comparer les sorties avec la version actuelle ;
- migrer ensuite famille par famille ;
- supprimer l'ancien code seulement après équivalence vérifiée.

## Phase 5 — Studio de composition

- recherche dans le catalogue ;
- formulaire simple et commande vocale ;
- aperçu téléphone, projection et papier ;
- historique des brouillons ;
- validation et publication réservées au propriétaire.

## Phase 6 — Accès parents et IA

- API stable ;
- serveur MCP avec peu d'outils génériques ;
- authentification et quotas ;
- création de liens temporaires ;
- interface maths&go utilisable sans IA externe ;
- tests ChatGPT, Gemini et autres clients compatibles.

## Phase 7 — Résultats et personnalisation

- base de données distincte ;
- tentatives pseudonymisées ;
- tableaux de bord ;
- recommandations contrôlées ;
- synthèses par IA avec validation humaine.

## Définition de « terminé » pour un composant

Un composant n'est terminé que si :

- son contrat est validé ;
- ses paramètres invalides sont refusés ;
- ses conventions mathématiques sont documentées ;
- ses exemples pédagogiques sont relus ;
- téléphone, projection et impression sont contrôlés ;
- ses captures de référence sont enregistrées ;
- son accessibilité minimale est vérifiée ;
- son origine et sa licence sont renseignées ;
- sa compatibilité de version est testée.
