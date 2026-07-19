# Journal des décisions — Automatismes V2

Les décisions sont datées et ne sont jamais réécrites silencieusement. Une
nouvelle décision peut en remplacer une ancienne en indiquant son identifiant.

## 18 juillet 2026

### D-001 — L'ancienne banque est un inventaire

La banque DocTools et la bêta peuvent indiquer les notions et familles de
situations à couvrir. Elles ne fournissent aucun énoncé, algorithme, paramètre,
valeur, distracteur, SVG ou `formula_code` à V2.

### D-002 — La parité des questions est abandonnée

La couverture est évaluée par les notions du programme, jamais par les
empreintes, formulations ou réponses de la bêta.

### D-003 — La bêta est gelée

La bêta ne reçoit plus de développement pédagogique ou d'interface. Seules les
corrections critiques sont autorisées dans un chantier séparé.

### D-004 — Reconstruction notion par notion

Le travail avance catégorie par catégorie et notion par notion. La fiche
pédagogique validée précède toujours le générateur réel.

### D-005 — Responsabilité pédagogique

Gwenaël valide tout contenu pédagogique. Le chef de projet prend les décisions
techniques et organise le travail sans lui déléguer des choix d'architecture.

### D-006 — Saisie de la réponse

L'élève saisit sa réponse. Seul le choix de diviseurs peut être proposé au clic
sans nouvelle décision. Aucun contrat générique de manipulation comme réponse
n'est construit par anticipation.

### D-007 — Avancement et provenance sont séparés

L'avancement utilise `a_faire`, `construit`, `valide`. La provenance utilise
`original_mathsgo`, `reconstruit`, `herite_doctools`, `a_auditer`.

### D-008 — Les acquis ne déterminent pas l'interface

Les objets visuels indépendants, les données officielles, le PRNG et les
fondations génériques adaptées sont réutilisés. L'interface, les couleurs et
l'organisation de la bêta seront redécidées pour V2.

### D-009 — Pas de GeoGebra par défaut

GeoGebra n'entre pas dans Automatismes V2 sans demande explicite.

### D-010 — GitHub porte la mémoire durable

Les règles, décisions, fiches et état du chantier sont versionnés dans le
dépôt. Une mémoire conversationnelle peut aider, mais ne fait jamais autorité.

### D-011 — Aucun nom ou découpage hérité dans V2

V2 ne reprend ni les noms `dnb_*`, ni les dossiers, ni le découpage des 43
modules, ni leurs identifiants. Sa nomenclature est créée depuis les sept
domaines de maths&go, les notions du programme officiel et les choix validés
par Gwenaël. Les noms historiques ne subsistent que dans l'application
ancienne, les inventaires et les audits. Le terme officiel « DNB » reste
utilisable pour parler de l'examen ou d'un parcours de préparation au brevet.

### D-012 — L'existant technique n'est pas une contrainte

Le chef de projet choisit librement de conserver, corriger ou remplacer chaque
brique existante selon l'intérêt de maths&go. Une brique n'est jamais gardée
seulement parce qu'elle existe déjà. La compatibilité avec DocTools, son moteur
ou son organisation n'est pas un objectif.

## 19 juillet 2026

### D-013 — Le périmètre immédiat est exclusivement le DNB

Automatismes V2 se construit d'abord pour le DNB, et pour rien d'autre. La
**liste officielle des attendus du DNB** est la source de couverture de cette
phase : c'est elle qui dit ce qui doit exister et quand la phase est terminée.
D-002 n'est pas abandonnée — la couverture se mesure toujours en notions et
jamais en parité avec les anciennes questions — elle est restreinte au DNB
tant que cette phase dure. Ce qui ne relève pas du DNB attend son tour.

Le rôle d'inventaire de l'ancienne banque (D-001) est précisé : elle reste une
**archive consultable notion par notion**. On l'ouvre pour une notion précise,
au moment où on la traite, afin d'y retrouver ce que Gwenaël y a lui-même
apporté — questions retravaillées, aides, choix de progression. On ne l'ouvre
jamais pour y puiser un énoncé, un paramètre, un distracteur, un visuel ou du
code : D-001 tient entièrement.

**Aucun élément ancien n'entre automatiquement dans V2.** Cela vaut aussi pour
une contribution de Gwenaël retrouvée dans l'archive : il lui faut une
provenance identifiée (D-007) et sa validation explicite avant d'entrer.
Retrouver quelque chose ne vaut pas décider de le reprendre.
