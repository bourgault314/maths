# Archive — prompt remplacé, ne pas exécuter

> Ce prompt imposait une parité avec la bêta. Il est conservé uniquement pour
> comprendre l'historique du chantier. La décision D-002 de
> `docs/automatismes-v2/decisions.md` l'a remplacé le 18 juillet 2026.

# Ancien prompt à donner à Claude

Je veux que tu poursuives la fondation de la reconstruction des Automatismes maths&go à partir de la bêta actuelle, sans redessiner l’outil et sans modifier silencieusement son comportement.

Je te joins deux fichiers produits par un inventaire complet :

- `inventaire-automatismes-beta.md` : diagnostic, cartographie des 43 modules et ordre de travail recommandé ;
- `inventaire-automatismes-beta.json` : inventaire machine question par question.

La référence canonique est la bêta au commit `242c81f636e3b443af028b1fef7cd68fb9db1356`. L’ancien `automatisme.html` ou `auto/index1.html` est uniquement un témoin historique pour contrôler une ancienne formulation, un ancien SVG ou une dépendance ; il ne doit pas remplacer la bêta.

Avant toute modification, lis dans cet ordre :

1. `AGENTS.md` ;
2. `docs/PROTOCOLE-AUTOMATISMES-MATHSGO.md` ;
3. `docs/CONTRAT-MODULE.md` ;
4. la documentation de la catégorie concernée ;
5. `docs/SOURCES-DE-VERITE.md` ;
6. `docs/CONTRAT-MANIPULATION.md` ;
7. les deux fichiers d’inventaire joints.

## Objectif de cette étape

Stabiliser un contrat de module réellement reconstructible avant d’intégrer l’univers graphique général. Ce contrat doit pouvoir représenter explicitement :

- l’identité stable, le domaine et les niveaux ;
- les gabarits présents dans la banque ;
- les gabarits virtuels créés pendant la sélection ;
- le générateur déterministe et ses paramètres ;
- la stratégie de sélection et de couverture ;
- le rendu question et correction ;
- la politique avec aide, sans aide et aide révélable ;
- le type de réponse, les valeurs acceptées et les distracteurs diagnostiques ;
- le cours et les sections d’aide ;
- le contrat de manipulation, la remise à zéro et la sérialisation ;
- les supports téléphone, ordinateur, projection et impression.

## Vérités à préserver

- 43 modules.
- 478 gabarits de banque, protégés par l’empreinte actuelle.
- 17 gabarits virtuels supplémentaires produits par `dnb_14`, `dnb_15`, `dnb_17` et `dnb_18`.
- 495 définitions exécutables au total si l’on compte banque et virtuels.
- Seed comprise entre 0 et 233279 et génération déterministe.
- En mode interactif, 10 séries successives partagent la même banque de tirage.
- Aucun gabarit ne revient avant l’épuisement de son paquet, sauf règle explicite du module.
- Les sorties question/correction, les modes avec/sans aide et les liens MG1 doivent rester compatibles.

Attention : plusieurs documents annoncent encore 42/475 ou 43/476. Le test canonique actuel valide 43/478. Ne change pas la banque pour faire correspondre les anciens documents ; mets les documents à jour.

## Travail demandé maintenant

1. Compare ta fondation actuelle au contrat ci-dessus et à l’inventaire JSON.
2. Propose une modification minimale de la fondation qui sait représenter séparément `bankTemplates` et `virtualTemplates`.
3. Ajoute ou adapte les validations automatiques pour figer 43 modules, 478 gabarits de banque, 17 virtuels et 495 définitions exécutables.
4. Ajoute le classement pédagogique manquant des 13 virtuels :
   - `dnb_15` Q10, Q11, Q12 ;
   - `dnb_17` Q11 à Q20.
5. Rends explicite, pour chaque module, si génération, sélection et rendu sont locaux, globaux, génériques ou hybrides.
6. Documente les 98 `formula_code` encore stockés mais non exécutés parce qu’un générateur local ou global les court-circuite. Ne les supprime pas avant preuve de parité et validation pédagogique.
7. Prépare un emplacement canonique pour les `errorCode` des distracteurs ; aujourd’hui le contrat persistant des QCM les remet à `null`.
8. Mets à jour les documents obsolètes sur les nombres de modules et de gabarits.

## Limites de cette étape

- Ne déplace pas encore massivement les 184 questions dont le visuel n’a pas d’identifiant de composant.
- Ne redessine pas les SVG historiques.
- Ne modifie pas les tirages, les réponses, les formulations ou les corrections pour « nettoyer » le code.
- Ne transforme pas `auto/dev/visual-library.html` en deuxième source de vérité ou en deuxième Studio. Garde-la comme banc d’essai des 27 composants, des 10 manipulations et des registres pédagogiques.
- N’intègre pas encore tout l’univers graphique dans tous les écrans.

## Validation attendue

Commence par m’expliquer précisément :

- ce que ta fondation représente déjà ;
- ce qui manque par rapport à l’inventaire ;
- les fichiers que tu proposes de modifier ;
- les risques de régression ;
- l’ordre exact des changements.

Après mon accord, implémente la fondation, lance toute la suite `npm test`, puis ajoute des tests ciblés sur les 17 gabarits virtuels et sur la distinction banque/virtuel. Donne-moi enfin un bilan factuel des changements, des tests et des points encore non migrés.

Pour le premier pilote vertical après stabilisation, utilise `dnb_08` comme cas simple, puis `dnb_02` ou `dnb_02b` comme cas riche, et enfin `dnb_14` ou `dnb_18` comme cas hybride. Un module n’est « extrait » que si génération, sélection, rendu, réponse, aide, correction et supports sont tous explicitement couverts.
