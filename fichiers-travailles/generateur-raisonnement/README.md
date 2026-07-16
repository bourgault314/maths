# Raisonner au collège — dossier de conception

Prototype autonome maths&go, conçu pour une utilisation en vidéoprojection et une future intégration dans **Automatismes Cycle 4 – DNB**.

## La vision

Le générateur n’essaie pas de réduire le raisonnement à une série de QCM. Il entraîne des **gestes courts et transférables** qui libèrent ensuite l’élève dans des problèmes plus longs :

1. observer, classer et repérer un invariant ;
2. formuler une conjecture et préciser son domaine ;
3. tester une affirmation par des exemples bien choisis ;
4. chercher un contre-exemple ;
5. distinguer donnée, définition, propriété et conclusion ;
6. enchainer ou remettre en ordre les étapes d’une preuve ;
7. distinguer théorème, réciproque et contraposée ;
8. repérer la première étape fausse d’un raisonnement ;
9. choisir une représentation, une stratégie ou une information utile ;
10. contrôler la vraisemblance, les unités et le domaine de validité ;
11. interpréter un résultat ou discuter une hypothèse de modèle ;
12. planifier, surveiller et évaluer sa démarche.

Le rituel est court, mais la correction demande une parole mathématique : « je sais que… », « cela ne suffit pas parce que… », « voici un contre-exemple… », « l’hypothèse manquante est… ».

## Ce que demandent les programmes français

Le programme de cycle 3 publié en 2025 relie explicitement automatismes, stratégies immédiatement disponibles, mémoire de travail, raisonnement, argumentation, comparaison de méthodes et apprentissage à partir des erreurs. En 6e, il installe la pensée préalgébrique par les motifs, schémas en barres et balances, ainsi qu’une initiation progressive à la preuve en géométrie.

Le programme de cycle 4 publié au BO du 5 mars 2026 va beaucoup plus loin :

- distinction entre définition, propriété, propriété caractéristique, conjecture et énoncé prouvé ;
- raisonnements déductif, par l’absurde et par contre-exemple ;
- vocabulaire de théorème, réciproque et contraposée ;
- priorité donnée à la compréhension et à l’enchainement logique avant le formalisme ;
- preuves à compléter, à remettre en ordre, schémas de raisonnement et exemples génériques ;
- démonstrations par le calcul littéral, conjectures, invariants géométriques ;
- validation d’un modèle probabiliste, interprétation critique des données ;
- analyse et modification d’algorithmes ;
- comparaison de démarches et métacognition.

Son entrée en vigueur est progressive : 5e à la rentrée 2026, 4e en 2027, puis 3e en 2028. Le prototype couvre donc la 6e avec le programme de cycle 3 de 2025, puis les 5e, 4e et 3e avec le programme de cycle 4 de 2026. Le filtre d’un niveau est cumulatif : une série de 4e peut réactiver des gestes installés en 6e ou 5e.

## Position retenue : un mode transversal, pas un domaine supplémentaire

« Raisonnement mathématique » est le bon nom pour l’outil et pour sa future entrée dans Automatismes. En revanche, il ne doit pas être rangé comme un domaine supplémentaire à côté des nombres, de l’algèbre ou de la géométrie. Les programmes et cadres étudiés placent le raisonnement **dans tous les contenus**.

Les neuf gestes restent donc des métadonnées précises pour le moteur, l’audit et la future intégration. L’enseignant n’a plus à les choisir un par un. La V0.2 les regroupe en cinq parcours lisibles :

| Parcours visible | Progression interne |
|---|---|
| Équilibré | Mélange régulé de tous les gestes |
| Chercher | Observer → conjecturer → tester → choisir une stratégie |
| Convaincre | Observer → conjecturer → réfuter → déduire → justifier → critiquer |
| Examiner | Observer → analyser une solution → tester → vérifier → comparer les stratégies |
| Modéliser | Observer → formuler → choisir → interpréter → vérifier les limites |

Le parcours Équilibré reste le choix par défaut. Choisir seulement un niveau puis cliquer sur « Lancer 10 questions » suffit ; les parcours et filtres sont derrière « Personnaliser la série ».

## Inspirations étrangères retenues et conséquences concrètes

| Cadre | Idée utile | Traduction dans le prototype |
|---|---|---|
| Angleterre, Key Stage 3 | Conjecturer, chercher preuve ou contre-exemple, raisonner déductivement, examiner ce que les données permettent d’inférer | Familles « toujours/parfois/jamais », contre-exemple, conclusion permise ou non |
| Singapour, secondaire | Résolution de problèmes au centre ; articulation concepts, techniques, processus, métacognition et attitudes ; Polya, heuristiques, modélisation | Choix de stratégie, planifier/surveiller/évaluer, hypothèses de modèle |
| TIMSS 2023, niveau 8 | Séparer contenu et activité cognitive ; analyser, relier des représentations, généraliser et justifier | Métadonnées transversales, familles « même/différent », changement de représentation et justification |
| PISA 2022 | Cycle formuler → employer → interpréter/évaluer ; juger les limites de ce que les données permettent d’affirmer | Calcul vers situation, information manquante, modèle à critiquer, résultat à réinterpréter |
| NCETM, Angleterre | Pensée mathématique dans toutes les leçons ; information retenue, comparaison de solutions, variation et structure | Questions à donnée cachée, comparaison de programmes, exemples/non-exemples |
| NRICH, Cambridge | Explorer systématiquement, rendre les conjectures publiques, les tester et les modifier ; « Convaincs-moi », « même/différent », réparer un énoncé | Parcours Chercher et Convaincre, intrus non unique, construction sous contraintes, affirmation à réparer |
| Ontario | Processus mathématiques : résoudre, raisonner/prouver, représenter, réfléchir, choisir des outils, relier et communiquer | Réglage par intention pédagogique plutôt que par chapitre isolé |
| Australie, curriculum V9 | Analyser, expérimenter, expliquer, inférer, justifier, généraliser, transférer | Verbes d’action visibles et progression de difficulté |
| États-Unis, Standards for Mathematical Practice | Construire des arguments, critiquer ceux d’autrui, préciser, chercher structure et régularité | Première erreur, argument suffisant, invariant, régularité |
| EEF, Royaume-Uni | Enseigner explicitement planification, suivi et évaluation, dans les disciplines et sur des tâches réelles | « Réflexe à retenir », indice minimal, question métacognitive de correction |

Le constat commun est que le raisonnement n’est pas seulement une difficulté supérieure. TIMSS prévoit des tâches de raisonnement à différents niveaux et PISA construit parfois une unité progressive : effectuer un calcul simple, prolonger une structure, puis évaluer une affirmation générale. Le générateur adopte cette montée en puissance au lieu de réserver le raisonnement aux seules démonstrations longues.

## Choix didactiques

### Une question a quatre couches

Chaque instance contient :

- un **contenu mathématique** conforme au niveau ;
- un **geste de raisonnement** clairement identifié ;
- une **preuve ou justification courte**, pas seulement la réponse ;
- un **réflexe transférable** à verbaliser.

### Les formats de questions

Le prototype mélange :

- questions ouvertes avec exemple, contre-exemple ou phrase à produire ;
- choix argumentés ;
- affirmations toujours/parfois/jamais ;
- preuves en désordre ;
- raisonnements d’élèves à diagnostiquer ;
- informations utiles/inutiles ;
- comparaison de stratégies ;
- modélisation et interprétation.

Les cartes de choix ne servent pas à noter automatiquement l’élève. Elles organisent le débat au tableau. Avant d’afficher la correction, le professeur demande une justification, un exemple, un schéma ou une objection.

### Une progression de la preuve

1. **Repérer** : vrai/faux, donnée utile, conclusion plausible.
2. **Expliquer** : citer une définition ou une propriété, produire un exemple.
3. **Justifier** : enchainer deux ou trois arguments.
4. **Prouver ou réfuter** : raisonner sur tous les cas, produire un contre-exemple, utiliser une contraposée.

## Contenu de la V0.2

La banque contient **64 familles paramétrées**. Chaque famille produit de nombreuses instances en faisant varier nombres, contextes, ordre des propositions ou type d’affirmation.

| Domaine | Familles |
|---|---:|
| Nombres et calculs | 11 |
| Algèbre et motifs | 9 |
| Espace et géométrie | 12 |
| Données et hasard | 9 |
| Proportionnalité et fonctions | 9 |
| Pensée informatique | 5 |
| Problèmes et stratégies | 9 |

Les 9 gestes restent filtrables dans un réglage fin facultatif : observer, conjecturer, tester/réfuter, justifier/prouver, critiquer/corriger, choisir une stratégie, enchainer/déduire, modéliser/interpréter et planifier/vérifier. La répartition privilégie volontairement le diagnostic d’argument et le choix de stratégie, deux gestes moins présents dans les générateurs d’exercices ordinaires.

| Niveau sélectionné | Familles éligibles, acquis antérieurs compris |
|---|---:|
| 6e | 28 |
| 5e | 48 |
| 4e | 58 |
| 3e | 64 |

Les trois degrés d’exigence comprennent 11 familles de repérage, 32 de justification et 21 de preuve ou de raisonnement plus soutenu.

Les douze familles ajoutées dans la V0.2 introduisent notamment : intrus à plusieurs réponses défendables, « même ou différent ? », création d’exemples sous contraintes, affirmation à réparer, information volontairement cachée, passage du calcul à la situation, comparaison de programmes, conclusion non soutenue par les données et argument destiné à une personne sceptique.

## Protocole de classe proposé

1. L’enseignant compose une série de 5, 10, 15 ou 20 questions.
2. Chaque question est d’abord traitée oralement, sur ardoise ou dans le cahier ; cliquer sur une proposition n’est ni nécessaire ni enregistré.
3. L’indice reste facultatif et donne une direction, jamais la réponse entière.
4. La correction distingue la réponse, la justification et le **réflexe transférable**.
5. Avant de passer à la suite, un élève reformule le réflexe ou indique dans quel autre problème il pourrait servir.

Au clavier : flèches ou Entrée pour avancer, flèche gauche pour revenir, `I` ou `H` pour l’indice, `F` pour le plein écran, `Échap` pour les réglages.

## Compatibilité préparée avec Automatismes

L’audit de la V1.15 d’Automatismes a conduit aux choix suivants :

- identifiants permanents et versionnés pour chaque famille ;
- banque éditoriale séparée de l’interface et du moteur de tirage ;
- métadonnées stables `levels`, `domain`, `gesture`, `difficulty` ;
- tirage équilibré entre domaines, gestes et exigences, avec une graine interne ; les parcours imposent en plus un ordre cognitif sans imposer un chapitre ;
- même logique de série 5/10/15/20, diaporama question/correction, plein écran et retour unique ;
- rendu autonome, hors ligne, adapté au TNI et au téléphone.

Lors de l’intégration, la banque pourra devenir un groupe de modules du registre permanent `MATHSGO_MODULE_REGISTRY`. Le geste de raisonnement pourra être ajouté comme filtre transversal sans casser le filtre actuel par domaine. La graine, les identifiants d’instance et le niveau sont déjà disponibles pour un futur partage de série.

## Validation technique de cette livraison

- contrôle de syntaxe des deux scripts ;
- génération répétée de chaque famille sur 1 000 graines, avec contrôle des champs obligatoires, réponses, indices de correction, doublons de propositions et ordres de preuve ;
- test fonctionnel de la version monofichier : réglages, génération, indice, correction, navigation et retour ;
- contrôle visuel réel en 1 440 × 1 000 et 390 × 844 : démarrage en un écran sur téléphone, absence de débordement horizontal et barre de commande stable lors de l’affichage de la correction ;
- contrôle des 28, 48, 58 et 64 familles accessibles aux niveaux 6e, 5e, 4e et 3e ;
- aucune ressource externe nécessaire : la version autonome fonctionne hors ligne.

### Feuille de route d’intégration

1. Tester la durée et les formulations sur quelques classes de 6e, 5e et 3e.
2. Marquer les familles « validées », « à reformuler » ou « à déplacer de niveau ».
3. Convertir les familles retenues au contrat de module d’Automatismes.
4. Intégrer les cinq parcours et expérimenter une option de série mixte calcul/raisonnement.
5. Conserver le mode sans notation automatique ; si des traces sont ajoutées, enregistrer la stratégie ou le degré de certitude plutôt qu’un simple clic juste/faux.

## Architecture technique

- `index.html` : interface et diaporama ;
- `styles.css` : rendu TNI, ordinateur, téléphone et plein écran ;
- `reasoning-banks.js` : banque indépendante et paramétrée ;
- `app.js` : filtres, tirage équilibré, graine et navigation ;
- `raisonnement-mathsgo-autonome.html` : version monofichier construite à partir des sources.

La banque expose `window.MATHSGO_REASONING_BANKS` avec un petit contrat stable :

```js
{
  schemaVersion: 1,
  generatorVersion: "0.2.0",
  templates: [{
    id, version, levels, domain, gesture, difficulty,
    generate(context)
  }]
}
```

Chaque question générée possède un identifiant de modèle, un niveau, un domaine, un geste, une difficulté, un énoncé, une aide, une correction, une justification et un réflexe. Cette séparation permettra d’importer les banques dans la future version découpée d’Automatismes sans reprendre le contenu éditorial.

## Limites assumées du prototype

- Un automatisme de raisonnement ne remplace ni une recherche longue, ni une démonstration complète, ni un problème ouvert. Il prépare les gestes nécessaires à ces tâches.
- Une réponse choisie n’atteste pas à elle seule que l’élève sait raisonner. La verbalisation et la justification restent indispensables.
- Les banques constituent une V0 solide et large, pas encore un référentiel exhaustif question par question. Une phase de classe devra repérer les formulations trop faciles, trop longues ou ambiguës.
- L’intégration future devra reprendre le registre permanent des modules, le partage de séries et la collecte éventuelle des tentatives du protocole Automatismes.

## Sources principales

- France, programme de mathématiques du cycle 3 (2025) : https://www.education.gouv.fr/sites/default/files/programme-de-math-matiques-pour-le-cycle-3-439827.pdf
- France, programme de mathématiques du cycle 4 (2026) : https://www.education.gouv.fr/sites/default/files/document/Annexe%202%20%E2%80%93%20Programme%20de%20math%C3%A9matiques%20pour%20le%20cycle%204-480716.pdf
- Angleterre, National Curriculum, Mathematics Key Stage 3 : https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study
- Angleterre, guidance KS3 : https://www.gov.uk/government/publications/teaching-mathematics-at-key-stage-3
- Singapour, Secondary Mathematics Syllabuses 2020 : https://www.moe.gov.sg/media/files/secondary/syllabuses/maths/2020-express_na-maths_syllabuses.pdf
- TIMSS 2023, Mathematics Assessment Framework : https://timssandpirls.bc.edu/timss2023/frameworks/pdf/T23_Frameworks.pdf
- OCDE, PISA 2022 Mathematics Framework : https://pisa2022-maths.oecd.org/ca/index.html
- OCDE, items de mathématiques PISA 2022 rendus publics : https://www.oecd.org/en/publications/pisa-2022-results-volume-i_53f23881-en/full-report/released-items-from-the-pisa-2022-computer-based-mathematics-assessment_1983f907.html
- NCETM, Mathematical Thinking au secondaire : https://www.ncetm.org.uk/features/the-five-big-ideas-at-secondary-mathematical-thinking/
- NRICH, questions et amorces de pensée mathématique : https://nrich.maths.org/articles/working-effectively-all-learners
- Ontario, processus mathématiques : https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-mathematics/context/the-mathematical-processes
- Australie, Mathematics V9 : https://www.australiancurriculum.edu.au/curriculum-information/understand-this-learning-area/mathematics
- États-Unis, Standards for Mathematical Practice : https://thecorestandards.org/Math/Practice/
- NRICH, Always, Sometimes or Never? : https://nrich.maths.org/problems/always-sometimes-or-never-number
- EEF, Metacognition and Self-Regulated Learning : https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition
