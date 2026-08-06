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

### D-014 — La carte DNB commande la fabrication

La carte DNB versionnée dans le dépôt compte 37 cibles officielles distinctes,
38 cibles normalisées et 88 micro-notions. Elle fixe la couverture et l'ordre
de fabrication. `NC-01`, critères de divisibilité, est la seule micro-notion
active.

### D-015 — Aucun niveau ni palier dans le parcours DNB actuel

Les micro-notions sont des unités de fabrication et de suivi, pas des niveaux
proposés aux élèves. La variété vient des familles de questions, des valeurs,
des erreurs travaillées et de l'état de l'aide. Les niveaux éventuels attendent
la future phase couvrant l'ensemble du collège.

### D-016 — NC-01 inclut 10 et commence par la sélection de diviseurs

`NC-01` travaille les critères par 2, 3, 5, 9 et 10. Les quatre premiers
relèvent de la cible officielle DNB ; 10 est un complément maths&go validé,
présent sans filtre supplémentaire dans ce parcours. La notion comporte six
familles validées. La première tranche technique est `F2`, sélection de tous
les diviseurs proposés avec « Aucun » exclusif et comparaison de l'ensemble
exact.

### D-017 — L'aide guide sans répondre

L'aide possède trois états : `ouverte`, `disponible` et `indisponible`. Elle
peut faire observer le chiffre des unités ou construire la somme des chiffres,
mais ne calcule ni ne conclut à la place de l'élève. Le cours peut montrer la
méthode complète ; la correction explique chaque critère.

### D-018 — Un contenu alimente l'interactif et la projection

Une question instanciée porte le contenu mathématique, l'aide et la correction,
sans coordonnée d'écran. Le lecteur choisit la présentation téléphone,
tablette, ordinateur, TNI ou projection. Une saisie numérique utilise le clavier
maths&go ; le clavier système mobile ne s'ouvre pas. Une fraction utilisera deux
champs distincts et une barre construite par le lecteur, mais ce contrat attend
la micro-notion concernée.

### D-020 — GE-12 reste simple et utilise un choix unique

Gwenaël valide la fiche `GE-12` le 19 juillet 2026 avec une exigence REP+ : la
première tranche demande seulement de reconnaître les six solides du DNB dans
une figure claire. Le « nom le plus précis », le comptage des faces, arêtes ou
sommets et les autres extensions collège attendent une phase ultérieure.

Le choix unique parmi quatre noms devient la deuxième exception à D-006. Les
distracteurs sont diagnostiques et ne doivent jamais être des noms plus
généraux qui rendraient plusieurs réponses mathématiquement défendables.

### D-021 — La rotation aide à observer, elle n'est pas la tâche

Le modèle 3D maths&go est la source unique des solides de GE-12. La question
ordinaire conserve une vue fixe choisie pour être lisible. Dans l'aide et le
mini-cours, le solide peut tourner au doigt ; deux boutons accessibles offrent
la même action. La visibilité des arêtes est recalculée après chaque rotation.

### D-019 — Séance, question et trace sont séparées

La configuration de séance, la question instanciée et la trace de réponse sont
trois ensembles distincts. La première version ne collecte aucune identité,
aucune durée et n'envoie rien à un serveur. La trace est néanmoins conçue pour
être transmissible plus tard sans changer le contenu mathématique.

### D-022 — Trois tranches DNB distinctes pour les volumes

Les volumes sont répartis entre `PG-22` (cube et pavé), `PG-23` (prisme droit)
et `PG-24` (cylindre). Une séance n'active qu'une tranche. Les conversions,
les capacités, les pyramides et les cônes restent dans leurs notions propres.

### D-023 — Calcul mental et approximation explicite

Les dimensions sont choisies dans des corpus contrôlés pour permettre un
calcul mental sans calculatrice. Pour le cylindre, une réponse est soit exacte
et contient π, soit approchée avec π ≈ 3 ; dans ce second cas, « environ » est
écrit dans la consigne, la réponse et la correction.

## 20 juillet 2026

### D-024 — Un registre unique relie une notion au lecteur

Chaque notion exposée par le lecteur déclare dans un registre unique son
identifiant, son nom, son gabarit, son type de rendu et ses capacités
d'interaction. Le moteur d'état ne connaît plus directement les générateurs et
l'interface ne maintient plus une seconde liste d'identifiants.

Les rendus spécialisés restent autorisés : une notion peut demander un visuel,
une aide ou une correction propres. Ils sont sélectionnés par un type de rendu
explicite, jamais par un branchement implicite vers une notion par défaut. Une
interaction réservée aux chiffres ou aux solides est bloquée pour les autres
familles. Cette architecture précède toute nouvelle micro-notion et ne modifie
pas le contenu pédagogique déjà validé.

## 5 août 2026

### D-025 — Une trame pédagogique commune, adaptée à chaque notion

Les nouvelles notions suivent « Je montre → Nous faisons → Tu fais accompagné
→ Tu fais seul → correction immédiate puis réactivation ». Le cours montre la
méthode, « Me guider » oriente sans répondre et la correction explique. Une
manipulation n'est construite que lorsqu'elle apporte un sens mathématique
identifiable ; elle n'est jamais ajoutée pour remplir une case d'interface.

Le gabarit versionné `gabarit-fiche-pedagogique.md` rend cette trame obligatoire
à la conception, sans imposer les six familles particulières de NC-01 aux
autres notions.

### D-026 — Deux contextes visibles : S'entraîner et Au tableau

Le lanceur V2 expose uniquement **S'entraîner** et **Au tableau**. Les libellés
historiques « Interactif » et « Diaporama » ne sont plus des produits visibles.
Le principe de D-018 reste acquis : une même question structurée alimente les
deux contextes et le lecteur choisit sa présentation.

En entraînement, l'aide est accessible pendant la série. Le futur mode examen,
le chronomètre, le partage par code et la collecte de résultats restent hors du
périmètre actuel et n'apparaissent pas dans le menu.

### D-027 — Le lanceur V2 reprend la coque validée de `/auto/`

Le menu V2 reprend la coque visuelle minimaliste actuellement publiée sur
`/auto/` : en-tête, cartes numérotées, contrôles segmentés, domaines repliables,
icônes et barre basse orange. Il ne reprend ni le moteur V1, ni MG1, ni son
catalogue, ni ses crédits.

Le catalogue V2 possède six domaines :

1. Nombres et calculs ;
2. Calcul littéral et algèbre ;
3. Proportionnalité, fonctions et grandeurs ;
4. Espace et géométrie ;
5. Données, statistiques et probabilités ;
6. Pensée informatique.

Seuls les domaines contenant au moins une notion V2 explicitement ouverte à
l'essai sont affichés. Au 5 août, seul **Nombres et calculs**, avec NC-01, est
visible. Les autres domaines et leurs futures icônes restent absents tant
qu'ils sont vides.

## 6 août 2026

### D-028 — Le contexte DNB sans calculatrice reste visible

Le lanceur V2 affiche en permanence la calculatrice barrée de la coque validée,
à gauche du bouton de lancement. Ce repère n'est ni un réglage ni un mode : la
phase V2 actuelle est entièrement consacrée à l'épreuve DNB sans calculatrice.
Il reste donc visible dans **S'entraîner** comme dans **Au tableau**, y compris
sur téléphone, avec un libellé accessible explicite.

### D-029 — NC-01 conserve cinq familles actives et reste simple

Cette décision remplace la partie de D-016 qui annonçait six familles actives.
`F4`, fondée sur des phrases, du vrai/faux et des justifications, est retirée de
la série standard : elle ajoutait surtout de la lecture et du vocabulaire
logique à l'automatisme central. Les identifiants ne sont pas renumérotés ; les
familles actives sont `F1`, `F2`, `F3`, `F5` et `F6`.

Les quotas pour 5, 10, 15 et 20 questions sont respectivement
`1/2/1/0/1`, `2/3/2/1/2`, `3/4/3/2/3` et `4/5/4/3/4` dans cet ordre de
familles. Le cas « Aucun » appartient toujours aux sélections, mais il apparaît
naturellement : aucune série n'est artificiellement obligée de le contenir.

Lorsque la série contient au moins deux situations F6, une question Oui/Non de
partage est garantie et les autres alternent entre choix des groupes possibles
et retrait minimal. Avec une seule F6, les trois sous-formes restent possibles.

### D-030 — Le départ, le cours, l'aide et le bilan de NC-01 sont allégés

L'écran prêt montre seulement le contexte brevet, le titre, la notion, le
nombre de questions, « Voir le cours » et « Commencer ». Il ne répète plus les
règles de divisibilité.

Le cours possède trois pages : reste nul ; chiffre des unités pour 2, 5 et 10 ;
somme de tous les chiffres pour 3 et 9. La page d'implications disparaît, les
règles complètes précèdent les exemples et toutes les pièces des schémas en
barres sont rectangulaires.

L'aide F2 comporte deux étapes autonomes. Chaque clic conserve le défilement et
le focus sans saut ; la somme n'est affichée qu'après la sélection de tous les
chiffres. Sur ordinateur avec souris et clavier, le pavé interne est masqué et
le clavier physique est utilisé. Il reste affiché sur les appareils tactiles,
y compris les hybrides et TNI.

Le bilan propose au maximum trois actions : générer une **Nouvelle série** avec
les mêmes critères, **Refaire la même série**, ou **Choisir une autre série**.

### D-031 — GitHub est la source et Sites est l'aperçu avant publication

La branche de la PR #278 reste la source durable de la candidate. Le site
ChatGPT ne contient qu'un miroir d'essai vérifié de ce commit. Chaque révision
est d'abord enregistrée et testée sur la PR, puis montrée à Gwenaël sur le site
d'essai.

Après validation explicite seulement, la PR peut être fusionnée. GitHub Pages
publie alors la route existante `/automatismes-v2/`, laissée hors de la
navigation et du plan du site avec `noindex,nofollow` pendant le pilote.
`/auto/` reste indépendant et doit être vérifié après chaque publication. Un
lien non référencé n'étant pas un contrôle d'accès, le site ChatGPT reste le
support approprié lorsqu'une vraie confidentialité est nécessaire.

### D-032 — Les dernières finitions de NC-01 réduisent la charge visuelle

La famille F3 propose quatre nombres au lieu de six. Cette réduction conserve
la variété et le cas naturel « Aucun », mais évite de demander jusqu'à six
sommes de chiffres dans une seule question.

Les questions Oui/Non n'ajoutent plus la consigne redondante « Choisis Oui ou
Non ». Le bouton « Valider » reste séparé des réponses pour prévenir les appuis
accidentels et garder le même geste dans toutes les familles à choix.

Sur ordinateur avec clavier et souris, l'élève utilise le clavier physique. Sur
téléphone, tablette, appareil hybride ou TNI tactile, le pavé maths&go est placé
dans un bandeau sous la carte et au-dessus des actions : il n'agrandit plus la
carte de question et le clavier système mobile ne s'ouvre pas.

Dans le cours et la correction, le chiffre des unités et chaque chiffre utilisé
pour une somme sont encadrés et centrés. Les égalités des deux partages sont
placées sous le schéma correspondant, avec une conclusion explicite reliée à la
valeur du reste.

### D-033 — Le moule commun et F6 sont stabilisés avant NC-02

Cette décision remplace le dernier paragraphe de D-029. F6 ne conserve que deux
sous-formes : répondre Oui/Non pour un nombre de groupes donné et trouver le
retrait minimal lorsque le partage n'est pas exact. La sélection de tous les
nombres de groupes possibles est supprimée : elle mélangeait deux tâches dans
une même question. Lorsque deux F6 figurent dans une série, les deux sous-formes
sont représentées ; avec une seule F6, la forme Oui/Non est retenue.

Le lecteur commun possède désormais trois zones : un en-tête stable, un contenu
central défilable et un pied de commandes stable. Les panneaux de cours, d'aide
et de correction utilisent la même coque avec en-tête et navigation toujours
accessibles. Le contenu d'une future notion ne redéfinit donc ni les dimensions
de l'écran, ni la place des commandes.

Sur écran tactile, le pavé maths&go utilise des profils contextuels et place
« Valider » dans sa dernière rangée. Le profil de NC-01 n'affiche que les
chiffres et « Effacer » ; les profils futurs prévoient notamment la virgule et
le signe moins sans les montrer lorsqu'ils sont inutiles. Sur ordinateur étroit
muni d'un clavier et d'une souris, le pavé reste masqué. « Aide » demeure dans
l'en-tête et toutes les cibles tactiles utiles mesurent au moins 44 pixels.

### D-034 — La couverture, le menu et la fabrication ont des granularités distinctes

La liste officielle, les catégories visibles, les micro-notions internes et les
familles de questions ne sont pas le même niveau de découpage. Les 37 lignes
officielles servent à prouver la couverture ; les 88 micro-notions servent à
fabriquer, tester et suivre des générateurs précis ; elles ne deviendront pas
88 entrées de menu.

Une catégorie visible peut regrouper plusieurs micro-notions proches et proposer
une série mélangée, tout en conservant des filtres plus fins. En particulier,
`NC-03` et `NC-04` restent deux unités internes pour distinguer les deux sens de
conversion, mais appartiendront à une même catégorie visible « Fractions
simples et décimaux ». Les familles directes et inverses de `NC-02` restent,
elles, dans une seule micro-notion.
