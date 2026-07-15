# Vision et principes

## Vision

maths&go doit devenir une fabrique pédagogique pilotable en langage naturel.

Exemple de demande :

> Prépare à une élève de CM1 un rappel sur les groupes égaux, deux exercices
> guidés et un petit jeu, utilisables sur téléphone.

L'IA ne dessine pas elle-même les groupes, les fractions ou les figures. Elle
sélectionne des composants maths&go validés et fournit leurs paramètres au moteur.

## Utilisateurs visés

- l'enseignant qui prépare un cours, une projection ou une fiche ;
- l'élève qui reçoit un parcours simple et adapté ;
- le parent qui demande une activité depuis maths&go ou depuis son IA ;
- le collaborateur qui prépare un brouillon sans pouvoir publier directement ;
- plus tard, un service d'analyse des résultats pseudonymisés.

## Ce qui constitue la valeur de maths&go

- les choix pédagogiques de l'enseignant ;
- les représentations mathématiques précises ;
- les erreurs fréquentes et les aides associées ;
- les progressions et les prérequis ;
- la cohérence graphique sur téléphone, projection et papier ;
- la validation humaine des contenus.

Le modèle d'IA est remplaçable. Ces éléments ne le sont pas.

## Principes non négociables

1. **Une seule source sémantique.** Un cours n'est pas recopié séparément dans
   une page web, un PDF et un diaporama.
2. **Rendu déterministe.** L'aléatoire porte sur les paramètres pédagogiques,
   jamais sur les conventions de dessin.
3. **Validation humaine.** Une génération de l'IA reste un brouillon tant qu'elle
   n'est pas validée.
4. **Compatibilité progressive.** Les outils actuels continuent de fonctionner
   pendant leur migration.
5. **Mobile d'abord, projection et impression vérifiées.** Aucun composant n'est
   déclaré validé sans ces contrôles.
6. **Données minimales.** La création d'une activité n'exige aucune identité
   d'élève ; le futur suivi est séparé du contenu.
7. **Indépendance des IA.** Le même moteur doit pouvoir être appelé depuis le
   site, ChatGPT, Gemini ou un autre client compatible.
8. **Historique par Git.** On évite les copies `V1`, `V2`, `finale2` ; les versions
   sont conservées par Git et décrites dans les manifestes.

## Ce que le projet n'est pas

- un long prompt chargé de mémoriser toute la pédagogie ;
- une collection de pages HTML indépendantes et dupliquées ;
- un agent autorisé à modifier librement le site public ;
- une banque de PDF sans source structurée ;
- un système de collecte de données construit avant les usages pédagogiques.
