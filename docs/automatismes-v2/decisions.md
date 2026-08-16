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

### D-043 — La nomenclature devient descriptive, stable et exploitable pour le suivi

Cette décision remplace les passages de D-014, D-022, D-027, D-034, D-038 et
D-041 qui faisaient porter à un numéro de micro-notion un ordre de fabrication,
un identifiant technique ou une identité de trace. Elle ne modifie aucun choix
pédagogique, aucune famille de questions et aucun contenu déjà validé.

La liste officielle DNB fixe le **périmètre** de la première phase et permet de
constater quand elle est complète. Elle ne fixe pas l'ordre de fabrication.
Celui-ci reste un choix maths&go, modifiable sans renommer une compétence. De
même, l'ordre du menu et l'ordre de fabrication sont deux données distinctes.

L'unité de chantier est désormais le **module visible**, c'est-à-dire une entrée
que l'utilisateur peut sélectionner. Un module peut contenir une ou plusieurs
**micro-notions**, compétences atomiques utilisées pour la génération et le
suivi. « Fractions simples et décimaux » constitue ainsi un seul module visible
avec deux micro-notions. Une seule entrée visible est en chantier à la fois,
sans imposer de fabriquer séparément ses deux sens lorsqu'ils forment un
parcours pédagogique commun.

Les identifiants canoniques V2 sont descriptifs, en minuscules et indépendants
d'un programme ou d'un ordre. Les codes `NC-xx`, `AL-xx`, `PF-xx`, `GM-xx`,
`GE-xx`, `DS-xx` et `PI-xx` sont des alias humains de pilotage. `DNB26-xx` est
le libellé documentaire d'une référence normalisée de couverture, représentée
dans les données par `dnb-2026-xx` ; ce n'est pas l'identifiant d'une
compétence. Les anciens codes et anciennes routes restent lisibles par une
table d'alias ; ils ne sont plus émis comme identifiants canoniques dans les
nouvelles données.

Les sept domaines disciplinaires canoniques sont :

1. `nombres-et-calculs` — alias `NC` ;
2. `calcul-litteral-et-algebre` — alias `AL` ;
3. `proportionnalite-et-fonctions` — alias `PF` ;
4. `grandeurs-et-mesures` — alias `GM` ;
5. `espace-et-geometrie` — alias `GE` ;
6. `donnees-statistiques-et-probabilites` — alias `DS` ;
7. `pensee-informatique` — alias `PI`.

« Jeux, recherches et explorations » devient une modalité pédagogique qui peut
s'appliquer à n'importe quel domaine ; ce n'est plus un huitième domaine de
classement. L'ancien domaine composite `PG` est scindé sans modifier la
couverture ni les rangs de travail : les codes de pilotage deviennent `PF-01`
à `PF-09` puis `GM-01` à `GM-15`. Les anciens `PG-01` à `PG-24` restent des
alias historiques entrants selon la correspondance du manifeste.

Les identités existantes sont clarifiées :

- `criteres-divisibilite`, alias `NC-01` ;
- `carres-entiers-0-a-12`, alias `NC-02`, avec
  `carres-entiers-1-a-12` comme ancien alias technique et d'URL ;
- module `fractions-simples-decimaux`, contenant les micro-notions
  `fraction-vers-decimal` et `decimal-vers-fraction`, alias `NC-03` et `NC-04` ;
- module `solides-usuels`, micro-notion `reconnaitre-solides-usuels`, alias
  `GE-12` ;
- modules `volume-cube-pave`, `volume-prisme` et `volume-cylindre`, contenant
  respectivement les micro-notions `volume-cube-pave`, `volume-prisme-droit` et
  `volume-cylindre`, alias `GM-13`, `GM-14` et `GM-15`, et anciens alias
  `PG-22`, `PG-23`, `PG-24`.

La prochaine compétence reste l'ancienne `NC-05`, sous l'identifiant canonique
`ecritures-multiples-nombre`. Sa cible de couverture est `DNB26-06` ; la
coïncidence entre les deux nombres ne leur donne aucune relation d'identité.

La source canonique unique `docs/automatismes-v2/taxonomie-competences.json`
relie domaines, modules, micro-notions, alias, statuts, ordres et cibles DNB ;
les familles restent déclarées par chaque module. La carte conserve le détail
documentaire des puces sources et des correspondances avec les nouveaux
programmes, sans créer une seconde identité de compétence. Les documents de
matrice et de correspondance avec les 43 modules restent des archives de la V1
et ne peuvent pas alimenter cette nomenclature V2.

Le manifeste est versionné : une modification sémantique ne réécrit pas une
version déjà citée par des traces. L'extension au programme complet du collège
pourra rattacher de nouvelles références externes aux mêmes identifiants
descriptifs, dans une nouvelle version, sans renuméroter les compétences. Une
compétence dont le sens change reçoit en revanche un nouvel identifiant.

La trace de réponse version 2 est autonome pour l'analyse : référentiel
versionné, identifiant de module, identifiant de micro-notion, famille, version
du générateur et cibles externes utiles. Les correspondances détaillées avec
les programmes peuvent être jointes depuis la version citée du manifeste au
lieu d'être recopiées dans chaque réponse. La trace version 1 demeure lisible au
moyen des alias et des identifiants de question ; aucune donnée existante n'est
invalidée. L'identité de l'élève, le serveur, la transmission et le format
concret d'export restent hors du présent chantier et feront l'objet de décisions
ultérieures.

## 11 août 2026

### D-044 — La clôture de NC-01 clarifie les associations visuelles et les corrections

Gwenaël valide les dernières finitions de `NC-01` et autorise leur publication.
Cette décision complète D-042 sans modifier les cinq familles, leurs quotas,
l'aide pas à pas, les distracteurs ni les règles mathématiques déjà validées.

Sur la première page du cours, le cas divisible et le cas non divisible sont
deux sous-cartes explicitement titrées. Chacune regroupe son schéma, son calcul
et sa conclusion afin que l'égalité d'un cas ne puisse plus être associée au
schéma suivant, notamment lorsque les deux exemples sont empilés sur téléphone.

Sur la troisième page, la phrase technique annonçant des nombres d'au plus
quatre chiffres et une somme limitée à 36 disparaît. Les multiples de 3 et de
9 restent dans deux encadrés séparés, mais leurs listes sont ouvertes par une
ellipse. Le rappel de la table de 9 se prolonge jusqu'à 90 ; la formulation
« doit être un multiple de » ne présente donc plus ces listes comme
exhaustives.

La correction de la sélection de diviseurs conserve ses trois temps et son
contenu mathématique. Dans les deux premiers temps, chaque critère reçoit une
ligne autonome introduite par « Par 2 : », « Par 5 : », « Par 10 : »,
« Par 3 : » ou « Par 9 : ». Le générateur
`selection-diviseurs` passe en version 3 afin que cette structure soit tracée
dans les questions instanciées.

La situation de retrait minimal de F6 existe déjà et ne devient pas une
troisième sous-forme. Sa phrase finale est clarifiée partout : l'élève cherche
le plus petit nombre d'objets à retirer « pour qu'il n'en reste pas une fois la
répartition effectuée ». Le générateur `partage-court` passe en version 5 ; les
objets, contenants, valeurs, diviseurs, quotas et tirages seedés ne changent pas.

Le graphe public V2 est invalidé d'un seul tenant en `v24`. Aucun chemin sous
`/auto/` n'appartient à ce lot.

### D-045 — Le rendu mathématique et la validation sans réponse deviennent communs

Gwenaël valide le 11 août 2026 les dernières corrections de `NC-02` et demande
leur publication après une nouvelle recette complète. Cette décision remplace
dans D-040 le maintien de la borne visible « compris entre 0 et 12 » et
l'alternance entre « nombres carrés » et « carrés parfaits ». Elle étend aussi
au lecteur commun le comportement d'une réponse entièrement omise ; les
familles, leurs quotas et leurs tirages seedés ne changent pas.

Tous les calculs linéaires de NC-02 emploient le rendu HTML sémantique commun
et sa même pile typographique, y compris les nombres, les opérateurs et les
véritables éléments `sup`. Les égalités successives passent
par le composant commun d'alignement afin que leurs signes `=` partagent une
même colonne. Le brouillon SVG de rédaction algébrique n'est donc pas utilisé
pour ces expressions : les SVG restent dans les composants graphiques validés,
notamment le carré quadrillé, et ne composent jamais une puissance. Des tests
du composant et de ses usages empêchent le retour d'un assemblage typographique
local.

Tous les panneaux de cours, d'aide et de correction reçoivent le même repère
« Fais défiler ↓ ». Il n'est visible que si le contenu dépasse réellement la
zone centrale et que celle-ci se trouve encore en haut ; il disparaît dès que
l'utilisateur commence à faire défiler. Il ne dépend d'aucune notion ni d'une
hauteur d'écran codée en dur.

Dans `NC-02/F2`, la formulation verbale devient « Quel entier naturel a pour
carré 144 ? ». La forme symbolique peut demander « Complète l'égalité avec un
entier naturel. » ; la borne technique de génération n'est plus énoncée. Dans
`NC-02/F4`, les deux formulations deviennent « Sélectionne tous les carrés
parfaits. » et « Parmi ces nombres, lesquels sont des carrés parfaits ? ».

Les corrections de F1, F2, F3 et F5 réemploient le carré quadrillé commun en
mode de sens lorsqu'une base au moins égale à 2 est connue après validation.
Le même dessin relie alors côtés égaux, produit et total ; aucune grille n'est
ajoutée pour la base 0 ou 1, pour la sélection F4 ou pour le calcul court F6.

Dans « S'entraîner », une réponse correcte rappelée dans la correction est
verte, une réponse fournie et fausse est rouge, et une réponse omise reste
neutre avec une valeur visuellement vide. Si l'élève tente de valider ou
d'avancer sans avoir commencé sa réponse, cette omission compte comme une
réponse fausse, produit une seule trace et ouvre directement la correction.
Une réponse partiellement remplie ou syntaxiquement invalide reste au contraire
modifiable et ne produit pas encore de trace. « Au tableau » ne change pas :
il ne crée ni réponse élève, ni trace, ni score.

Le schéma courant devient `mathsgo.trace-reponse/3`. Chaque réponse porte le
statut `fournie` avec sa valeur ou le statut `omise` sans valeur ; une omission
est nécessairement fausse. Les traces versions 1 et 2 restent acceptées en
lecture sans migration destructive. Le graphe public est invalidé d'un seul
tenant en `v25`. La recette couvre les réponses justes, fausses, omises et
partielles, les panneaux avec et sans débordement, ainsi que les formats
`320 × 568`, `390 × 844`, `1 280 × 720`, `1 920 × 1 080` et le zoom à 200 %.
`/auto/` reste strictement hors du lot.

## 13 août 2026

### D-046 — La reprise de NC-03 / NC-04 commence par une fondation visuelle vérifiable

Gwenaël demande de reprendre le pilote `NC-03 / NC-04`, de retrouver le
matériel déjà réalisé, de rendre les objets visibles dans le Labo et de ne
modifier les questions, l'aide et le cours qu'après comparaison. Le module
reste donc `construit` et ses quotas ne changent pas dans ce lot.

Trois représentations sont désormais distinguées au lieu d'être confondues.
Le schéma de `fractions.js` reste un objet générique pour une fraction contenue
dans une seule unité. Le plateau libre
`outils/fractions/bandes_fractions.html` reste l'activité complète de classe.
Entre les deux, un nouveau SVG guidé reprend seulement sa géométrie utile à
NC-03 / NC-04 : demis jaunes, quarts verts, pièces de largeur `1/d`, unités
formées et rail décimal à la même échelle. Il traite notamment `5/2` et `7/4`
sans embarquer palette, zoom, pan, stylo ou gestion de scènes.

Le composant guidé sépare explicitement ses profils d'aide et de solution.
Une aide peut montrer les pièces, les groupements et le point cible, mais ne
doit révéler ni la dernière écriture ni l'égalité finale, y compris dans
`aria-label`, `title`, `desc` ou le texte alternatif. La solution complète
reste réservée au cours et à la correction. Cette règle prépare la future
révision de « Me guider » sans modifier encore le lecteur élève.

Le matériel de numération décimale extrait conserve l'invariant historique :
une unité rouge vaut `10 × 10` cellules, un dixième vert vaut `10 × 1` cellules
et un centième jaune vaut `1 × 1` cellule. L'orientation horizontale des
dixièmes devient le défaut de NC-03 / NC-04 : elle correspond au plateau et
aux supports de classe, et son rendu est plus compact sur téléphone. La
variante verticale demeure dans le Labo comme comparaison. Les millièmes ne
sont pas représentés par des pièces trop petites ; le tableau de numération à
quatre colonnes constitue leur représentation commune.

Le Labo enregistre ces candidats, les bandes et grilles existantes et les
droites simples ou doubles. Le nouveau préréglage de double droite aligne
`1/4`, `1/2`, `3/4` avec `0,25`, `0,5`, `0,75`. Ce travail reste local à la
branche `agent/nc03-studio-visuels`, au-dessus de `32b0664` : aucune
publication n'est autorisée par la présente décision.

### D-047 — NC-03 / NC-04 intègre les représentations sans les placer dans les questions

La fondation visuelle de D-046 est conservée comme historique de la reprise et
devient la base effective du candidat. Le module visible reste unique, avec
les deux micro-notions internes `fraction-vers-decimal` et
`decimal-vers-fraction` équilibrées à une question près. Les questions sont
désormais uniquement des productions abstraites ou des QCM diagnostiques :
aucune double droite, grille, bande ni table de numération ne figure dans leur
énoncé. Ces représentations appartiennent au cours, à « Me guider » et à la
correction.

Aux longueurs `5 / 10 / 15 / 20`, les quotas deviennent respectivement
`1 / 2 / 3 / 4` QCM et `1 / 1 / 2 / 2` productions de fraction libre. Une
fraction libre est donc présente dès cinq questions et n'est jamais convertie
en QCM. Lorsqu'il y en a deux, l'une vient des demis ou quarts et l'autre des
dixièmes ou centièmes. Toute fraction équivalente reste correcte, qu'elle soit
réduite ou non. Le produit en croix demeure la règle de validation ; une
consigne de simplification relèverait d'une autre compétence.

Le millième apparaît une fois à partir de 15 questions, dans l'un ou l'autre
sens selon la graine. Sa banque s'étend aux numérateurs de trois chiffres hors
multiples de 10, ce qui rend notamment `725/1000` possible sans dupliquer les
centièmes. Aucun matériel composé de mille petites pièces n'est créé : le
tableau de numération est sa seule représentation d'aide. Les dénominateurs du
module restent `1`, `2`, `4`, `10`, `100` et `1 000` ; les cinquièmes et les
huitièmes ne sont pas ajoutés.

Les repères nommés par les textes officiels restent des ancrages du pool et
non une banque fermée à réciter. Le choix et la position varient avec la
graine ; une série de 20 en garantit toutefois au moins deux exactement, sans
réduire les autres valeurs à ces seuls couples.

« Me guider » devient une progression de soutien en trois degrés :
« 1 · Un indice », « 2 · Voir », « 3 · Construire ». Le premier reste verbal,
le deuxième donne une représentation et le troisième guide une action. Le
dernier terme de l'égalité reste `?` avant validation dans le texte visible,
les alternatives, les attributs ARIA et les contrôles. Une aide inverse ne
doit donc jamais borner une commande par le numérateur caché. `/1` emploie des
tuiles non numérotées ; `/10` et `/100` utilisent le matériel décimal puis le
tableau ; `/1000` utilise le tableau seul. Une fraction libre part uniquement
du dernier rang écrit du décimal et conduit à une fraction décimale possible,
jamais au dénominateur canonique caché.

Le cours passe à sept pages : même nombre et sens quotient ; matériel vers
image puis symboles ; dixièmes, centièmes et millièmes ; conversion de
`147/100` en `1,47` ; conversion inverse et fraction libre ; dépassement de
l'unité avec `5/2` et `7/4` ; équivalences, ordre de grandeur et stratégie
finale. La division du numérateur par le dénominateur y est nommée comme sens
et comme méthode générale tardive, sans devenir une technique exercée dans les
séries.

Le lecteur devient l'unique source de l'aide et de la correction ; les
générateurs ne conservent que la question et les diagnostics propres aux
distracteurs QCM. Une correction de fraction libre porte « Une réponse
possible », repart du dernier rang écrit et peut montrer, par exemple,
`0,25 = 25/100 = 1/4`, sans transformer `1/4` en réponse obligatoire. Le module
reste `construit` et aucune publication n'est autorisée par D-047. La recette
automatisée, visuelle et accessible finale est achevée : `npm run verifier`
réussit 1 458 tests sur 1 458 et la campagne Chromium compte 270 états et 439
captures sur cinq fenêtres, sans erreur, débordement ni élément hors fenêtre.
Le passage à `valide` relève désormais d'un nouvel arbitrage de Gwenaël, et
non d'une validation technique implicite.

### D-048 — Le candidat NC-03 / NC-04 peut être publié pour être essayé

Le 13 août 2026, après la recette technique, visuelle et accessible de D-047,
Gwenaël autorise le téléversement, la pull request, sa fusion dans `main` et le
redéploiement du candidat afin de l'essayer directement sur téléphone et en
classe. Cette autorisation porte sur l'arbre exact vérifié du chantier ;
`/auto/` reste strictement inchangé.

Cette publication est une publication de test, pas une validation
pédagogique. Les micro-notions `fraction-vers-decimal` et
`decimal-vers-fraction` restent `construit`. La route
`/automatismes-v2/` conserve son `noindex`, reste hors sitemap et le module
n'est pas ajouté à une navigation destinée aux élèves. Le passage à `valide`
interviendra seulement après les essais et l'accord explicite de Gwenaël.

### D-049 — Une omission reste dans la question et l'aide devient atomique

Gwenaël demande le 13 août 2026 d'aligner le retour après validation sur une
question encore lisible. Cette décision remplace la règle d'ouverture
automatique de D-045, les trois degrés sélectionnables et l'organisation du
cours en sept pages de D-047.
Une réponse entièrement vide reste une omission fausse, produit une seule trace
et fige la réponse, mais elle n'ouvre plus la correction. Le retour visible est
« Pas de réponse ». Pour une saisie omise, la solution correcte apparaît
séparément en vert ; pour un QCM omis, c'est la proposition correcte qui passe
en vert. Le pavé disparaît et la barre propose « Voir l'explication » puis
« Question suivante » ou « Voir le bilan ». La correction ne s'ouvre plus que
sur une action explicite.

Après validation d'un QCM, la proposition correcte est immédiatement mise en
évidence en vert et une proposition fausse sélectionnée reste rouge. Pour une
saisie, la réponse fournie et fausse reste rouge mais la valeur attendue n'est
révélée que dans la correction. Une omission conserve une présentation neutre
et accessible pour le rappel de la réponse élève, à côté de la solution verte.
Une réponse partielle ou syntaxiquement invalide reste réparable et ne produit
toujours aucune trace.

« Me guider » conserve l'indice, la représentation et la construction comme
progression pédagogique, mais les rassemble dans un atelier unique. Le lecteur
ne mémorise plus un niveau choisi et l'interface ne présente plus trois onglets
concurrents. Les états mathématiques nécessaires à l'atelier restent conservés :
pièces posées, unités formées, rang décimal choisi et étape courante d'une
correspondance. Les masques visibles et accessibles de D-047 restent
obligatoires jusqu'à la validation de la réponse.

Dans le groupement des quarts impropres, un reste de deux quarts ajoute une
dernière transformation : les deux pièces `1/4` se fusionnent en une pièce
`1/2`. Les autres restes conservent les deux gestes « assembler » puis
« retourner les unités », sans clic supplémentaire répétitif.

Le cours est regroupé en six pages cohérentes avec cet atelier unique :
construire un demi ; construire des quarts ; nommer dixièmes, centièmes et
millièmes ; convertir `147/100` en `1,47` ; convertir un décimal en fraction en
acceptant les écritures équivalentes ; enfin former les unités et traiter le
reste. Cette dernière page réunit notamment `7/2`, `6/4`, les repères
`3/2`, `4/2`, `5/2`, `100/100` et `7/1`, puis nomme la division comme méthode
générale tardive.

## 15 août 2026

### D-050 — Les repères mobiles restent stables après interaction

Gwenaël valide trois corrections d'affichage qui complètent D-045 et D-049
sans modifier le contenu, les familles, les réponses ni les générateurs.

Le repère « Fais défiler ↓ » dépend uniquement du débordement réel et de la
position courante du panneau. Un mouvement tactile de huit pixels au plus est
encore considéré comme le sommet ; le repère disparaît pendant un vrai
défilement et réapparaît si l'utilisateur revient en haut. Aucun état
« déjà vu » ne peut donc le masquer définitivement après un rebond minime.

Dans le carré quadrillé commun, tous les nombres visibles utilisent la pile
typographique mathématique et des chiffres alignés et tabulaires, y compris le
total central comme `64`. Le mot « carreaux » conserve la police de texte. Le
réglage OpenType est déclaré dans le SVG afin de rester effectif sur Safari.

Sur un appareil tactile, la compaction de la carte dépend désormais du fait
que la question est numérique, et non de la présence momentanée du pavé. La
classe du pavé disparaît après validation conformément à D-049, mais la classe
de mise en page reste jusqu'au changement de question : le haut de la carte ne
descend donc plus lorsque le clavier se ferme.

Le graphe public V2 est invalidé d'un seul tenant en `v28`. Aucun chemin sous
`/auto/` n'appartient à ce lot.

### D-051 — Les chiffres visibles et le carré restent géométriquement cohérents

Gwenaël valide le 15 août 2026 la finition commune révélée par la recette sur
iPhone. Cette correction prolonge D-045 et D-050 sans modifier les contenus,
les familles, les réponses ni les générateurs.

Tous les nombres HTML de NC-02 utilisent désormais les chiffres alignés et
tabulaires de la pile mathématique, avec les réglages OpenType explicites
nécessaires à Safari. Cette règle vaut pour les égalités, les champs de
réponse, les rappels et les réponses correctes. Les valeurs insérées dans une
question rédigée passent également par le composant mathématique commun : le
`0` d'un titre et le `0` saisi ne changent donc plus de police.

Les messages de validation, les rappels de réponse et les pastilles de
correction sont centrés dans leurs propres boîtes, horizontalement et
verticalement. Le contenu reste groupé dans un seul conteneur afin que la mise
en valeur d'une amorce comme « Bien joué ! » ne crée pas deux éléments de
grille concurrents.

Le carré quadrillé ne contient plus aucun coin arrondi. Son contour, son fond
et le cartouche central gardent des angles droits ; la rangée orange et la
colonne turquoise restent réservées à l'aide F5, où elles rendent perceptibles
les deux facteurs égaux. Elles n'apparaissent pas dans la question ordinaire.

Enfin, une question numérique tactile reste ancrée en haut de sa zone, y
compris sur une tablette assez large pour activer la disposition ordinateur.
La disparition du pavé ne peut donc pas recentrer la carte vers le bas. Le
graphe public V2 est invalidé d'un seul tenant en `v29` et `/auto/` reste hors
du lot.

### D-052 — La pile mathématique ne dépend plus des chiffres anciens de Georgia

La recette sur iPhone qui suit D-051 montre que les déclarations OpenType ne
suffisent pas : la version système de Georgia utilisée par Safari conserve des
chiffres elzéviriens. Dans un même choix, le `4` et le `2` n'ont donc ni la
même hauteur ni la même ligne de base, alors que le DOM et la famille calculée
sont uniques. Le problème ne vient pas d'un mélange de composants ; il vient
des glyphes fournis par la fonte.

La charte passe en version 2 et retire Georgia de la pile mathématique. La pile
commune devient `'Times New Roman', Times, 'Liberation Serif', serif` : ses
chiffres sont alignés par défaut sur iOS et elle conserve l'aspect éditorial
des expressions. Les questions, choix, champs, rappels, corrections et nombres
du SVG consomment tous cette même valeur. NC-02 emploie partout la graisse 700,
réellement disponible, au lieu de demander localement une graisse 800 qui
accentuait les différences de dessin.

La recette de non-régression ajoute une graine fixe : à vingt questions,
`repro-police-132` montre le QCM d'opérations à la question 9 et l'encadrement
de `6²` à la question 12. Elle contrôle également `0`, `60`, `64` et `81`, en
question, dans un champ, dans les rappels et au centre du carré quadrillé. Une
capture Chromium vérifie la composition, mais la validation finale de cette
anomalie exige un Safari sur iPhone : un test textuel de `lnum` et `tnum` ne
prouve pas quels glyphes le système a réellement dessinés.

Le graphe public V2 et les imports de la charte sont invalidés ensemble en
`v30`. Aucun chemin sous `/auto/` n'appartient à ce lot.

### D-053 — L'aide sur la notation repart du carré concret

Gwenaël demande le 15 août 2026 que l'aide de la question « Quelle écriture
correspond à ce carré ? » ne commence plus directement par la définition
verbale. Elle suit désormais trois temps : observer le carré quadrillé de la
base courante et chercher l'opération qui donne son nombre total de carreaux ;
rappeler que « au carré » signifie « multiplié par lui-même » avec la règle
générale `a² = a × a` ; puis repérer le seul produit qui répète exactement le
même facteur.

Le carré commun est réemployé dans la première carte de l'aide, en mode
`aire-inconnue`. Le centre contient donc `?`, aucune rangée ni colonne n'est
colorée et ni le texte visible ni le libellé accessible ne révèlent le total.
Le cas `1²` peut montrer un unique carreau dans cette aide de sens, sans entrer
pour autant dans la famille F5 qui reste limitée aux côtés de 2 à 12.

La première page du cours affiche aussi explicitement `a² = a × a`, entre la
définition verbale et l'exemple qui oppose `4 × 4` à `4 × 2`. Le générateur F3
passe en version 2. Cette finition entre dans le candidat public `v30` avant sa
première publication ; elle ne crée donc pas une seconde version de cache.

### D-054 — Le cours NC-03 / NC-04 suit six pages CPA sans méthode concurrente

Gwenaël arrête le 15 août 2026 une nouvelle organisation du cours de
`fractions-simples-decimaux`. Cette décision remplace uniquement la description
des six pages donnée par D-049 ; les règles de questions, d'aide atomique, de
correction et d'omission restent inchangées.

La première page forme une unité avec deux demis, puis aligne cinq pièces d'un
dixième et une pièce d'un demi sur un même repère avant d'écrire
`1/2 = 5/10 = 0,5`. La deuxième forme quatre quarts et réorganise les mêmes 25
centièmes en l'une des quatre zones égales de l'unité ; trois zones donnent
ensuite `3/4 = 75/100 = 0,75`. Les changements de disposition ne changent ni
la quantité ni l'échelle.

La troisième page fusionne les anciennes pages de rangs et de conversion
directe. Une même quantité passe du matériel rouge, vert et jaune au tableau,
puis à la décomposition
`147/100 = 100/100 + 40/100 + 7/100 = 1 + 4/10 + 7/100 = 1,47`. Les zéros
nécessaires aux rangs vides sont explicités avec `7/100 = 0,07`. Les repères
`1/10`, `1/100` et `1/1000` restent visibles ; `725/1000 = 0,725` utilise le
tableau seul, sans fabriquer de matériel en millièmes.

La quatrième page traite le sens inverse en distinguant la forme de réponse.
Si le dénominateur est imprimé, l'élève le conserve et compte les parts
correspondantes : trois quarts atteignent `0,75`, donc `0,75 = 3/4`. Si les
deux cases sont libres, le dernier rang écrit fournit une fraction décimale
possible, par exemple `1,47 = 147/100`, et toute fraction équivalente reste
correcte ; `75/100` et `3/4` sont ainsi présentées comme deux réponses libres
valides.

La cinquième page conserve les deux cas complémentaires demandés par Gwenaël :
`7/2` forme trois unités et laisse un demi ; `6/4` forme une unité et les deux
quarts restants sont remplacés par une demi-bande de même longueur. La sixième
page construit `5/1 = 5` avec cinq bandes-unités alignées sur un rail, rappelle
les entiers cachés `4/4` et `100/100`, puis place `3/2`, `4/2` et `5/2` sur un
seul rail commun. Elle ordonne enfin les outils — repère connu, tableau de
numération, groupement — et réserve sa toute dernière phrase au sens quotient :
pour `b ≠ 0`, `a/b` est le résultat exact de `a ÷ b`.

Le composant partagé des bandes sur rail prend donc aussi en charge le
dénominateur 1 et conserve la même géométrie pour les trois repères en demis.
Cette révision n'ajoute ni cinquièmes, ni huitièmes, ni pourcentages et ne fait
pas de la division posée une technique exercée dans le module. Elle invalide
le graphe public d'un seul tenant en `v31`.

La recette dédiée du cours est rejouée après l'invalidation `v31` sur quatre
fenêtres réelles Chromium : `320 × 568`, `390 × 844`, `1 280 × 720` et
`1 920 × 1 080`. Elle couvre les six pages en haut, au milieu et en bas, soit
**24 états** et **72 captures**. Les **1 516 tests** du dépôt passent ; aucune
erreur JavaScript ni aucun débordement réel n'est relevé. L'écart maximal entre
le centre d'une barre de fraction et celui du signe `=` ou `+` voisin est de
**1,47 px**. Cette recette valide le cours D-054, sans remplacer la campagne
complète de l'atelier et des retours de réponse demandée par D-049.

### D-055 — Les rangs précèdent de nouveau les conversions et les fractions SVG ont une source unique

Après essai du cours D-054, Gwenaël constate que la fusion des rangs et de la
conversion directe demande à l'élève d'utiliser le matériel avant d'en avoir
compris les échanges. Cette décision remplace uniquement l'organisation du
cours décrite par D-054. Elle ne modifie ni les questions, ni leurs quotas, ni
l'atelier d'aide, ni les corrections, ni les règles de réponse de D-047 à
D-049.

Le cours conserve six pages. La première forme l'unité avec deux demis, puis
montre dans un rectangle-unité, sans second rail, que cinq dixièmes en
remplissent la moitié : `5/10 = 1/2`, puis le tableau donne `5/10 = 0,5`. La
deuxième forme quatre quarts et réorganise 25 puis 75 centièmes ; les égalités
séparent volontairement l'équivalence de fractions de leur lecture décimale.

La troisième page redevient le préalable sur les rangs : une unité rouge
s'échange contre dix dixièmes verts, puis un dixième vert contre dix centièmes
jaunes. Elle installe `1/10 = 0,1`, `1/100 = 0,01` et `1/1000 = 0,001` ; le
millième reste représenté par le tableau seul. La quatrième applique ensuite
ces échanges à `147/100`. Sous le matériel regroupé, les légendes rendent
explicites `100/100 = 1`, `40/100 = 4/10` et `7/100`, avant le tableau et la
décomposition qui aboutit à `1,47`. `7/100 = 0,07` et
`725/1000 = 0,725` conservent respectivement le zéro de position et la méthode
par le tableau.

La cinquième page traite le sens inverse avec un nouvel exemple, sans
reconstruire les trois quarts déjà étudiés : trois unités et six dixièmes
conduisent à
`3,6 = 3 + 6/10 = 30/10 + 6/10 = 36/10`. Le dénominateur imprimé et la
fraction libre restent distingués ; `0,75 = 75/100 = 3/4` n'est plus qu'un
rappel compact de l'équivalence déjà construite.

La sixième page rassemble les cas au-delà de l'unité sans ajouter de rail
redondant. Elle restaure les transformations complètes de `7/2`, qui forme
trois unités et conserve un demi, et de `6/4`, dont les deux quarts restants se
fusionnent en un demi. Les égalités `3/2 = 1,5`, `4/2 = 2` et `5/2 = 2,5`
rappellent les repères officiels. Cinq pièces marquées `1`, et non cinq
écritures `1/1`, atteignent la graduation 5 ; l'abstraction vient ensuite avec
`5/1 = 5` et `n/1 = n`. La liste finale ordonne les quatre outils — repère,
tableau, groupement, dénominateur 1 — et le sens quotient reste une dernière
note, jamais une division posée exercée dans le module.

La géométrie des écritures fractionnaires cesse parallèlement d'être locale
aux dessins. `mesurerEcritureFractionSvg` et `rendreFractionSvg`, dans
`packages/objets/src/expressions.js`, deviennent la source obligatoire des
fractions étagées à l'intérieur des bandes, des correspondances et des
équations SVG. Le rail compose les membres depuis leurs largeurs mesurées ; il
trace un guide pointillé à l'origine et à l'arrivée, conserve la graduation
finale comme un trait, décale la flèche après celle-ci et supprime le point rond
qui se superposait à la graduation. Le cours et les objets partagés sont
publiés ensemble par l’invalidation atomique du graphe public en `v32`.

La recette de D-054 reste un témoin historique de l'organisation remplacée.
La recette conjointe D-049/D-055 est ensuite rejouée en `v32` : **1 519 tests**
et **220 états navigateur** sur cinq fenêtres, dont 60 états de cours,
120 états d'aide couvrant les 12 profils et 35 états de réponse. Aucun
débordement, aucune erreur JavaScript ni aucune fuite n'est relevé. La revue
visuelle dédiée produit 112 captures des six pages et mesure un écart maximal
de **0,72 px** entre les barres de fraction et les signes `=` ou `+` voisins.

## 16 août 2026

### D-056 — La charte des rangs et les conversions décimales ont une source unique

Après l'essai du cours D-055, Gwenaël demande que les couleurs, la virgule du
tableau et les transformations entre matériel, fraction décimale et écriture à
virgule ne soient plus réassemblées localement. Cette décision complète D-055
sans modifier les générateurs, les familles, les valeurs, les quotas, les
formes de réponse ni la sixième page du cours. Le module reste `construit`.

La charte porte une palette sémantique unique pour les quatre rangs. Les aplats
du matériel restent rouge pour les unités, vert pour les dixièmes et jaune pour
les centièmes. Le violet prolonge cette convention pour les millièmes dans le
tableau et les écritures, sans créer de pièce miniature ; les textes sur fond
clair emploient des variantes plus sombres et contrastées. Le constructeur
`nombreDecimalAvecRangs` attribue automatiquement un rôle à chaque chiffre :
dans `1,47`, `1` est une unité, `4` un dixième et `7` un centième. La virgule
reste neutre. Cette écriture est la même dans les pages de cours, les questions
abstraites, leurs rappels, l'aide et les chaînes de correction.

Le tableau de numération devient un seul SVG paramétrique dans tous les
contextes. Sa grande virgule est placée exactement sur la séparation entre les
unités et les dixièmes. `rangFinal` conserve les zéros imposés par la tâche ;
le mode masqué remplace les chiffres par des points d'interrogation sans
laisser l'écriture, les chiffres ou le numérateur attendu dans le texte
accessible ou les attributs de données. Il remplace donc aussi l'ancien tableau
HTML local de l'aide.

Deux objets complètent cette source commune. Les échanges
`1 unité = 10 dixièmes` et `1 dixième = 10 centièmes` conservent exactement la
même empreinte de part et d'autre de la flèche. La conversion par rang accepte
une écriture finissant aux dixièmes ou aux centièmes, le sens
`fraction-vers-decimal` ou `decimal-vers-fraction`, puis les états `decompose`
et `converti-rang-final`. Les groupes gardent leur géométrie pendant le
changement de couleur et d'écriture ; un rang final explicite conserve
notamment un zéro significatif demandé par le dénominateur.

Les profils `aide-nc03` et `aide-nc04` ne sont acceptés que dans leur sens.
Le premier retire l'écriture décimale cherchée ; le second remplace le
numérateur cible par `?`. Ce contrat vaut pour le dessin, les légendes, le texte
alternatif et les attributs. Dans le lecteur, le profil `solution` révèle
l'ensemble seulement dans le cours et la correction. Les millièmes restent
hors de la conversion matérielle : toute famille `/1000` utilise exclusivement
le tableau, en cours, en aide et en correction.

Les cinq premières pages du cours sont raccordées à ces objets communs :

1. `0,5 = 5/10 = 1/2` suit deux demis, cinq dixièmes et le tableau ;
2. `0,25 = 25/100 = 1/4` puis `0,75 = 75/100 = 3/4` réemploient les
   correspondances exactes en centièmes et en quarts ;
3. les rangs sont installés par les deux échanges à empreinte identique, les
   trois repères `1/10`, `1/100`, `1/1000` et le tableau commun ;
4. `147/100` passe de 147 centièmes aux rangs usuels, puis au tableau et à
   `1,47` ; `725/1000` reste un cas de tableau seul ;
5. `3,54` passe des unités, dixièmes et centièmes à 354 centièmes, puis à
   `354/100`, dans l'autre sens.

Le contenu et l'organisation de la page 6 de D-055 restent inchangés ; ses
décimaux héritent seulement du rendu de rang commun. Dans les questions, aucune
représentation n'est ajoutée à l'énoncé et les données générées ne changent
pas ; seul le rendu décimal commun est utilisé chiffre par chiffre. Dans
« Me guider » et la correction, `/10` et `/100` réemploient la conversion
paramétrique puis le même tableau. Les fractions libres `0,5`, `0,25` et
`0,75` conservent leurs objets
de correspondance dédiés ; les autres cibles `/10` et `/100` utilisent la
conversion générique. Les mêmes briques alimentent ainsi cours, question,
rappel, aide et correction, avec un profil différent plutôt qu'un dessin
local.

Le Labo enregistre « Échanges exacts entre rangs » et
« Conversion par rang — mêmes empreintes » dans la série « Numération
décimale », à côté du matériel, du tableau et des deux correspondances. Il
reste un banc de contrôle : le lecteur importe directement les objets de
`packages/objets`, jamais le code du Studio.

### D-057 — Les erreurs plausibles restent saisissables et l'aide F5 conserve un carré neutre

Gwenaël constate le 16 août 2026 que la question inverse « Quel entier naturel
a pour carré 9 ? » empêche d'écrire `80` : la borne `12`, prévue pour les
réponses justes, sert aussi de plafond pendant la saisie. Or une erreur
plausible doit pouvoir être saisie en entier, validée, tracée puis comptée
fausse. Les trois formes de F2 et la forme F5 où le côté est à retrouver
acceptent donc désormais des saisies jusqu'à `144`. Les réponses attendues
restent comprises entre `0` et `12` ; `80`, `100`, `121` ou `144` ne deviennent
jamais justes pour autant. Le pavé tactile et le clavier physique appliquent la
même règle. Le générateur F2 passe en version 3 et F5 en version 2.

Le premier essai de l'aide F5 mettait en évidence une rangée orange et une
colonne turquoise. Cette croix ne rend pas assez clairement la lecture
« plusieurs rangées de même longueur » et rompt avec les autres vues
ordinaires du carré. Cette décision remplace donc D-051 pour cette aide : la
question F5, son aide et sa correction emploient un quadrillage neutre, sans
rangée ni colonne colorée. Le texte porte explicitement l'étape : « Repère les
n rangées du carré : chacune contient n carreaux. » Le `?` central reste visible
et le total n'est pas révélé.

Les bandes de décomposition `10 + 1` et `10 + 2` du cours pour `11²` et `12²`
restent inchangées : elles expliquent un autre calcul et ne constituent pas
l'aide F5. Aucune nouvelle variante de dessin n'est ajoutée ; le composant
« carré quadrillé » reste en version 4. Le graphe public V2 est invalidé d'un
seul tenant en `v34`. Aucun chemin sous `/auto/` n'appartient à ce lot.

### D-058 — Le cours place l'égalité avant le tableau et restaure les bandes standard

Après l'essai publié de D-056, Gwenaël valide les objets communs mais demande
une dernière révision de leur mise en récit. Cette décision ne change ni les
générateurs, ni les familles, ni les quotas, ni les formes de réponse. Le cours
conserve six pages et le module reste `construit`.

L'ordre pédagogique canonique devient **matériel, grande égalité, puis tableau
de numération comme vérification**. Le tableau n'introduit plus l'écriture : il
la confirme après que le matériel et l'égalité ont construit son sens. Les
égalités principales disposent donc d'une présentation plus grande que les
calculs secondaires, sans imposer une taille unique aux longues chaînes. La
page 1 place `0,5 = 5/10 = 1/2` sous les cinq dixièmes et avant le tableau ; la
page 2 applique le même ordre à `0,25 = 25/100 = 1/4` et
`0,75 = 75/100 = 3/4`.

La page 3 montre désormais trois échanges à empreinte identique :
`1 unité = 10 dixièmes`, `1 dixième = 10 centièmes` et
`1 unité = 100 centièmes`. Le troisième n'est plus une égalité textuelle sans
dessin : l'unité rouge et la grille de cent centièmes jaunes occupent le même
carré. Les écritures `1/10 = 0,1`, `1/100 = 0,01` et `1/1000 = 0,001` viennent
ensuite, puis seulement le tableau.

La charte complète chaque rang par une `textePedagogique`. Cette teinte est la
source canonique des écritures mathématiques du cours : elle reste clairement
dans la famille rouge, verte, jaune ou violette du matériel, tout en demeurant
lisible sur le papier clair. La teinte générale plus contrastée continue de
servir les composants d'interface et les verdicts. Le tableau commun adapte la
taille de ses en-têtes à la largeur de colonne ; « Centièmes » et « Millièmes »
ne doivent plus être rognés sur téléphone.

Les pages 4 et 5 deviennent les deux sens explicites d'une même transformation.
La page 4 part de 147 centièmes jaunes, les échange contre une unité rouge,
quatre dixièmes verts et sept centièmes jaunes, écrit la grande chaîne jusqu'à
`1,47`, puis la vérifie dans le tableau. Elle distingue sans ambiguïté
`7/100 = 0,07` de `7/1000 = 0,007`. La page 5 part des rangs de `3,54`, échange
la même quantité contre 354 centièmes, écrit la chaîne jusqu'à `354/100`, puis
la vérifie dans le tableau. Les encadrés « Le dénominateur est imprimé » et
« Les deux cases sont libres », ainsi que la recette du dernier rang, sont
retirés du cours : ils décrivaient l'interface ou la validation, pas le sens
mathématique. L'acceptation des fractions équivalentes demeure inchangée dans
le moteur de réponse et dans les corrections concernées.

La page 6 conserve ses constructions de `7/2`, `6/4`, ses trois repères de
demis et le cas du dénominateur 1. Sur téléphone, leurs rails reprennent le
format standard de largeur source `340`, pas la variante `mobile-compact` de
`260` qui comprimait les fractions dans les pièces. La liste « Choisir un
outil » est supprimée parce que ses cas se recouvraient et répétaient les six
pages. La note finale sur la barre lue comme division est également retirée :
elle n'est ni préparée ni utilisée dans ce module et doit relever d'un
enseignement ultérieur autonome.

Les mêmes objets restent partagés par le cours, « Me guider » et la correction,
avec leurs profils de révélation respectifs. D-058 modifie leur ordre et leur
présentation pédagogique, pas le contrat anti-fuite de D-056. La recette finale
compte **1 555 tests** verts. La revue du cours couvre **30 états** et
**90 captures** sur cinq fenêtres, du téléphone `320 × 568` au TNI
`1 920 × 1 080`, sans débordement de document, panneau, figure ou fraction et
sans erreur JavaScript. Les aides sont en outre contrôlées par les tests de
masque et par les captures ciblées des tableaux mobiles. Comme D-057 a déjà
publié le graphe V2 en `v34`, ce lot l'invalide atomiquement en `v35`.

### D-059 — La conversion distingue les rangs naturels et deux méthodes alternatives

Après relecture de l'exemple `2,27`, Gwenaël et Claire constatent que le
premier état du matériel anticipait déjà l'échange en écrivant
`2 = 200/100` et `2/10 = 20/100`. Cette présentation confondait la
décomposition naturelle du nombre avec sa conversion dans un rang commun.
L'état initial nomme désormais seulement les quantités telles qu'elles sont
représentées : `2`, `2/10` et `7/100`. Les égalités de conversion
`2 = 200/100`, `2/10 = 20/100` et `7/100` n'apparaissent qu'après l'échange
vers les centièmes. La même règle s'applique paramétriquement aux dixièmes et
aux centièmes, dans les deux sens.

Sur les pages 4 et 5 du cours, le matériel et le tableau ne constituent plus
deux étapes obligatoires d'une même procédure. Ils sont présentés comme deux
voies alternatives : **« Méthode 1 · Avec les plaques de couleurs »** et
**« Méthode 2 · Avec le tableau de numération »**. Aucune flèche ne relie les deux méthodes ;
les flèches internes au matériel restent réservées aux échanges qui conservent
la même quantité. La même distinction apparaît dans « Me guider » et dans la
correction des conversions en `/10` et `/100`. Les millièmes en `/1000`
restent traités par le tableau seul, sans matériel miniaturisé.

Le cours installe explicitement une bibliothèque de trois outils : les bandes
de fractions alignées sur une demi-droite ou un rail, les plaques colorées de
numération et le tableau de numération. Les pages 1 et 2 rendent les trois
outils visibles afin que l'élève les reconnaisse ; les pages 4 et 5 mobilisent
les plaques et le tableau selon les deux méthodes ci-dessus. Dans les
exercices, l'aide et les corrections, ces outils ne sont pas empilés
systématiquement : le lecteur choisit le visuel qui donne le plus directement
du sens au cas traité. Le tableau demeure la voie transversale. Ainsi,
`2/4 = 0,5` est d'abord représenté par les bandes sur rail plutôt que par une
grille de cent centièmes.

Le cours, l'aide et la correction continuent de consommer les mêmes objets
partagés et leurs profils de révélation respectifs. Cette décision ne modifie
aucun générateur, aucune question, aucune famille, aucun quota ni aucune forme
de réponse. La branche ayant déjà exposé le graphe de D-058 en `v35`, D-059
l'invalide atomiquement en `v36`. La recette finale compte **1 562 tests**
verts. La revue produit **116 captures** sur `320 × 568`, `390 × 844`,
`640 × 360`, `1 280 × 720` et `1 920 × 1 080` : aucun débordement local ou
global, aucun texte coupé, aucun élément hors panneau et aucune erreur
navigateur. Elle vérifie notamment les trois outils du cours, les deux méthodes
sans flèche concurrente, la conversion différée de `2,27`, le rail de `2/4`,
les masques NC-03/NC-04 et le tableau seul pour `/1000`.
