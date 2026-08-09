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

### D-035 — Le guidage et les repères du moule NC-01 sont uniformisés

Le cours nomme explicitement ses trois pages. Les pages de critères portent
« Critères pour 2, 5 et 10 » puis « Critères pour 3 et 9 ». Le chiffre des
unités conserve la même forme encadrée dans le cours, « Me guider » et la
correction ; tous les chiffres d'un nombre, y compris ceux qui ne sont pas
encadrés, gardent la même taille.

« Me guider » rappelle toujours le critère complet utile. Il n'oblige donc pas
l'élève à ouvrir le cours et ne crée aucun niveau d'aide supplémentaire. Pour
une question portant sur un seul nombre et sur 3 ou 9, le même geste produit
toujours le même résultat : l'élève sélectionne tous les chiffres et le total
de la somme n'apparaît qu'au dernier appui. Lorsqu'aucune manipulation n'aide à
comprendre la tâche, notamment pour quatre nombres ou un chiffre manquant, le
calcul reste à effectuer par l'élève. Le clic décoratif sur le chiffre des
unités est supprimé : l'unité utile est encadrée dès l'ouverture de l'aide.
Les textes des corrections complètes restent inchangés.

Dans l'en-tête, « Aide » reste à sa place fixe mais devient plus visible. Le
score est centré et séparé de la position dans la série. Une réponse numérique
unique à un chiffre manquant apparaît directement dans la case de l'énoncé ;
la case reste vide lorsque plusieurs chiffres doivent être sélectionnés. Les
boutons Oui/Non sont centrés.

Le bouton « Valider » conserve exactement sa taille sur téléphone. Il est
seulement limité en largeur sur ordinateur. Le pavé interne dépend désormais
du pointeur principal : il apparaît sur un appareil utilisé principalement au
toucher et reste masqué sur un ordinateur dont l'interaction principale est la
souris, même si son écran est aussi tactile. Cette règle remplace, pour le
moule courant, les mentions plus larges des décisions D-030 à D-033 sur tous
les appareils hybrides et TNI.

### D-036 — NC-02 garde le rappel au centre et partage ses objets

`NC-02` réunit dans une seule micro-notion le calcul direct des carrés de 1 à
12 et la recherche inverse de l'entier positif. Six familles sont actives :
calcul direct, sens inverse, sens de la notation, reconnaissance, carré
quadrillé et calcul court de la forme carré puis `+ k` ou `- k`. Les deux
premières représentent 65 % d'une série de 20 ; les calculs courts restent
limités à 10 % et n'introduisent ni parenthèses au carré ni règles générales
sur les puissances.

Le cours comporte quatre pages : comprendre le carré, connaître les douze
faits, aller dans les deux sens, puis calculer le carré avant une seconde
opération. « Me guider » conserve un seul panneau avec des étapes ordonnées,
comme NC-01. Le carré quadrillé intervient dans le cours, l'aide et la famille
de sens ; il ne transforme pas chaque question en comptage de cellules.

L'écriture `49 = □ × □` possède deux champs réellement indépendants, tous deux
obligatoires et sans validation partielle. Toute puissance est une donnée
structurée rendue par un composant HTML commun avec un véritable élément
`sup`. Un objet SVG commun rend les carrés de 1 à 12. Aucun générateur ni SVG
ne fabrique localement un exposant, et aucun code, paramètre, énoncé,
distracteur ou dessin de l'ancienne banque n'est repris.

L'homogénéité de la coque, des panneaux, des commandes, des réponses après
validation, des cibles tactiles et des profils de clavier devient un invariant
documenté du parcours. Elle s'applique aux notions suivantes sans devoir être
redemandée à chaque fabrication.

### D-037 — La revue doit montrer tout le candidat et tester ses objets de l'intérieur

Une validation pédagogique ne peut pas reposer sur quelques captures dites
« représentatives ». Pour chaque nouvelle notion, le candidat est fourni sous
la forme d'un parcours navigable déterministe couvrant toutes ses sous-formes.
Il est accompagné d'un inventaire visuel des pages de cours, des formulations
de questions, des aides et des corrections. Les captures téléphone,
ordinateur, TNI et zoom restent des tests de stress supplémentaires ; elles ne
remplacent pas cet inventaire complet.

La recette vérifie aussi l'intérieur des objets communs. L'absence de barre de
défilement dans la page ne suffit pas : texte, quadrillage, étiquettes et
contours d'un SVG doivent garder des marges mesurables entre eux. Dans le carré
de NC-02, les deux côtés affichent seulement leur nombre ; la phrase voisine
porte les mots « rangées », « colonnes » et « carreaux ». Le total central est
posé sur deux lignes avec un fond léger. Ce choix évite à la fois le
débordement et une accumulation de texte dans le schéma.

NC-02 emploie « nombre carré » et « carré parfait » comme synonymes. Deux
sous-formes rares restent à l'intérieur de F1 : un QCM « Quel est le carré de
n ? » et un encadrement entre des multiples de 10. Elles remplacent des
questions directes dans la série ; elles ne créent ni famille ni longueur
supplémentaire. Leurs distracteurs, comme ceux de F3 et F4, représentent des
erreurs plausibles et contrôlées. Les deux F5 d'une série de 20 utilisent des
côtés différents. Les carreaux restent sans unité métrique : introduire `cm²`
ajouterait une autre micro-notion.

## 7 août 2026

### D-038 — NC-02 s'étend à 0–12 sans modifier son moule commun

Cette décision remplace dans D-036 les bornes de la notion, le nombre de pages
du cours et le périmètre de l'objet carré ; le reste de D-036 demeure acquis.

La cible officielle DNB reste « carrés des entiers de 1 à 12 ». Le nouveau
programme du cycle 4 demande les carrés des entiers de 0 à 12 : NC-02 ajoute
donc `0` comme complément maths&go explicite. Le nom visible devient « Carrés
des entiers de 0 à 12 », mais l'identifiant technique stable
`carres-entiers-1-a-12` et la ligne `DNB26-08` ne sont pas renommés.

Le fait `0` au carré entre dans le cours, le rappel direct et inverse, le sens
de la notation et la reconnaissance des carrés parfaits. Une série de 20
couvre exactement une fois les treize bases de 0 à 12 dans les treize rappels
F1 et F2. Aucun carré quadrillé `0 × 0` n'est dessiné : F5 conserve les côtés
de 2 à 12 et l'égalité numérique suffit pour le zéro.

Le cours passe de quatre à cinq pages : comprendre le carré ; écrire en entier
les treize égalités de `0` au carré à `12` au carré ; reconstruire 11 et 12 par
un dessin en bandes `10 + 1` et `10 + 2` raccordé aux produits partiels ; aller
dans les deux sens ; rédiger un calcul court. La dernière page montre une
égalité enchaînée — le carré est remplacé par sa valeur, puis l'addition ou la
soustraction est effectuée sur la ligne suivante — et non une liste d'étapes
numérotées.

Les distracteurs du QCM direct et de l'encadrement représentent des erreurs
diagnostiques. L'encadrement est réservé aux bases 5 à 12 et peut notamment
opposer, pour `12` au carré, l'encadrement de `12 × 2 = 24`, celui d'un carré
ou d'un produit voisin et l'encadrement correct entre 140 et 150. Les questions
de sélection stabilisent le terme « carrés parfaits », défini dans le cours
comme synonyme de « nombres carrés ».

Un champ de réponse inactif possède un seul contour turquoise ; le champ actif
remplace ce contour par un seul contour orange, sans second cadre tactile. Le
pavé maths&go commun, ses douze touches, leurs dimensions d'au moins 44 pixels,
le dock et son comportement restent strictement inchangés. Sur une petite
hauteur, seules les questions numériques de NC-02 compactent localement leurs
marges, leurs espacements et, si nécessaire, leur dessin. La zone centrale
reste défilable. Cette exception locale ne modifie ni NC-01, ni les autres
notions, ni le fonctionnement partagé du clavier.

### D-039 — Une séance peut mélanger un nombre quelconque d'automatismes

Gwenaël valide le 7 août 2026 la sélection multiple générique et demande sa
publication avant la fabrication de NC-03. Cette décision concrétise D-034 :
les cases du menu deviennent réellement indépendantes et aucun troisième mode
« Mélange » n'est créé. Une seule notion produit toujours un entraînement
ciblé ; plusieurs notions produisent une révision mélangée.

Le nombre choisi reste le total de la séance. Pour `N` notions et `Q`
questions, chaque notion reçoit `⌊Q / N⌋` questions, puis les `Q mod N`
questions restantes sont attribuées de façon seedée. L'écart entre deux quotas
ne dépasse donc jamais une question. Chaque notion est représentée dès que
`Q ≥ N` ; une longueur plus courte que le nombre de notions est indisponible
dans le menu et la première longueur suffisante est proposée sans effacer la
sélection.

Chaque générateur conserve sa recette et l'ordre de sa sous-série. Le moteur
commun ne remélange pas les questions à l'intérieur d'une notion : il
intercale les files obtenues dans un ordre déterministe, sans deux notions
identiques voisines lorsque plusieurs notions sont sélectionnées. « Refaire la
même série » conserve répartition, questions et ordre ; « Nouvelle série »
change la graine, donc le mélange.

Le résumé emploie le pluriel et annonce la répartition. Avant le départ,
« Voir les cours » propose la liste des cours sélectionnés. Pendant la séance,
le nom, le rendu, l'aide, le cours, la correction, le clavier et les capacités
d'interaction sont toujours résolus depuis la notion de la question courante.
Le bilan conserve la liste complète.

Les URL historiques `?notion=...` restent valides et plusieurs paramètres
`notion` peuvent décrire une sélection. Les quatre recettes isolées validées de
NC-02 pour 5, 10, 15 et 20 questions restent identiques ; des préfixes de 1 à
20 questions sont ajoutés uniquement afin de fournir ses sous-séries dans un
mélange, notamment les répartitions `3 + 2`, `8 + 7` ou `7 + 7 + 6`.

## 8 août 2026

### D-040 — La finition auditée fixe les règles publiques de NC-01 et NC-02

Gwenaël valide les corrections issues de la recette et autorise leur
publication. Le lecteur public accepte durablement de 1 à 20 questions. Une
valeur d'URL inférieure à 1 ou supérieure à 20 est ignorée au profit des 10
questions par défaut, afin qu'une URL comme `questions=30` reste démarrable.
Cette borne appartient au lecteur : les contrats et générateurs génériques
internes conservent leur capacité de 1 à 100.

Dans `NC-01/F5`, « Trouve le plus petit chiffre » est réservé au critère par 3,
seul critère du périmètre qui rend cette sous-forme utile sans rendre la réponse
presque toujours prévisible. La forme à réponse unique reste compatible avec 9
et 10 ; le cas par 10 dont la réponse est `0` est explicitement conservé. La
forme « sélectionne tous » reste disponible pour 2, 3, 5, 9 et 10. Le plan
seedé attribue d'abord les critères compatibles aux sous-formes contraintes,
puis équilibre le reste sans changer les quotas ni la distribution aléatoire
des familles.

Dans `NC-02/F1`, aucun distracteur d'encadrement ne peut contenir le carré
cherché, y compris lorsque celui-ci est égal à une borne. `NC-02/F4` alterne
exactement « Sélectionne tous les nombres carrés. » et « Parmi ces nombres,
lesquels sont des carrés parfaits ? ». La phrase « compris entre 0 et 12 » et
la distribution seedée des séries ne changent pas.

Dans le menu, seule une carte réellement sélectionnée reçoit le fond
turquoise ; les autres restent blanches. Dans la forme inverse `[case]` au
carré `= résultat`, le contour du champ entoure seulement la base saisie : le
véritable élément HTML `sup` du composant commun reste bleu foncé et hors du
cadre. Le titre technique du panneau de cours n'emploie plus de caractère
exposant Unicode. Le texte du bouton orange et celui du score sont foncés pour
atteindre le contraste AA sans modifier l'identité visuelle.

Tout le graphe de modules V2 est invalidé ensemble en `v20`. Le registre
importe aussi le moteur de génération avec cette version et celui-ci importe
`question-v2` avec la même version ; aucune seconde instance non versionnée du
contrat ne doit pouvoir entrer dans la page. `/auto/` demeure strictement hors
du lot.

### D-041 — Le module hybride NC-03/NC-04 est publié comme pilote partagé

Gwenaël autorise le 8 août 2026 la publication du module pour que Claire puisse
l'essayer, tout en précisant que leurs retours pourront conduire à de nouvelles
corrections. Le statut reste donc `construit` pendant ce pilote : la route
`/automatismes-v2/` est publique mais demeure absente de la navigation, hors du
sitemap et marquée `noindex,nofollow`.

Une seule entrée « Fractions simples et décimaux » réunit les deux sens visibles
tout en conservant `NC-03` et `NC-04` dans les traces. La version finale du
pilote reprend le parcours pédagogique riche : double droite, grille de 100,
tableau de numération, groupements en unités complètes et fractions empilées.
Le cours comporte six pages et les aides construisent progressivement la même
représentation que la correction.

Une série de 20 comporte dix questions dans chaque sens, vingt valeurs
rationnelles distinctes, une double droite et deux QCM diagnostiques par sens,
un seul millième et une seule fraction libre. Les groupements gardent une
capacité fixe de deux ou quatre parts ; le reste ne peut donc plus être dessiné
à l'échelle d'une unité entière.

L'intégration part de `cff0ff2`, état de la PR #283, et conserve toutes les
finitions de `NC-01` et `NC-02`. Le graphe public reçoit une nouvelle version de
cache cohérente `v21`. Aucun fichier sous `/auto/` n'appartient au lot.

## 9 août 2026

### D-042 — NC-01 reçoit des repères ciblés sans alourdir son aide

Gwenaël valide l'enrichissement final de `NC-01` et demande sa publication. Le
cours conserve exactement trois pages ; l'aide pas à pas et les corrections ne
sont pas modifiées. La disparition de la page d'implications décidée en D-030
reste acquise : seuls des liens compacts prennent place dans les pages
existantes.

La première page relie « 3 divise 12 », « 12 est divisible par 3 » et « 12 est
un multiple de 3 ». La deuxième explicite que la divisibilité par 10 équivaut à
la divisibilité simultanée par 2 et par 5. La troisième annonce que la somme des
chiffres ne dépasse pas 36 dans le module, puis sépare visuellement les multiples
de 3 possibles de ceux de 9. Elle conserve les exemples 372 et 729, ajoute les
contre-exemples concrets 43 et 49 et rappelle que la divisibilité par 9 entraîne
celle par 3. La réaddition répétée d'une somme n'entre pas dans le cours.

Dans `NC-01/F3`, un distracteur de terminaison apparaît de façon seedée dans
environ une grille éligible sur quatre pour les critères par 3 ou par 9. Il
n'est jamais fixe, reste le seul distracteur de ce type dans sa grille et ne
change ni le nombre de bonnes réponses, ni les quotas, ni le cas naturel « Aucun ». Un vrai multiple
peut conserver la même terminaison afin de ne pas fabriquer une règle inverse.

Le turquoise des parts du schéma de partage s'étire désormais jusqu'aux bords
intérieurs, y compris sur téléphone. Tous les boutons de choix reçoivent un
état visuel pendant l'appui et déclarent `touch-action: manipulation`. La
sélection réelle reste confiée à l'événement d'activation standard `click`,
commun au toucher, à la souris et au clavier ; focus, défilement et attributs
ARIA restent inchangés. Le graphe V2 est invalidé d'un seul tenant en `v22` et
`/auto/` reste hors du lot.
